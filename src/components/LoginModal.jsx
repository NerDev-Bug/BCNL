import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { loginUser } from "../services/authService"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid"
import { toast } from "react-toastify"

import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "../firebase"

function LoginModal({ isOpen, onClose, onSwitchToRegister }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // remember me
  const [rememberMe, setRememberMe] = useState(false)

  // forgot password mode
  const [forgotMode, setForgotMode] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [onClose])

  // load remembered email
  useEffect(() => {
    if (!isOpen) return
    const savedEmail = localStorage.getItem("remember_email")
    if (savedEmail) {
      setEmail(savedEmail)
      setRememberMe(true)
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const cleanEmail = email.trim()
      const cleanPass = password.trim()

      const { role } = await loginUser(cleanEmail, cleanPass)

      if (rememberMe) localStorage.setItem("remember_email", cleanEmail)
      else localStorage.removeItem("remember_email")

      toast.success("Logged in successfully!")
      onClose()

      if (role === "admin") navigate("/admin/dashboard")
      else navigate("/")
    } catch (error) {
      console.error(error)
      toast.error("Login failed. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  const handleSendReset = async (e) => {
    e.preventDefault()
    if (!email) return toast.error("Please enter your email")

    try {
      await sendPasswordResetEmail(auth, email.trim())
      toast.success("Password reset email sent!")
      setForgotMode(false)
    } catch (err) {
      console.error(err)
      toast.error("Failed to send reset email.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="relative bg-white w-full max-w-3xl rounded-lg overflow-hidden flex">
        <button
          onClick={onClose}
          className="absolute top-2 right-4 text-gray-500 hover:text-black text-2xl"
        >
          ×
        </button>

        {/* LEFT */}
        <div className="w-1/2 p-8">
          <img
            src="./images/bcnl_logo.png"
            alt="Bake Corner"
            className="h-10 mb-6"
          />

          {/* ================= LOGIN FORM ================= */}
          {!forgotMode && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full border rounded px-3 py-2"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-2 text-gray-500"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
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
                  className="text-[#7B2220] font-semibold hover:underline"
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
            </form>
          )}

          {/* ================= FORGOT PASSWORD ================= */}
          {forgotMode && (
            <form onSubmit={handleSendReset} className="space-y-4">
              <h2 className="text-lg font-semibold">Reset Password</h2>
              <p className="text-sm text-gray-600">
                Enter your email and we’ll send you a reset link.
              </p>

              <div>
                <label className="block text-sm mb-1">Email</label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#7B2220] text-white py-2 rounded"
              >
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
            <span
              onClick={onSwitchToRegister}
              className="text-[#7B2220] cursor-pointer font-semibold"
            >
              Register
            </span>
          </p>
        </div>

        {/* RIGHT */}
        <div
          className="w-1/2 bg-cover bg-center"
          style={{ backgroundImage: "url('./images/login-bg.png')" }}
        />
      </div>
    </div>
  )
}

export default LoginModal
