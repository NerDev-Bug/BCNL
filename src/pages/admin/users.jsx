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
import DataTable from "../../components/common/DataTable"
import { StatusBadge } from "../../components/common/StatusBadge"

function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  // ✅ view modal
  const [selectedUser, setSelectedUser] = useState(null)
  const [viewOpen, setViewOpen] = useState(false)

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

  const formatDate = (timestamp) => {
    if (!timestamp) return "—"
    const date =
      typeof timestamp === "object" && timestamp.seconds
        ? new Date(timestamp.seconds * 1000)
        : new Date(timestamp)

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

  const openView = (user) => {
    setSelectedUser(user)
    setViewOpen(true)
  }

  const closeView = () => {
    setViewOpen(false)
    setSelectedUser(null)
  }

  const handleDelete = async (user) => {
    const ok = window.confirm(
      `Delete this user?\n\nEmail: ${user?.email || "—"}\nUsername: ${
        user?.username || "—"
      }\n\nThis cannot be undone.`
    )
    if (!ok) return

    try {
      setDeletingId(user.id)
      await deleteDoc(doc(db, "users", user.id))
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
    } catch (err) {
      console.error("Delete failed:", err)
      alert("Delete failed. Check permissions / rules.")
    } finally {
      setDeletingId(null)
    }
  }

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
              onClick={() => handleDelete(row)}
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

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Users</h1>

      <DataTable columns={columns} data={users} loading={loading} />

      {/* ✅ View Modal */}
      {viewOpen && (
        <>
          {/* overlay */}
          <div
            onClick={closeView}
            className="fixed inset-0 bg-black/40 z-50"
          />

          {/* modal */}
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="w-full max-w-[640px] bg-white rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">User Details</h2>
                <button
                  onClick={closeView}
                  className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50"
                >
                  Close
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* NOTE: No password shown (Firestore doesn't store Auth password anyway) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Detail label="User ID" value={selectedUser?.id} />
                  <Detail label="Email" value={selectedUser?.email} />
                  <Detail label="Username" value={selectedUser?.username} />
                  <Detail label="Role" value={selectedUser?.role || "User"} />
                  <Detail
                    label="Status"
                    value={selectedUser?.status || "ACTIVE"}
                  />
                  <Detail
                    label="Created At"
                    value={formatDate(selectedUser?.createdAt)}
                  />
                </div>

                {/* extra personal info if you have it */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Detail label="Phone" value={selectedUser?.phone} />
                  <Detail label="Address" value={selectedUser?.address} />
                </div>
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
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div className="border rounded-lg p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium break-words">{value || "—"}</p>
    </div>
  )
}

export default UsersPage
