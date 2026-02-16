// src/components/admin/header.jsx
import { BellIcon, Bars3Icon } from "@heroicons/react/24/outline"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { signOut } from "firebase/auth"
import { auth } from "../../firebase"
import { toast } from "react-toastify"
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  where,
  getDocs,
} from "firebase/firestore"
import { db } from "../../firebase"
import { createReturnRequestNotification } from "../../utils/notifications"

function AdminHeader({ sidebarOpen, mobileMenuOpen, onToggleMobileMenu }) {
  const [open, setOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const notificationsRef = useRef(null)
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // ✅ Listen for admin notifications
  useEffect(() => {
    console.log("Setting up admin notifications listener...")
    const notificationsCollection = collection(db, "adminNotifications")
    const q = query(
      notificationsCollection,
      orderBy("createdAt", "desc"),
      limit(20)
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log("Admin notifications snapshot received:", snapshot.size, "notifications")
        const items = snapshot.docs.map((d) => {
          const data = d.data()
          
          // Handle different timestamp formats
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
            time: createdAtDate
              ? createdAtDate.toLocaleString()
              : "Just now",
            read: !!data.read,
            seen: !!data.seen,
            link: data.link || null,
            type: data.type || "general",
            data: data.data || null,
            createdAt: createdAtDate,
          }
        })

        console.log("Processed notifications:", items.length)
        console.log("Unread count:", items.filter((n) => !n.seen).length)
        setNotifications(items)
        setUnreadCount(items.filter((n) => !n.seen).length)
      },
      (err) => {
        console.error("Admin notifications listener error:", err)
        console.error("Error details:", {
          code: err.code,
          message: err.message,
        })
        setNotifications([])
      }
    )

    return () => {
      console.log("Cleaning up admin notifications listener")
      unsubscribe()
    }
  }, [])

  // ✅ Backup: Listen for new return_requested orders and create notifications if missing
  useEffect(() => {
    console.log("Setting up return_requested orders listener (backup)...")
    const ordersCollection = collection(db, "orders")
    const q = query(
      ordersCollection,
      where("paymentStatus", "==", "return_requested")
    )

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        console.log("Return requested orders snapshot:", snapshot.size, "orders")
        
        // Check each return_requested order to see if notification exists
        for (const docSnapshot of snapshot.docs) {
          const order = { id: docSnapshot.id, ...docSnapshot.data() }
          
          // Only create notification if returnRequestedAt is recent (within last 5 minutes)
          if (order.returnRequestedAt) {
            const requestedTime = order.returnRequestedAt?.seconds
              ? new Date(order.returnRequestedAt.seconds * 1000)
              : order.returnRequestedAt instanceof Date
              ? order.returnRequestedAt
              : null

            if (requestedTime) {
              // Check if notification already exists for this order
              try {
                const notificationsCollection = collection(db, "adminNotifications")
                const notifQuery = query(
                  notificationsCollection,
                  where("data.orderId", "==", order.id),
                  where("type", "==", "return_request")
                )
                
                const notifSnapshot = await getDocs(notifQuery)
                
                if (notifSnapshot.empty) {
                  console.log("Creating notification for return request order:", order.id)
                  try {
                    await createReturnRequestNotification(order)
                    console.log("✅ Notification created successfully for order:", order.id)
                  } catch (err) {
                    console.error("❌ Failed to create notification:", err)
                    console.error("Error details:", {
                      code: err.code,
                      message: err.message,
                    })
                  }
                } else {
                  console.log("Notification already exists for order:", order.id)
                }
              } catch (checkError) {
                console.error("Error checking for existing notification:", checkError)
              }
            }
          }
        }
      },
      (err) => {
        console.error("Return requested orders listener error:", err)
      }
    )

    return () => {
      console.log("Cleaning up return_requested orders listener")
      unsubscribe()
    }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target)
      ) {
        setNotificationsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // ✅ Handle notification click
  const handleNotificationClick = async (notification) => {
    if (!notification.id) return

    try {
      // Mark notification as seen
      if (!notification.seen) {
        const notifRef = doc(db, "adminNotifications", notification.id)
        await updateDoc(notifRef, { seen: true })
      }

      // Navigate to link if exists
      if (notification.link) {
        navigate(notification.link)
      }
      setNotificationsOpen(false)
    } catch (error) {
      console.error("Error marking notification as seen:", error)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast.success("Logged out successfully")
      navigate("/")
    } catch (err) {
      console.error("Logout failed", err)
      toast.error("Failed to logout")
    }
  }

  return (
    <header
      className={`bg-white/95 backdrop-blur-md shadow-md border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3 md:py-4 flex justify-between items-center
      fixed top-0 right-0 z-30 transition-all duration-300 left-0 ${
        sidebarOpen ? "md:left-64" : "md:left-20"
      }`}
    >
      {/* Left: hamburger on mobile; empty on desktop */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          onClick={onToggleMobileMenu}
          aria-label="Open menu"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 sm:gap-4 relative" ref={dropdownRef}>
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen((prev) => !prev)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-[#7A3DF0] transition-colors relative"
            aria-label="Notifications"
          >
            <BellIcon className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 top-12 w-[min(20rem,calc(100vw-2rem))] max-h-[85vh] bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-900">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
                  </p>
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
                      className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        !notification.seen ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm ${
                              !notification.seen
                                ? "font-semibold text-gray-900"
                                : "text-gray-700"
                            }`}
                          >
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {notification.time}
                          </p>
                        </div>
                        {!notification.seen && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="focus:outline-none focus:ring-2 focus:ring-[#7A3DF0]/30 rounded-full transition-all"
          aria-label="User menu"
        >
          <img
            src="/images/free-user-icon.png"
            alt="Admin Avatar"
            className="w-9 h-9 rounded-full border-2 border-gray-200 hover:border-[#7A3DF0]/50 transition-colors"
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-14 w-48 min-w-[10rem] bg-white/95 backdrop-blur-md border border-gray-200 rounded-lg shadow-lg py-2 z-50">
            <button
              onClick={() => {
                navigate("/profile")
                setOpen(false)
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5EBFF] hover:text-[#502455] transition-colors"
            >
              Profile
            </button>

            <div className="border-t border-gray-200 my-1" />

            <button
              onClick={() => {
                handleLogout()
                setOpen(false)
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default AdminHeader
