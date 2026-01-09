import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { loginUser } from "../services/authService"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid"

function LoginModal({ isOpen, onClose, onSwitchToRegister }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [onClose])

  if (!isOpen) return null

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { role } = await loginUser(email.trim(), password.trim())
      onClose()
      if (role === "admin") navigate("/admin/dashboard")
      else navigate("/")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
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
                  {showPassword
                    ? <EyeSlashIcon className="w-5 h-5" />
                    : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7B2220] text-white py-2 rounded"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

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
