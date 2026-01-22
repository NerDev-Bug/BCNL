import { Link, useLocation, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "../firebase"
import { useCart } from "../context/CartContext"

// ✅ Wishlist badge needs these
import { collection, getDocs } from "firebase/firestore"

import DeliveryLayout from "./layouts/delivery"
import LoginModal from "./LoginModal"
import RegisterModal from "./RegisterModal"
import Cart from "./Cart"
import WhatsAppIcon from "./layouts/WhatsAppIcon"

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

/* ---------------- NAVBAR ---------------- */
function Navbar() {
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [user, setUser] = useState(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // ✅ Wishlist badge count
  const [wishlistCount, setWishlistCount] = useState(0)

  const navigate = useNavigate()

  // ✅ Cart context (PUT THIS HERE)
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

  // ✅ Load wishlist count (Firestore if logged in, else localStorage)
  useEffect(() => {
    const loadWishlistCount = async () => {
      const local = JSON.parse(localStorage.getItem("wishlist")) || []

      // not logged in → localStorage count
      if (!user) {
        setWishlistCount(local.length)
        return
      }

      try {
        const snap = await getDocs(collection(db, "users", user.uid, "wishlist"))
        setWishlistCount(snap.size)

        // keep localStorage in sync (optional)
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        localStorage.setItem("wishlist", JSON.stringify(items))
      } catch (err) {
        console.error("Failed to load wishlist count from Firestore:", err)
        setWishlistCount(local.length) // fallback
      }
    }

    loadWishlistCount()
  }, [user])

  // ✅ OPTIONAL: instantly update badge when other pages add/remove wishlist
  // Call this anywhere after add/remove:
  // window.dispatchEvent(new Event("wishlistUpdated"))
  useEffect(() => {
    const handler = async () => {
      const local = JSON.parse(localStorage.getItem("wishlist")) || []

      if (!auth.currentUser) {
        setWishlistCount(local.length)
        return
      }

      try {
        const snap = await getDocs(
          collection(db, "users", auth.currentUser.uid, "wishlist")
        )
        setWishlistCount(snap.size)
      } catch {
        setWishlistCount(local.length)
      }
    }

    window.addEventListener("wishlistUpdated", handler)
    return () => window.removeEventListener("wishlistUpdated", handler)
  }, [])

  return (
    <>
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
                Sign Up
              </button>
            </div>
          </div>
        )}

        {!isMobileMenuOpen && <DeliveryLayout />}
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