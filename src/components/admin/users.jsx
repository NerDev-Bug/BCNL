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
import DataTable from "../common/DataTable"
import { StatusBadge } from "../common/StatusBadge"

function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  // ✅ view modal
  const [selectedUser, setSelectedUser] = useState(null)
  const [viewOpen, setViewOpen] = useState(false)

  // ✅ view tabs
  const [activeViewTab, setActiveViewTab] = useState("account") // account | address | other

  // ✅ delete confirm modal
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState(null)

  // ✅ delete loading per row
  const [deletingId, setDeletingId] = useState(null)

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
        if (deleteOpen) closeDelete()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [viewOpen, deleteOpen])

  const formatDate = (timestamp) => {
    if (!timestamp) return "—"

    const date =
      typeof timestamp === "object" && timestamp?.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp)

    if (Number.isNaN(date.getTime())) return "—"

    return (
      date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }) +
      " " +
      date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    )
  }

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
    setUserToDelete(user)
    setDeleteOpen(true)
  }

  const closeDelete = () => {
    setDeleteOpen(false)
    setUserToDelete(null)
  }

  const confirmDelete = async () => {
    if (!userToDelete?.id) return

    try {
      setDeletingId(userToDelete.id)
      await deleteDoc(doc(db, "users", userToDelete.id))
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id))
      closeDelete()
    } catch (err) {
      console.error("Delete failed:", err)
      alert("Delete failed. Check permissions / rules.")
    } finally {
      setDeletingId(null)
    }
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
        render: (row) => formatDate(row.createdAt),
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
    ])

    const otherFields = Object.entries(u)
      .filter(([key]) => !exclude.has(key))
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => ({
        label: toTitle(key),
        value: formatValue(value, formatDate),
      }))

    return { accountInfo, addressInfo, otherFields }
  }, [selectedUser])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Users Management</h1>
          <p className="text-sm text-gray-500">View and manage user accounts and information</p>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <DataTable columns={columns} data={users} loading={loading} />
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
                  <>
                    {viewTabsData?.otherFields?.length ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {viewTabsData.otherFields.map((item) => (
                          <Detail
                            key={item.label}
                            label={item.label}
                            value={item.value}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-200">
                        <div className="text-4xl mb-3">📋</div>
                        <p className="text-sm font-medium text-gray-600">No other fields</p>
                        <p className="text-xs text-gray-500 mt-1">No additional information available</p>
                      </div>
                    )}
                  </>
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

      {/* ✅ DELETE CONFIRM MODAL */}
      {deleteOpen && (
        <>
          {/* overlay */}
          <div onClick={closeDelete} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />

          {/* modal */}
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="w-full max-w-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-red-600">Delete User</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8 space-y-6 bg-gray-50">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">User Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Detail label="Email" value={userToDelete?.email} />
                    <Detail label="Username" value={userToDelete?.username} />
                    <Detail label="User ID" value={userToDelete?.id} />
                    <Detail label="Role" value={userToDelete?.role || "User"} />
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <p className="text-sm text-yellow-800">
                    <span className="font-semibold">Note:</span> This deletes only the Firestore document in <b>users</b>. Firebase
                    Auth account is not removed unless you delete it via Admin SDK.
                  </p>
                </div>
              </div>

              <div className="px-8 py-6 border-t border-gray-200 bg-white flex items-center justify-end gap-3">
                <button
                  onClick={closeDelete}
                  disabled={deletingId === userToDelete?.id}
                  className="px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDelete}
                  disabled={deletingId === userToDelete?.id}
                  className="px-8 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {deletingId === userToDelete?.id ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <span>🗑️</span>
                      <span>Yes, Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
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
