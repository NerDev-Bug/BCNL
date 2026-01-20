import { useState } from "react"
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth"
import { toast } from "react-toastify"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid"

function UserPasswordUpdate({ user }) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error("Please fill in all fields")
      return
    }

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
    } catch (err) {
      if (
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        toast.error("Current password is incorrect")
      } else {
        toast.error(err.message)
      }
    }
  }

  return (
    <div>
      <label className="block font-semibold mb-1">Current Password:</label>
      <div className="relative">
        <input
          type={showCurrent ? "text" : "password"}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        <button
          type="button"
          onClick={() => setShowCurrent(!showCurrent)}
          className="absolute right-2 top-2"
        >
          {showCurrent ? (
            <EyeSlashIcon className="w-5 h-5" />
          ) : (
            <EyeIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      <label className="block font-semibold mt-4 mb-1">New Password:</label>
      <div className="relative">
        <input
          type={showNew ? "text" : "password"}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
        <button
          type="button"
          onClick={() => setShowNew(!showNew)}
          className="absolute right-2 top-2"
        >
          {showNew ? (
            <EyeSlashIcon className="w-5 h-5" />
          ) : (
            <EyeIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      <button
        onClick={handleUpdatePassword}
        className="mt-4 bg-[#7B2220] text-white px-4 py-2 rounded hover:opacity-90"
      >
        Update Password
      </button>
    </div>
  )
}

export default UserPasswordUpdate
