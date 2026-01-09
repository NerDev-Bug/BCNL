import { Link, useLocation, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "../firebase"

import DeliveryLayout from "./layouts/delivery"
import LoginModal from "./LoginModal"
import RegisterModal from "./RegisterModal"
import Cart from "./Cart"

/* ---------------- NAV LINK ---------------- */
function NavLink({ to, children }) {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link
      to={to}
      className={`mr-10 pb-1 ${
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
  const [showCart, setShowCart] = useState(false)
  const [user, setUser] = useState(null)

  const navigate = useNavigate()

  // 🔐 Listen to auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return unsubscribe
  }, [])

  // Prevent body scroll when cart is open
  useEffect(() => {
    document.body.style.overflow = showCart ? "hidden" : "auto"
  }, [showCart])

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 p-3 bg-gray-100 z-50">
        <div className="flex items-center justify-between">

          {/* LOGO */}
          <img
            src="./images/bcnl_logo.png"
            alt="Logo"
            className="w-17 h-10"
          />

          {/* NAV LINKS */}
          <div className="text-black font-semibold">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/order">Order</NavLink>
            <NavLink to="/menu">Menu</NavLink>
            <NavLink to="/#our-story">Our Story</NavLink>
          </div>

          {/* ICONS */}
          <div className="flex items-center">
            <Link to="/wishlist" className="mr-4">
              <img src="./images/favorite.png" alt="Wishlist" className="w-5 h-5" />
            </Link>

            {/* ACCOUNT BUTTON */}
            <button
              onClick={() => {
                if (user) {
                  navigate("/profile")
                } else {
                  setShowLogin(true)
                }
              }}
              className="mr-4"
            >
              <img src="./images/user.png" alt="Account" className="w-5 h-5" />
            </button>

            {/* CART */}
            <button onClick={() => setShowCart(true)} className="mr-2">
              <img src="./images/cart.png" alt="Cart" className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      <DeliveryLayout />

      {/* LOGIN MODAL */}
      <LoginModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        onSwitchToRegister={() => {
          setShowLogin(false)
          setShowRegister(true)
        }}
      />

      {/* REGISTER MODAL */}
      <RegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onSwitchToLogin={() => {
          setShowRegister(false)
          setShowLogin(true)
        }}
      />

      {/* CART */}
      <Cart isOpen={showCart} onClose={() => setShowCart(false)} />
    </>
  )
}

export default Navbar
