import { useState } from "react"
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth"
import { toast } from "react-toastify"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid"

function UserPasswordUpdate({ user }) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  // 🔐 Password validations
  const validations = {
    length: newPassword.length >= 8,
    lowercase: /[a-z]/.test(newPassword),
    uppercase: /[A-Z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[@$!%*?&.#_-]/.test(newPassword),
  }

  // 💪 Strength calculator
  const getPasswordStrength = () => {
    const passed = Object.values(validations).filter(Boolean).length

    if (passed <= 2) return { label: "Weak", color: "text-red-500" }
    if (passed <= 4) return { label: "Medium", color: "text-yellow-500" }
    return { label: "Strong", color: "text-green-500" }
  }

  const handleUpdatePassword = async () => {
    if (loading) return

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields")
      return
    }

    if (currentPassword === newPassword) {
      toast.error("New password cannot be the same as current password")
      return
    }

    if (!Object.values(validations).every(Boolean)) {
      toast.error("Please create a stronger password")
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    setLoading(true)
    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      )

      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)

      toast.success("Password updated successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        toast.error("Current password is incorrect")
      } else {
        toast.error(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Current Password */}
      <label className="block font-semibold mb-1">Current Password:</label>
      <div className="relative">
        <input
          type={showCurrent ? "text" : "password"}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full border rounded px-3 py-2"
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => setShowCurrent(!showCurrent)}
          className="absolute right-2 top-2"
          disabled={loading}
        >
          {showCurrent ? (
            <EyeSlashIcon className="w-5 h-5" />
          ) : (
            <EyeIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* New Password */}
      <label className="block font-semibold mt-4 mb-1">
        New Password:{" "}
        <span className="text-xs text-gray-400 font-normal">
          (min. 8 chars, upper, lower, number, special)
        </span>
      </label>
      <div className="relative">
        <input
          type={showNew ? "text" : "password"}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full border rounded px-3 py-2"
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => setShowNew(!showNew)}
          className="absolute right-2 top-2"
          disabled={loading}
        >
          {showNew ? (
            <EyeSlashIcon className="w-5 h-5" />
          ) : (
            <EyeIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Strength Indicator */}
      {newPassword && (
        <p className={`text-sm mt-1 font-semibold ${getPasswordStrength().color}`}>
          Strength: {getPasswordStrength().label}
        </p>
      )}

      {/* Checklist */}
      {newPassword && (
        <ul className="mt-2 space-y-1 text-xs">
          <li className={validations.length ? "text-green-600" : "text-gray-400"}>
            • At least 8 characters
          </li>
          <li className={validations.lowercase ? "text-green-600" : "text-gray-400"}>
            • One lowercase letter
          </li>
          <li className={validations.uppercase ? "text-green-600" : "text-gray-400"}>
            • One uppercase letter
          </li>
          <li className={validations.number ? "text-green-600" : "text-gray-400"}>
            • One number
          </li>
          <li className={validations.special ? "text-green-600" : "text-gray-400"}>
            • One special character
          </li>
        </ul>
      )}

      {/* Confirm Password */}
      <label className="block font-semibold mt-4 mb-1">
        Confirm New Password:
      </label>
      <div className="relative">
        <input
          type={showConfirm ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={`w-full border rounded px-3 py-2 ${
            confirmPassword && confirmPassword !== newPassword
              ? "border-red-400"
              : ""
          }`}
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => setShowConfirm(!showConfirm)}
          className="absolute right-2 top-2"
          disabled={loading}
        >
          {showConfirm ? (
            <EyeSlashIcon className="w-5 h-5" />
          ) : (
            <EyeIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {confirmPassword && confirmPassword !== newPassword && (
        <p className="text-xs text-red-500 mt-1">
          Passwords do not match
        </p>
      )}

      {/* Submit Button */}
      <button
        onClick={handleUpdatePassword}
        disabled={loading}
        className="mt-4 bg-[#7B2220] text-white px-4 py-2 rounded hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
            Updating...
          </span>
        ) : (
          "Update Password"
        )}
      </button>
    </div>
  )
}

export default UserPasswordUpdate