import { useEffect, useRef } from "react"
import { Link } from "react-router-dom"

export default function NotificationHistory({
  open,
  onClose,
  notifications = [],
  visibleCount = 5,
}) {
  const ref = useRef(null)

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
          visible.map((n) => (
            <div
              key={n.id}
              className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50"
            >
              <p className="text-sm text-gray-800">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {n.time}
              </p>
            </div>
          ))
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
