import { useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { doc, updateDoc } from "firebase/firestore"
import { db } from "../../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "../../firebase"

export default function NotificationHistory({
  open,
  onClose,
  notifications = [],
  visibleCount = 5,
}) {
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open, onClose])

  const handleNotificationClick = async (notification) => {
    // Disable click if notification is already read
    if (notification.read) {
      return
    }

    // Disable click if notification is older than 1 day
    if (notification.createdAt instanceof Date) {
      const oneDayMs = 24 * 60 * 60 * 1000
      const isExpired = Date.now() - notification.createdAt.getTime() > oneDayMs
      if (isExpired) {
        return
      }
    }

    // Mark as read
    if (notification.id && !notification.read) {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            const notifRef = doc(db, "users", user.uid, "notifications", notification.id)
            await updateDoc(notifRef, { read: true })
          } catch (error) {
            console.error("Error marking notification as read:", error)
          }
        }
      })
    }

    // Navigate if link exists
    if (notification.link) {
      navigate(notification.link)
      onClose()
    }
  }

  if (!open) return null

  const visible = notifications.slice(0, visibleCount)
  const hasMore = notifications.length > visibleCount

  return (
    <div
      ref={ref}
      className="absolute right-0 top-10 w-80 bg-white border rounded-xl shadow-lg z-50 overflow-hidden"
    >
      <div className="px-4 py-3 border-b font-semibold text-sm">
        Notifications
      </div>

      <div className="max-h-80 overflow-y-auto">
        {visible.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-500 text-center">
            No notification available right now
          </p>
        ) : (
          visible.map((n) => {
            const oneDayMs = 24 * 60 * 60 * 1000
            const isExpired =
              n.createdAt instanceof Date &&
              Date.now() - n.createdAt.getTime() > oneDayMs

            const isClickable = !n.read && !isExpired && n.link

            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`px-4 py-3 border-b last:border-b-0 ${
                  isClickable ? "cursor-pointer hover:bg-gray-50" : "cursor-default opacity-70"
                } ${!n.read ? "bg-blue-50" : ""}`}
              >
                <p className="text-sm text-gray-800">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {n.time}
                  {isExpired && " • expired"}
                  {n.read && !isExpired && " • seen"}
                </p>
              </div>
            )
          })
        )}
      </div>

      {hasMore && (
        <Link
          to="/notifications"
          onClick={onClose}
          className="block text-center text-sm font-medium text-[#7B2220] px-4 py-3 border-t hover:bg-gray-50"
        >
          See more
        </Link>
      )}
    </div>
  )
}
