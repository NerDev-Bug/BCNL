// src/components/admin/header.jsx
import { BellIcon, Bars3Icon } from "@heroicons/react/24/outline"
import { createReturnRequestNotification } from "../../utils/notifications"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { signOut } from "firebase/auth"
import { auth, db } from "../../firebase"
import { toast } from "react-toastify"
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
  where,
  setDoc,
} from "firebase/firestore"

function AdminHeader({ sidebarOpen, mobileMenuOpen, onToggleMobileMenu }) {
  const [open, setOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  // ✅ NEW DELIVERY STATES
  const [deliveryEnabled, setDeliveryEnabled] = useState(false)
  const [togglingDelivery, setTogglingDelivery] = useState(false)

  const dropdownRef = useRef(null)
  const notificationsRef = useRef(null)
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [adminName, setAdminName] = useState("")
  const [markingAll, setMarkingAll] = useState(false)

  // ===============================
  // DELIVERY LISTENER (NEW)
  // ===============================
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "app"), (snap) => {
      if (snap.exists()) {
        setDeliveryEnabled(!!snap.data().deliveryEnabled)
      }
    })
    return () => unsubscribe()
  }, [])

  // ===============================
  // DELIVERY TOGGLE FUNCTION (NEW)
  // ===============================
  const handleToggleDelivery = async () => {
    if (togglingDelivery) return
    setTogglingDelivery(true)

    try {
      const ref = doc(db, "settings", "app")

      await setDoc(
        ref,
        { deliveryEnabled: !deliveryEnabled },
        { merge: true }
      )

      toast.success(
        !deliveryEnabled
          ? "Delivery Enabled"
          : "Delivery Disabled"
      )
    } catch (err) {
      console.error("Delivery toggle failed:", err)
      toast.error("Failed to update delivery setting")
    } finally {
      setTogglingDelivery(false)
    }
  }

  // ===============================
  // YOUR EXISTING CODE BELOW (UNCHANGED)
  // ===============================

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setAdminName(user.displayName || user.email?.split("@")[0] || "Admin")
      } else {
        setAdminName("")
      }
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const q = query(
      collection(db, "adminNotifications"),
      orderBy("createdAt", "desc"),
      limit(20)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((d) => {
        const data = d.data()
        let createdAtDate = null

        if (data.createdAt) {
          if (typeof data.createdAt.toDate === "function") {
            createdAtDate = data.createdAt.toDate()
          } else if (data.createdAt.seconds) {
            createdAtDate = new Date(data.createdAt.seconds * 1000)
          } else if (data.createdAt instanceof Date) {
            createdAtDate = data.createdAt
          } else if (typeof data.createdAt === "number") {
            createdAtDate = new Date(data.createdAt)
          }
        }

        return {
          id: d.id,
          message: data.message || "Notification",
          time: createdAtDate ? createdAtDate.toLocaleString() : "Just now",
          read: !!data.read,
          seen: !!data.seen,
          link: data.link || null,
          type: data.type || "general",
          data: data.data || null,
          createdAt: createdAtDate,
        }
      })

      setNotifications(items)
      setUnreadCount(items.filter((n) => !n.seen).length)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const seenOrderIds = new Set()

    const q = query(
      collection(db, "orders"),
      where("paymentStatus", "==", "return_requested")
    )

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const newDocs = snapshot.docChanges().filter(
        (change) => change.type === "added" && !seenOrderIds.has(change.doc.id)
      )

      for (const change of newDocs) {
        const order = { id: change.doc.id, ...change.doc.data() }
        seenOrderIds.add(order.id)

        if (!order.returnRequestedAt) continue

        createReturnRequestNotification(order).catch((err) =>
          console.error("Failed to create return request notification:", err)
        )
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false)
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) setNotificationsOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleNotificationClick = async (notification) => {
    if (!notification.id) return
    try {
      if (!notification.seen) {
        await updateDoc(doc(db, "adminNotifications", notification.id), { seen: true })
      }
      if (notification.link) navigate(notification.link)
      setNotificationsOpen(false)
    } catch (error) {
      console.error("Error marking notification as seen:", error)
    }
  }

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.seen)
    if (!unread.length) return

    setMarkingAll(true)
    try {
      const batch = writeBatch(db)
      unread.forEach((n) => {
        batch.update(doc(db, "adminNotifications", n.id), { seen: true })
      })
      await batch.commit()
    } catch (err) {
      toast.error("Failed to mark all notifications as read.")
    } finally {
      setMarkingAll(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast.success("Logged out successfully")
      navigate("/")
    } catch (err) {
      toast.error("Failed to logout")
    }
  }

  return (
    <header className={`bg-white/95 backdrop-blur-md shadow-md border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3 md:py-4 flex justify-between items-center fixed top-0 right-0 z-30 transition-all duration-300 left-0 ${sidebarOpen ? "md:left-64" : "md:left-20"}`}>

      <div className="flex items-center gap-2">
        <button type="button" className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100" onClick={onToggleMobileMenu}>
          <Bars3Icon className="w-6 h-6" />
        </button>
      </div>

      <div className="flex items-center gap-3 relative" ref={dropdownRef}>

        {/* ✅ DELIVERY TOGGLE BUTTON (NEW) */}
        <button
          onClick={handleToggleDelivery}
          disabled={togglingDelivery}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
            deliveryEnabled
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          <span className={`w-3 h-3 rounded-full ${deliveryEnabled ? "bg-green-500" : "bg-gray-400"}`} />
          Delivery
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen((prev) => !prev)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-[#7A3DF0] transition-colors relative"
          >
            <BellIcon className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 top-12 w-[min(22rem,calc(100vw-2rem))] max-h-[85vh] bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={handleMarkAllRead} className="text-xs text-[#7A3DF0] hover:underline">
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    No notifications
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                        !notification.seen ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <p className="text-sm">{notification.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

       {/* Profile + Dropdown */}
<div className="relative">

  <button
    onClick={() => setOpen((prev) => !prev)}
    className="flex items-center gap-2 rounded-full focus:outline-none"
  >
    <img
      src="/images/free-user-icon.png"
      alt="Admin Avatar"
      className="w-9 h-9 rounded-full border-2 border-gray-200 hover:border-[#7A3DF0]/50 transition-colors"
    />
  </button>

  {/* Dropdown Menu */}
  {open && (
    <div
      className="absolute right-0 top-12 w-48 bg-white/95 backdrop-blur-md border border-gray-200 rounded-lg shadow-lg py-2 z-50"
    >
      {adminName && (
        <div className="px-4 py-2 border-b border-gray-100">
          <p className="text-xs text-gray-500">Signed in as</p>
          <p className="text-sm font-semibold text-gray-800 truncate">
            {adminName}
          </p>
        </div>
      )}

      <button
        onClick={() => {
          navigate("/profile")
          setOpen(false)
        }}
        className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5EBFF] hover:text-[#502455]"
      >
        Profile
      </button>

      <div className="border-t border-gray-200 my-1" />

      <button
        onClick={() => {
          handleLogout()
          setOpen(false)
        }}
        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
      >
        Logout
      </button>
    </div>
  )}
</div>

      </div>
    </header>
  )
}

export default AdminHeader