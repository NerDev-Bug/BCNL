import { useEffect, useMemo, useRef, useState } from "react"
import { registerUser } from "../services/authService"
import { toast } from "react-toastify"

import {
  EyeIcon,
  EyeSlashIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/solid"

import { db } from "../firebase"
import { doc, getDoc } from "firebase/firestore"

function RegisterModal({ isOpen, onClose, onSwitchToLogin }) {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // show/hide
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // username uniqueness state
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState(null) // null | true | false
  const [usernameMsg, setUsernameMsg] = useState("")

  const lastUsernameChecked = useRef("")
  const debounceTimer = useRef(null)

  // ✅ FIXED tooltip state (not clipped by overflow-hidden)
  const [tipOpen, setTipOpen] = useState(false)
  const [tipPos, setTipPos] = useState({ top: 0, left: 0 })
  const TIP_W = 260
  const TIP_PAD = 12

  const handleTipEnter = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const top = r.bottom + 8
    const maxLeft = window.innerWidth - TIP_W - TIP_PAD
    const left = Math.max(TIP_PAD, Math.min(r.left, maxLeft))
    setTipPos({ top, left })
    setTipOpen(true)
  }
  const handleTipLeave = () => setTipOpen(false)

  // Password strength
  const getPasswordStrength = (pwd) => {
    const p = String(pwd || "")
    const hasLower = /[a-z]/.test(p)
    const hasUpper = /[A-Z]/.test(p)
    const hasNumber = /[0-9]/.test(p)
    const hasSymbol = /[^A-Za-z0-9]/.test(p)

    const lengthScore =
      p.length >= 12 ? 3 : p.length >= 10 ? 2 : p.length >= 8 ? 1 : 0
    const varietyScore = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length
    const score = lengthScore + varietyScore

    if (!p) return { label: "", level: 0, percent: 0 }
    if (p.length < 8 || score <= 2) return { label: "Weak", level: 1, percent: 33 }
    if (score <= 4) return { label: "Mild", level: 2, percent: 66 }
    return { label: "Strong", level: 3, percent: 100 }
  }

  const strength = useMemo(() => getPasswordStrength(password), [password])

  const confirmState = useMemo(() => {
    if (!confirmPassword) return { show: false, ok: false, text: "" }
    if (!password) return { show: true, ok: false, text: "Enter password first" }
    const ok = password === confirmPassword
    return { show: true, ok, text: ok ? "Passwords match" : "Passwords do not match" }
  }, [password, confirmPassword])

  const validateUsername = (value) => {
    const u = String(value || "").trim()
    if (!u) return "Username is required"
    if (u.length < 3) return "Username must be at least 3 characters"
    if (u.length > 20) return "Username must be at most 20 characters"
    if (!/^[a-zA-Z0-9_]+$/.test(u))
      return "Only letters, numbers, and underscore (_) allowed"
    return null
  }

  // Esc handler
  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [isOpen, onClose])

  // reset when open
  useEffect(() => {
    if (!isOpen) return
    setError("")
    setUsernameChecking(false)
    setUsernameAvailable(null)
    setUsernameMsg("")
    lastUsernameChecked.current = ""
    setShowPassword(false)
    setShowConfirmPassword(false)
    setTipOpen(false)
  }, [isOpen])

  // username availability via /usernames/{usernameLower}
  useEffect(() => {
    if (!isOpen) return

    const clean = username.trim()
    const localError = validateUsername(clean)

    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    if (!clean) {
      setUsernameAvailable(null)
      setUsernameMsg("")
      setUsernameChecking(false)
      return
    }

    if (localError) {
      setUsernameAvailable(false)
      setUsernameMsg(localError)
      setUsernameChecking(false)
      return
    }

    setUsernameChecking(true)

    debounceTimer.current = setTimeout(async () => {
      try {
        const key = clean.toLowerCase()
        if (lastUsernameChecked.current === key) {
          setUsernameChecking(false)
          return
        }
        lastUsernameChecked.current = key

        const snap = await getDoc(doc(db, "usernames", key))

        if (snap.exists()) {
          setUsernameAvailable(false)
          setUsernameMsg("Username is already taken")
        } else {
          setUsernameAvailable(true)
          setUsernameMsg("Username is available")
        }
      } catch (e) {
        console.error(e)
        setUsernameAvailable(false)
        setUsernameMsg("Unable to verify username right now")
      } finally {
        setUsernameChecking(false)
      }
    }, 500)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [username, isOpen])

  const handleRegister = async (e) => {
    e.preventDefault()
    setError("")

    if (!agree) return setError("You must agree to the Terms and Conditions")

    const uErr = validateUsername(username)
    if (uErr) return setError(uErr)

    if (usernameChecking) return setError("Please wait while we verify the username")
    if (usernameAvailable === false) return setError(usernameMsg || "Username is not available")
    if (usernameAvailable === null) return setError("Please enter a valid username")

    if (password !== confirmPassword) return setError("Passwords do not match")
    if (strength.level === 1) return setError("Password is too weak. Hover the info icon for requirements.")

    try {
      setLoading(true)
      await registerUser(email.trim(), password, username.trim())
      onClose()
      toast.success("Account created successfully!")
      toast.success("Automatically logged in.")
    } catch (err) {
      setError(err?.message || "Registration failed")
      toast.error("Registration failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
      <div className="relative bg-white w-full max-w-4xl rounded-lg overflow-hidden flex flex-col md:flex-row">
        <button
          onClick={onClose}
          className="absolute top-2 right-4 text-gray-500 hover:text-black text-2xl z-10"
        >
          ×
        </button>

        <div className="w-full md:w-1/2 p-6 md:p-8">
          <form onSubmit={handleRegister}>
            {/* Username */}
            <div className="mb-4">
              <label className="block text-sm mb-1 text-[#7B2220]">Username</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />

              {!!username.trim() && (
                <p
                  className={`mt-1 text-xs ${
                    usernameChecking
                      ? "text-gray-500"
                      : usernameAvailable
                      ? "text-green-700"
                      : "text-red-600"
                  }`}
                >
                  {usernameChecking ? "Checking username..." : usernameMsg}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm mb-1 text-[#7B2220]">Email Address</label>
              <input
                type="email"
                className="w-full border rounded px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm mb-1 text-[#7B2220]">Password</label>

                <button
                  type="button"
                  onMouseEnter={handleTipEnter}
                  onMouseLeave={handleTipLeave}
                  onFocus={handleTipEnter}
                  onBlur={handleTipLeave}
                  className="inline-flex items-center"
                  aria-label="Password requirements"
                >
                  <InformationCircleIcon className="w-5 h-5 text-gray-400 hover:text-[#7B2220]" />
                </button>
              </div>

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
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2 top-2 text-gray-500"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>

              {!!password && (
                <div className="mt-2">
                  <div className="h-2 w-full bg-gray-200 rounded overflow-hidden">
                    <div
                      className={`h-2 transition-all duration-300 ${
                        strength.level === 1
                          ? "bg-red-500"
                          : strength.level === 2
                          ? "bg-yellow-500"
                          : "bg-green-600"
                      }`}
                      style={{ width: `${strength.percent}%` }}
                    />
                  </div>

                  <p
                    className={`text-xs font-semibold mt-1 ${
                      strength.level === 1
                        ? "text-red-600"
                        : strength.level === 2
                        ? "text-yellow-600"
                        : "text-green-700"
                    }`}
                  >
                    {strength.label} password
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="mb-5">
              <label className="block text-sm mb-1 text-[#7B2220]">Confirm Password</label>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full border rounded px-3 py-2 pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((s) => !s)}
                  className="absolute right-2 top-2 text-gray-500"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                </button>
              </div>

              {confirmState.show && (
                <p className={`mt-1 text-xs ${confirmState.ok ? "text-green-700" : "text-red-600"}`}>
                  {confirmState.text}
                </p>
              )}
            </div>

            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7B2220] text-white py-2 rounded hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Creating account..." : "Register"}
            </button>

            <label className="flex items-center gap-2 text-sm mt-3">
              <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
              <span className="text-[#7B2220] cursor-pointer">Terms and Conditions</span>
            </label>

            <p className="text-sm mt-4">
              Already have an account?{" "}
              <span onClick={onSwitchToLogin} className="text-[#7B2220] font-semibold cursor-pointer">
                Login
              </span>
            </p>
          </form>
        </div>

        <div
          className="hidden md:block md:w-1/2 bg-cover bg-center"
          style={{ backgroundImage: "url('./images/login-bg.png')" }}
        >
          <div className="p-6">
            <img src="./images/bcnl_logo.png" alt="Bake Corner" className="h-10" />
          </div>
        </div>
      </div>

      {/* ✅ fixed tooltip (always on top) */}
      {tipOpen && (
        <div
          className="fixed z-[9999] w-[260px] rounded-md border bg-white p-3 text-xs text-gray-700 shadow-lg"
          style={{ top: tipPos.top, left: tipPos.left }}
        >
          <p className="font-semibold mb-1 text-[#7B2220]">Password requirements</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>At least 8 characters</li>
            <li>At least 1 uppercase letter</li>
            <li>At least 1 number</li>
            <li>At least 1 symbol (e.g. !@#$%)</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default RegisterModal
