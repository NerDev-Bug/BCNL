import { useEffect, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { loginUser } from "../services/authService"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid"
import { toast } from "react-toastify"

import { sendPasswordResetEmail } from "firebase/auth"
import { auth, db } from "../firebase"
import { doc, getDoc } from "firebase/firestore"

function LoginModal({ isOpen, onClose, onSwitchToRegister }) {
  const [identifier, setIdentifier] = useState("") // email or username
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [rememberMe, setRememberMe] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    const saved = localStorage.getItem("remember_identifier")
    if (saved) {
      setIdentifier(saved)
      setRememberMe(true)
    }
  }, [isOpen])

  if (!isOpen) return null

  const looksLikeEmail = (value) => String(value || "").includes("@")

  const validateEmailStrict = (email) => {
    const e = String(email || "").trim().toLowerCase()

    if (!e.includes("@")) return "Email must contain @."
    const parts = e.split("@")
    if (parts.length !== 2) return "Email format is invalid."
    const [local, domain] = parts
    if (!local) return "Email username part is missing."
    if (!domain) return "Email domain is missing."
    if (!domain.includes(".")) return "Email domain must contain a dot (example: gmail.com)."

    const basicRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    if (!basicRegex.test(e)) return "Email format is invalid."

    if (domain.startsWith("gmail")) {
      const allowed = ["gmail.com", "googlemail.com"]
      if (!allowed.includes(domain)) {
        const tips = ["gmail.co", "gmail.con", "gmal.com", "gmial.com", "gmail.comm", "gmail.com.ph"]
        const suggestion = tips.includes(domain)
          ? "Did you mean gmail.com?"
          : "Please check your Gmail domain (example: gmail.com)."
        return suggestion
      }
    }

    return null
  }

  // ✅ resolve username -> email via /usernames/{usernameLower}
  const getEmailByUsername = async (username) => {
    const clean = String(username || "").trim()
    if (!clean) return null
    const key = clean.toLowerCase()

    const snap = await getDoc(doc(db, "usernames", key))
    if (!snap.exists()) return null

    const data = snap.data()
    return data?.email || null
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const cleanId = identifier.trim()
      const cleanPass = password.trim()

      if (!cleanId) {
        toast.error("Please enter your email or username.")
        return
      }

      let emailToUse = cleanId

      if (looksLikeEmail(cleanId)) {
        const emailError = validateEmailStrict(cleanId)
        if (emailError) {
          toast.error(emailError)
          return
        }
      } else {
        const foundEmail = await getEmailByUsername(cleanId)
        if (!foundEmail) {
          toast.error("Username not found.")
          return
        }
        emailToUse = foundEmail
      }

      const { role } = await loginUser(emailToUse, cleanPass)

      if (rememberMe) localStorage.setItem("remember_identifier", cleanId)
      else localStorage.removeItem("remember_identifier")

      localStorage.removeItem("is_guest_order")

      toast.success("Logged in successfully!")
      onClose()

      // Redirect: respect ?redirect= (e.g. after protected admin route sent user to login)
      const params = new URLSearchParams(location.search)
      const redirect = params.get("redirect")
      if (redirect && typeof redirect === "string" && redirect.startsWith("/") && !redirect.startsWith("//")) {
        navigate(redirect)
      } else if (role === "admin") {
        navigate("/admin/dashboard")
      } else {
        navigate("/")
      }
    } catch (error) {
      console.error(error)
      toast.error("Login failed. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  const handleSendReset = async (e) => {
    e.preventDefault()
    const cleanId = identifier.trim()

    if (!cleanId) return toast.error("Please enter your email or username.")

    try {
      let emailToUse = cleanId

      if (looksLikeEmail(cleanId)) {
        const emailError = validateEmailStrict(cleanId)
        if (emailError) {
          toast.error(emailError)
          return
        }
      } else {
        const foundEmail = await getEmailByUsername(cleanId)
        if (!foundEmail) {
          toast.error("Username not found.")
          return
        }
        emailToUse = foundEmail
      }

      await sendPasswordResetEmail(auth, emailToUse.trim())
      toast.success("Password reset email sent!")
      setForgotMode(false)
    } catch (err) {
      console.error(err)
      toast.error("Failed to send reset email.")
    }
  }

  const handleGuestOrder = () => {
    localStorage.setItem("is_guest_order", "true")
    toast.info("Continuing as guest...")
    onClose()
    navigate("/")
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="relative bg-white w-full max-w-3xl rounded-lg overflow-hidden flex flex-col md:flex-row">
        <button
          onClick={onClose}
          className="absolute top-2 right-4 text-gray-500 hover:text-black text-2xl z-10"
        >
          ×
        </button>

        <div className="w-full md:w-1/2 p-6 md:p-8">
          <img src="./images/bcnl_logo.png" alt="Bake Corner" className="h-10 mb-6" />

          {!forgotMode && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Username or email</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  placeholder="example@gmail.com or username"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full border rounded px-3 py-2 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2 text-gray-500"
                  >
                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>

                <button
                  type="button"
                  onClick={() => setForgotMode(true)}
                  className="text-[#7B2220] font-semibold hover:underline text-left sm:text-right"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#7B2220] text-white py-2 rounded"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <button
                type="button"
                onClick={handleGuestOrder}
                className="w-full border border-[#7B2220] text-[#7B2220] py-2 rounded font-semibold hover:bg-[#7B2220] hover:text-white transition"
              >
                Order as Guest
              </button>
            </form>
          )}

          {forgotMode && (
            <form onSubmit={handleSendReset} className="space-y-4">
              <h2 className="text-lg font-semibold">Reset Password</h2>
              <p className="text-sm text-gray-600">
                Enter your email (or username) and we’ll send you a reset link.
              </p>

              <div>
                <label className="block text-sm mb-1">Username or email</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  placeholder="example@gmail.com or username"
                />
              </div>

              <button type="submit" className="w-full bg-[#7B2220] text-white py-2 rounded">
                Send reset link
              </button>

              <button
                type="button"
                onClick={() => setForgotMode(false)}
                className="w-full text-sm text-gray-600 hover:underline"
              >
                ← Back to login
              </button>
            </form>
          )}

          <p className="text-sm mt-4">
            Don’t have an account?{" "}
            <span onClick={onSwitchToRegister} className="text-[#7B2220] cursor-pointer font-semibold">
              Register
            </span>
          </p>
        </div>

        <div
          className="hidden md:block md:w-1/2 bg-cover bg-center"
          style={{ backgroundImage: "url('./images/login-bg.png')" }}
        />
      </div>
    </div>
  )
}

export default LoginModal
