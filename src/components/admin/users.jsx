import { useEffect, useMemo, useState } from "react"
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
} from "firebase/firestore"
import { db } from "../../firebase"
import { registerUser } from "../../services/authService"
import DataTable from "../common/DataTable"
import { StatusBadge } from "../common/StatusBadge"
import ConfirmationModal from "../common/ConfirmationModal"
import { toast } from "react-toastify"

function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  // ✅ view modal
  const [selectedUser, setSelectedUser] = useState(null)
  const [viewOpen, setViewOpen] = useState(false)

  // ✅ view tabs
  const [activeViewTab, setActiveViewTab] = useState("account") // account | address | other

  // ✅ Confirmation modal state
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null,
    type: "confirm",
    confirmButtonColor: "bg-[#7B2220]",
  })

  // ✅ delete loading per row
  const [deletingId, setDeletingId] = useState(null)

  // ✅ Create Admin modal
  const [createAdminOpen, setCreateAdminOpen] = useState(false)
  const [createAdminForm, setCreateAdminForm] = useState({ email: "", username: "", password: "", confirmPassword: "" })
  const [createAdminLoading, setCreateAdminLoading] = useState(false)
  const [createAdminError, setCreateAdminError] = useState("")

  const closeConfirmationModal = () => {
    setConfirmationModal((prev) => ({ ...prev, isOpen: false }))
  }

  const openCreateAdmin = () => {
    setCreateAdminForm({ email: "", username: "", password: "", confirmPassword: "" })
    setCreateAdminError("")
    setCreateAdminOpen(true)
  }

  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    const { email, username, password, confirmPassword } = createAdminForm
    if (!email || !username || !password) {
      setCreateAdminError("All fields are required.")
      return
    }
    if (password !== confirmPassword) {
      setCreateAdminError("Passwords do not match.")
      return
    }
    if (password.length < 6) {
      setCreateAdminError("Password must be at least 6 characters.")
      return
    }
    setCreateAdminError("")
    setCreateAdminLoading(true)
    try {
      // Register user via authService (creates Firebase Auth + Firestore user doc with role=customer)
      const newUser = await registerUser(email, password, username)
      // Elevate to admin in Firestore
      const { doc: firestoreDoc, updateDoc: firestoreUpdateDoc } = await import("firebase/firestore")
      await firestoreUpdateDoc(firestoreDoc(db, "users", newUser.uid), { role: "admin" })
      toast.success(`Admin account created for ${username}`)
      setCreateAdminOpen(false)
      // Refresh list
      const snap = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")))
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((u) => String(u.role || "").toLowerCase() === "admin")
      setUsers(list)
    } catch (err) {
      setCreateAdminError(err?.message || "Failed to create admin account.")
    } finally {
      setCreateAdminLoading(false)
    }
  }

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersCollection = collection(db, "users")
        const q = query(usersCollection, orderBy("createdAt", "desc"))
        const usersSnapshot = await getDocs(q)

        const usersList = usersSnapshot.docs
          .map((d) => ({
            id: d.id,
            ...d.data(),
          }))
          .filter((u) => String(u.role || "").toLowerCase() === "admin")

        setUsers(usersList)
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  // ✅ close modals on ESC
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (viewOpen) closeView()
        if (confirmationModal.isOpen) closeConfirmationModal()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [viewOpen, confirmationModal.isOpen])

  const formatDate = (timestamp) => {
    if (!timestamp) return "—";
    const date =
      typeof timestamp === "object" && timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return "—";
    const date =
      typeof timestamp === "object" && timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ---------- VIEW ----------
  const openView = (user) => {
    setSelectedUser(user)
    setViewOpen(true)
    setActiveViewTab("account") // default tab
  }

  const closeView = () => {
    setViewOpen(false)
    setSelectedUser(null)
    setActiveViewTab("account")
  }

  // ---------- DELETE ----------
  const openDelete = (user) => {
    setConfirmationModal({
      isOpen: true,
      title: "Delete User",
      message: `Are you sure you want to delete "${user.username || user.email}"? This action cannot be undone. This deletes only the Firestore document in users. Firebase Auth account is not removed unless you delete it via Admin SDK.`,
      onConfirm: async () => {
        try {
          setDeletingId(user.id)
          await deleteDoc(doc(db, "users", user.id))
          setUsers((prev) => prev.filter((u) => u.id !== user.id))
          closeConfirmationModal()
        } catch (err) {
          console.error("Delete failed:", err)
          setConfirmationModal({
            isOpen: true,
            title: "Error",
            message: "Delete failed. Check permissions / rules.",
            onConfirm: closeConfirmationModal,
            type: "alert",
            confirmButtonColor: "bg-red-600",
          })
        } finally {
          setDeletingId(null)
        }
      },
      type: "confirm",
      confirmButtonColor: "bg-red-600",
    })
  }

  // ---------- TABLE ----------
  const columns = useMemo(
    () => [
      {
        key: "email",
        header: "Email",
        render: (row) => row.email || "—",
      },
      {
        key: "username",
        header: "User Name",
        render: (row) => row.username || "—",
      },
      {
        key: "role",
        header: "Role/s",
        render: (row) => row.role || "User",
      },
      {
        key: "createdAt",
        header: "Created At",
        render: (row) => (
          <div>
            <p className="text-xs">{formatDate(row.createdAt)}</p>
            <p className="text-[0.65rem] text-gray-400">
              {formatTime(row.createdAt)}
            </p>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => <StatusBadge value={row.status || "ACTIVE"} />,
      },
      {
        key: "points",
        header: "Points",
      },
      {
        key: "actions",
        header: "Actions",
        render: (row) => (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => openView(row)}
              className="px-4 py-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all duration-200 border border-blue-200 text-sm font-medium"
              title="View user details"
            >
              👁️ View
            </button>

            <button
              type="button"
              onClick={() => openDelete(row)}
              disabled={deletingId === row.id}
              className="px-4 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all duration-200 border border-red-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete user"
            >
              {deletingId === row.id ? "⏳ Deleting..." : "🗑️ Delete"}
            </button>
          </div>
        ),
      },
    ],
    [deletingId]
  )

  // ---------- VIEW DATA (split into tabs) ----------
  const viewTabsData = useMemo(() => {
    if (!selectedUser) return null
    const u = selectedUser

    // ---------- ACCOUNT ----------
    const accountInfo = [
      { label: "User ID", value: u.id },
      { label: "Email", value: u.email },
      { label: "Username", value: u.username },
      { label: "Role", value: u.role || "User" },
      { label: "Status", value: u.status || "ACTIVE" },
      { label: "Created At", value: formatDate(u.createdAt) },
    ]

    // ---------- ADDRESS ----------
    // ---------- ADDRESS ----------
    const addressInfo = []

    // phone-like fields (keep ONLY phone)
    if (u.phone) {
      addressInfo.push({
        label: "Phone",
        value: String(u.phone),
      })
    }

    // structured address object → FULL ADDRESS ONLY
    if (u.address && typeof u.address === "object") {
      const a = u.address

      const fullAddress = [
        a.streetName,
        a.houseNumber,
        a.city,
        a.postalCode,
        a.country,
      ]
        .filter(Boolean)
        .join(", ")

      if (fullAddress) {
        addressInfo.push({
          label: "Full Address",
          value: fullAddress,
        })
      }
    }

    // ---------- OTHER FIELDS ----------
    const exclude = new Set([
      "id",
      "email",
      "username",
      "role",
      "status",
      "createdAt",
      "address",
      "phone",
      "mobile",
      "contactNumber",
      "cartItems",
      "points",
    ])

    const otherFields = Object.entries(u)
      .filter(([key]) => !exclude.has(key))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({
        label: toTitle(key),
        value: formatValue(value, formatDate),
      }))

    const points = u.points != null ? Number(u.points) : 0

    return { accountInfo, addressInfo, otherFields, points }
  }, [selectedUser])

  return (
    <div className="min-h-screen min-w-0 bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full min-w-0">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8 min-w-0 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">Users Management</h1>
            <p className="text-xs sm:text-sm text-gray-500 break-words">View and manage admin accounts and information</p>
          </div>
          <button
            type="button"
            onClick={openCreateAdmin}
            className="flex-shrink-0 px-4 py-2 rounded-xl bg-[#7B2220] text-white text-sm font-semibold hover:bg-[#8B3230] transition-all shadow-md hover:shadow-lg"
          >
            + Create Admin
          </button>
        </div>

        {/* Table */}
        {/* TABLE – same scroll-inside pattern as src/components/order */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden min-w-0">
          <div className="w-full min-w-0">
            <DataTable columns={columns} data={users} loading={loading} />
          </div>
        </div>
      </div>

      {/* ✅ VIEW MODAL - with top bar tabs */}
      {viewOpen && (
        <>
          {/* overlay */}
          <div onClick={closeView} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />

          {/* modal */}
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="w-full max-w-[900px] bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              {/* header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Browse user information using tabs below
                  </p>
                </div>
                <button
                  onClick={closeView}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all"
                  title="Close"
                >
                  ×
                </button>
              </div>

              {/* ✅ TOP TAB BAR */}
              <div className="px-8 pt-6 bg-white border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <TabButton
                    active={activeViewTab === "account"}
                    onClick={() => setActiveViewTab("account")}
                  >
                    Account Info
                  </TabButton>
                  <TabButton
                    active={activeViewTab === "address"}
                    onClick={() => setActiveViewTab("address")}
                  >
                    Address Info
                  </TabButton>
                  <TabButton
                    active={activeViewTab === "other"}
                    onClick={() => setActiveViewTab("other")}
                  >
                    Other Fields
                  </TabButton>
                </div>
              </div>

              {/* body (scrollable if too long) */}
              <div className="px-8 py-6 max-h-[calc(90vh-200px)] overflow-y-auto bg-gray-50">
                {/* ACCOUNT TAB */}
                {activeViewTab === "account" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {viewTabsData?.accountInfo.map((item) => (
                      <Detail
                        key={item.label}
                        label={item.label}
                        value={item.value}
                      />
                    ))}
                  </div>
                )}

                {/* ADDRESS TAB */}
                {activeViewTab === "address" && (
                  <>
                    {viewTabsData?.addressInfo?.length ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {viewTabsData.addressInfo.map((item) => (
                          <Detail
                            key={item.label}
                            label={item.label}
                            value={item.value}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
                        <div className="text-4xl mb-3">📍</div>
                        <p className="text-sm font-medium text-gray-600">No address info saved</p>
                        <p className="text-xs text-gray-500 mt-1">This user hasn't provided address information</p>
                      </div>
                    )}
                  </>
                )}

                {/* OTHER TAB */}
                {activeViewTab === "other" && (
                  <div className="space-y-6">
                    {/* Points */}
                    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 max-w-xs">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Points</p>
                      <p className="text-2xl font-bold text-gray-900">{viewTabsData?.points ?? 0}</p>
                    </div>
                    {/* Rest of other fields */}
                    {viewTabsData?.otherFields?.length ? (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Other fields</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {viewTabsData.otherFields.map((item) => (
                            <Detail
                              key={item.label}
                              label={item.label}
                              value={item.value}
                            />
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="px-8 py-6 border-t border-gray-200 bg-white flex justify-end">
                <button
                  onClick={closeView}
                  className="px-8 py-3 rounded-xl bg-[#7B2220] text-white font-semibold hover:bg-[#8B3230] transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ✅ CREATE ADMIN MODAL */}
      {createAdminOpen && (
        <>
          <div onClick={() => setCreateAdminOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Create Admin Account</h2>
                  <p className="text-xs text-gray-500 mt-0.5">New user will be registered with admin role</p>
                </div>
                <button onClick={() => setCreateAdminOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100">×</button>
              </div>

              <form onSubmit={handleCreateAdmin} className="px-6 py-5 space-y-4">
                {createAdminError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2 rounded-lg">
                    {createAdminError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={createAdminForm.email}
                    onChange={(e) => setCreateAdminForm((f) => ({ ...f, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B2220]"
                    placeholder="admin@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={createAdminForm.username}
                    onChange={(e) => setCreateAdminForm((f) => ({ ...f, username: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B2220]"
                    placeholder="admin_username"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={createAdminForm.password}
                    onChange={(e) => setCreateAdminForm((f) => ({ ...f, password: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B2220]"
                    placeholder="Min. 6 characters"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={createAdminForm.confirmPassword}
                    onChange={(e) => setCreateAdminForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7B2220]"
                    placeholder="Repeat password"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateAdminOpen(false)}
                    className="flex-1 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createAdminLoading}
                    className="flex-1 px-4 py-2 rounded-xl bg-[#7B2220] text-white text-sm font-semibold hover:bg-[#8B3230] transition shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {createAdminLoading ? "Creating..." : "Create Admin"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={closeConfirmationModal}
        onConfirm={() => {
          if (confirmationModal.onConfirm) {
            confirmationModal.onConfirm()
          }
        }}
        title={confirmationModal.title}
        message={confirmationModal.message}
        type={confirmationModal.type}
        confirmButtonColor={confirmationModal.confirmButtonColor}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        loading={deletingId !== null}
      />
    </div>
  )
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        relative px-6 py-3 text-sm font-semibold transition-all duration-200
        rounded-t-lg border-b-2 border-transparent
        ${
          active
            ? "text-[#7B2220] border-[#7B2220] bg-[#7B2220]/5"
            : "text-gray-600 hover:text-[#7B2220] hover:bg-gray-50"
        }
      `}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7B2220] rounded-full" />
      )}
    </button>
  )
}

function Detail({ label, value }) {
  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-[#7B2220]/30 hover:shadow-md transition-all duration-200">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{label}</p>
      <p className="text-sm font-medium text-gray-900 break-words whitespace-pre-wrap">
        {value || <span className="text-gray-400">—</span>}
      </p>
    </div>
  )
}

// ✅ helper: stringify Firestore values safely
function formatValue(value, formatDate) {
  if (value == null) return "—"

  // Firestore Timestamp-like object
  if (
    typeof value === "object" &&
    value?.seconds != null &&
    value?.nanoseconds != null
  ) {
    return formatDate(value)
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return "[]"
    return value
      .map((v) =>
        typeof v === "object" ? JSON.stringify(v, null, 2) : String(v)
      )
      .join(", ")
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }

  return String(value)
}

// ✅ helper: pretty labels (phoneNumber -> Phone Number)
function toTitle(str) {
  return String(str)
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default UsersPage
