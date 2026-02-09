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

        const usersList = usersSnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))

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
              className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
            >
              View
            </button>

            <button
              type="button"
              onClick={() => openDelete(row)}
              disabled={deletingId === row.id}
              className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-60"
            >
              {deletingId === row.id ? "Deleting..." : "Delete"}
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
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Users</h1>

      <DataTable columns={columns} data={users} loading={loading} />

      {/* ✅ VIEW MODAL - with top bar tabs */}
      {viewOpen && (
        <>
          {/* overlay */}
          <div onClick={closeView} className="fixed inset-0 bg-black/40 z-50" />

          {/* modal */}
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="w-full max-w-[820px] bg-white rounded-xl shadow-2xl overflow-hidden">
              {/* header */}
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <div>
                  <h2 className="text-lg font-semibold">User Details</h2>
                  <p className="text-xs text-gray-500">
                    Browse info using tabs
                  </p>
                </div>
                <button
                  onClick={closeView}
                  className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
                >
                  Close
                </button>
              </div>

              {/* ✅ TOP TAB BAR */}
              <div className="px-6 pt-4">
                <div className="flex items-center gap-2 border-b">
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
              <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">
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
                      <p className="text-sm text-gray-500">
                        No address info saved.
                      </p>
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
                      <p className="text-sm text-gray-500">No other fields.</p>
                    )}
                  </>
                )}
              </div>

              <div className="px-6 py-4 border-t flex justify-end">
                <button
                  onClick={closeView}
                  className="px-4 py-2 rounded-md bg-black text-white text-sm hover:opacity-90"
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
          <div onClick={closeDelete} className="fixed inset-0 bg-black/40 z-50" />

          {/* modal */}
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="w-full max-w-[520px] bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-red-600">Delete User</h2>
                <p className="text-sm text-gray-600 mt-1">
                  This action cannot be undone.
                </p>
              </div>

              <div className="p-6 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Detail label="Email" value={userToDelete?.email} />
                  <Detail label="Username" value={userToDelete?.username} />
                  <Detail label="User ID" value={userToDelete?.id} />
                  <Detail label="Role" value={userToDelete?.role || "User"} />
                </div>

                <p className="text-xs text-gray-500">
                  Note: This deletes only the Firestore document in <b>users</b>. Firebase
                  Auth account is not removed unless you delete it via Admin SDK.
                </p>
              </div>

              <div className="px-6 py-4 border-t flex items-center justify-end gap-2">
                <button
                  onClick={closeDelete}
                  disabled={deletingId === userToDelete?.id}
                  className="px-4 py-2 rounded-md border text-sm hover:bg-gray-50 disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDelete}
                  disabled={deletingId === userToDelete?.id}
                  className="px-4 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-60"
                >
                  {deletingId === userToDelete?.id ? "Deleting..." : "Yes, Delete"}
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
      className={[
        "px-3 py-2 text-sm -mb-px border-b-2",
        active
          ? "border-black font-semibold text-black"
          : "border-transparent text-gray-500 hover:text-black",
      ].join(" ")}
    >
      {children}
    </button>
  )
}

function Detail({ label, value }) {
  return (
    <div className="border rounded-lg p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium break-words whitespace-pre-wrap">
        {value || "—"}
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
