// Full-page notifications list for logged-in users
import { useEffect, useState } from "react"
import { collection, onSnapshot, doc, updateDoc, writeBatch, query, orderBy } from "firebase/firestore"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "../firebase"
import { useNavigate } from "react-router-dom"
import { Bell, CheckCheck } from "lucide-react"

export default function Notifications() {
  const [user, setUser] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) { navigate("/"); return; }
      setUser(u)
    })
    return () => unsub()
  }, [navigate])

  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("createdAt", "desc")
    )

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => {
        const nd = d.data()
        let createdAt = null
        if (nd.createdAt?.toDate) createdAt = nd.createdAt.toDate()
        else if (nd.createdAt?.seconds) createdAt = new Date(nd.createdAt.seconds * 1000)
        return { id: d.id, ...nd, createdAt }
      })
      setNotifications(data)
      setLoading(false)
    })

    return () => unsub()
  }, [user])

  const formatTime = (date) => {
    if (!date) return ""
    const now = Date.now()
    const diffMs = now - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1) return "Just now"
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h ago`
    return date.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })
  }

  const markRead = async (n) => {
    if (n.read || !user) return
    try {
      await updateDoc(doc(db, "users", user.uid, "notifications", n.id), { read: true })
      if (n.link) navigate(n.link)
    } catch (err) {
      console.error("Error marking notification as read:", err)
    }
  }

  const markAllRead = async () => {
    if (!user || markingAll) return
    const unread = notifications.filter((n) => !n.read)
    if (!unread.length) return

    setMarkingAll(true)
    try {
      const batch = writeBatch(db)
      unread.forEach((n) => {
        batch.update(doc(db, "users", user.uid, "notifications", n.id), { read: true })
      })
      await batch.commit()
    } catch (err) {
      console.error("Mark all read failed:", err)
    } finally {
      setMarkingAll(false)
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-16 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-[#7B2220]" />
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-[#7B2220] text-white text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              disabled={markingAll}
              className="flex items-center gap-1.5 text-sm text-[#7B2220] font-semibold hover:opacity-80 transition disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              {markingAll ? "Marking..." : "Mark all read"}
            </button>
          )}
        </div>

        {/* List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col gap-4 p-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Bell className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-gray-500 font-medium">No notifications yet</p>
              <p className="text-sm text-gray-400 mt-1">We'll notify you about your orders and updates here.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.map((n) => {
                const isClickable = !n.read && n.link
                return (
                  <li
                    key={n.id}
                    onClick={() => markRead(n)}
                    className={`flex items-start gap-4 px-5 py-4 transition-colors
                      ${isClickable ? "cursor-pointer hover:bg-gray-50" : "cursor-default"}
                      ${!n.read ? "bg-blue-50/60" : ""}
                    `}
                  >
                    {/* Unread dot */}
                    <div className={`mt-1.5 flex-shrink-0 w-2.5 h-2.5 rounded-full ${!n.read ? "bg-[#7B2220]" : "bg-transparent"}`} />

                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${!n.read ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                        {n.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatTime(n.createdAt)}
                        {n.read && " · Seen"}
                      </p>
                    </div>

                    {isClickable && (
                      <span className="flex-shrink-0 text-xs text-[#7B2220] font-medium self-center">View →</span>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

      </div>
    </div>
  )
}
