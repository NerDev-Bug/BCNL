import { Link, useLocation, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "../firebase"
import { useCart } from "../context/CartContext"
import { Bell } from "lucide-react"

// ✅ Realtime wishlist badge
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore"
 
import LoginModal from "./LoginModal"
import RegisterModal from "./RegisterModal"
import Cart from "./Cart"
import WhatsAppIcon from "./layouts/WhatsAppIcon"
import NotificationHistory from "./common/Notification-history"

/* ---------------- NAV LINK ---------------- */
function NavLink({ to, children, onClick }) {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`block md:inline-block md:mr-10 py-2 ${
        isActive ? "border-b-4 border-[#7B2220]" : ""
      }`}
    >
      {children}
    </Link>
  )
}

const BetaBadge = () => (
  <div className="fixed left-4 top-1/2 -translate-y-1/2 z-[60]">
    <div className="bg-yellow-300 text-black text-md font-bold px-3 py-2 rounded-b-lg shadow-lg tracking-wide relative rotate-[-90deg] origin-left">
      BETA VERSION
    </div>
  </div>
)

/* ---------------- NAVBAR ---------------- */
function Navbar() {
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [user, setUser] = useState(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    if (!user) {
      setNotifications([])
      return
    }

    const notifRef = collection(db, "users", user.uid, "notifications")
    const q = query(
      notifRef,
      orderBy("createdAt", "desc"),
      limit(20)
    )

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => {
          const data = d.data()
          const createdAtDate = data.createdAt?.toDate
            ? data.createdAt.toDate()
            : null

          return {
            id: d.id,
            message: data.message || "Notification",
            time: createdAtDate
              ? createdAtDate.toLocaleString()
              : "Just now",
            read: !!data.read,
            link: data.link || null,
            type: data.type || "general",
            data: data.data || null,
            createdAt: createdAtDate,
          }
        })

        setNotifications(items)
      },
      (err) => {
        console.error("Notifications listener error:", err)
        setNotifications([])
      }
    )

    return () => unsub()
  }, [user])


  // ✅ Wishlist badge count
  const [wishlistCount, setWishlistCount] = useState(0)

  const navigate = useNavigate()
  const location = useLocation()

  // ✅ Open login modal when URL has ?login=1 (e.g. after redirect from protected admin)
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get("login") === "1") setShowLogin(true)
  }, [location.search])

  // ✅ Cart context
  const { cartItems, isCartOpen, setIsCartOpen, removeItem, updateQuantity } =
    useCart()

  useEffect(() => {
    window.openLoginModal = () => setShowLogin(true)
  }, [])

  const cartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0)

  // 🔐 Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser)
    return unsubscribe
  }, [])

  const closeMobileMenu = () => setIsMobileMenuOpen(false)

  // ✅ Prevent body scroll when cart or mobile menu is open
  useEffect(() => {
    const shouldLockScroll = isCartOpen || isMobileMenuOpen
    document.body.style.overflow = shouldLockScroll ? "hidden" : "auto"

    return () => {
      document.body.style.overflow = "auto"
    }
  }, [isCartOpen, isMobileMenuOpen])

  // ✅ REALTIME: Wishlist badge listener
  useEffect(() => {
    let unsub = null

    // not logged in → localStorage count
    if (!user) {
      const local = JSON.parse(localStorage.getItem("wishlist")) || []
      setWishlistCount(local.length)
      return
    }

    const colRef = collection(db, "users", user.uid, "wishlist")

    unsub = onSnapshot(
      colRef,
      (snap) => {
        setWishlistCount(snap.size)

        // optional: keep localStorage in sync
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        localStorage.setItem("wishlist", JSON.stringify(items))
      },
      (err) => {
        console.error("Wishlist realtime badge error:", err)
        const local = JSON.parse(localStorage.getItem("wishlist")) || []
        setWishlistCount(local.length)
      }
    )

    return () => {
      if (unsub) unsub()
    }
  }, [user])

  return (
    <>
      <BetaBadge />

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      <nav className="fixed top-0 left-0 right-0 bg-gray-100 z-50">
        <div className="flex items-center justify-between p-3">
          {/* LOGO */}
          <Link to="/" className="flex items-center">
            <img src="./images/bcnl_logo.png" alt="Logo" className="w-17 h-10" />
          </Link>

          {/* DESKTOP NAV LINKS */}
          <div className="hidden md:flex text-black font-semibold">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/#our-story">Our Story</NavLink>
            <NavLink to="/events">Events</NavLink>
            <NavLink to="/menu">Menu</NavLink>
            <NavLink to="/order">Order</NavLink>
          </div>

          {/* ICONS */}
          <div className="flex items-center">
            {/* HAMBURGER (MOBILE ONLY) */}
            <button
              className="md:hidden mr-3 text-xl font-bold"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              ☰
            </button>

            {/* ✅ WISHLIST (WITH BADGE) */}
            <Link
              to="/wishlist"
              className="relative mr-4 hidden md:block"
              aria-label="Wishlist"
            >
              <img
                src="./images/favorite.png"
                alt="Wishlist"
                className="w-5 h-5"
              />

              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#7B2220] text-white text-[11px] font-bold flex items-center justify-center leading-none">
                  {wishlistCount > 99 ? "99+" : wishlistCount}
                </span>
              )}
            </Link>

            {/* Notification */}
            <div className="relative mr-3 md:mr-4">
              <button
                onClick={() => setShowNotifications((v) => !v)}
                aria-label="Notifications"
                className="relative p-1 rounded-full hover:bg-gray-200 transition"
              >
                <Bell className="w-6 h-6 text-gray-700 animate-pulse" />

                {notifications.filter((n) => {
                  // Count only unread and not expired (within 1 day)
                  if (n.read) return false
                  if (!n.createdAt) return true
                  const oneDayMs = 24 * 60 * 60 * 1000
                  // eslint-disable-next-line react-hooks/purity
                  return Date.now() - n.createdAt.getTime() <= oneDayMs
                }).length > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#7B2220] text-white text-[11px] font-bold flex items-center justify-center leading-none">
                    {(() => {
                      const unreadCount = notifications.filter((n) => {
                        if (n.read) return false
                        if (!n.createdAt) return true
                        const oneDayMs = 24 * 60 * 60 * 1000
                        return Date.now() - n.createdAt.getTime() <= oneDayMs
                      }).length
                      return unreadCount > 99 ? "99+" : unreadCount
                    })()}
                  </span>
                )}
              </button>

              <NotificationHistory
                open={showNotifications}
                onClose={() => setShowNotifications(false)}
                notifications={notifications}
              />
            </div>

            {/* ACCOUNT */}
            <button
              onClick={() => (user ? navigate("/profile") : setShowLogin(true))}
              className="mr-4 hidden md:block"
            >
              <img src="./images/user.png" alt="Account" className="w-5 h-5" />
            </button>

            {/* CART */}
            <button
              onClick={() => setIsCartOpen(true)}
              id="cart-icon"
              className="relative"
              aria-label="Open cart"
            >
              <img src="./images/cart.png" alt="Cart" className="w-5 h-5" />

              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-[#7B2220] text-white text-[11px] font-bold flex items-center justify-center leading-none">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* MOBILE MENU */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-gray-100 border-t pt-4 text-black font-semibold px-4 pb-4 animate-slideDown">
            <NavLink to="/" onClick={closeMobileMenu}>
              Home
            </NavLink>
            <NavLink to="/#our-story" onClick={closeMobileMenu}>
              Our Story
            </NavLink>
            <NavLink to="/events" onClick={closeMobileMenu}>
              Events
            </NavLink>
            <NavLink to="/menu" onClick={closeMobileMenu}>
              Menu
            </NavLink>
            <NavLink to="/order" onClick={closeMobileMenu}>
              Order
            </NavLink>

            <hr className="border-1 border-gray-300 mt-2" />

            <div className="mt-4 flex flex-col gap-3">
              <Link to="/wishlist" onClick={closeMobileMenu} className="block">
                Wishlist
              </Link>
              <button
                className="text-left"
                onClick={() => {
                  closeMobileMenu()
                  user ? navigate("/profile") : setShowLogin(true)
                }}
              >
                {user ? "Profile" : "Sign Up"}
              </button>
            </div>
          </div>
        )}

      </nav>

      {/* MODALS */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => {
          setShowLogin(false)
          setShowRegister(true)
        }}
      />

      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => {
          setShowRegister(false)
          setShowLogin(true)
        }}
      />

      {/* CART SIDEBAR (ONLY HERE) */}
      <Cart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemoveItem={removeItem}
        onUpdateQuantity={updateQuantity}
      />

      {/* WHATSAPP ICON (ONLY HERE) */}
      <WhatsAppIcon />
    </>
  )
}

export default Navbar