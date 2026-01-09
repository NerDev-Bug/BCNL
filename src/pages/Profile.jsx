import { useEffect, useState } from "react"
import { auth } from "../firebase"
import {
  signOut,
  updatePassword,
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth"
import { useNavigate } from "react-router-dom"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid"

const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function Profile() {
  const [user, setUser] = useState(null)
  const [newEmail, setNewEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/")
    } else {
      setUser(auth.currentUser)
      setNewEmail(auth.currentUser.email)
    }
  }, [navigate])

  const handleLogout = async () => {
    await signOut(auth)
    toast.success("Logged out successfully")
    navigate("/")
  }

const handleUpdateEmail = async () => {
  if (!newEmail) {
    toast.error("Email cannot be empty")
    return
  }

  if (!isValidEmail(newEmail)) {
    toast.error("Please enter a valid email address")
    return
  }

  if (newEmail === user.email) {
    toast.info("This is already your current email")
    return
  }

  try {
    await updateEmail(user, newEmail)
    toast.success("Email updated successfully!")
  } catch (err) {
    // Re-auth required
    if (err.code === "auth/requires-recent-login") {
      if (!currentPassword) {
        toast.error("Please enter your current password to change email")
        return
      }

      try {
        const credential = EmailAuthProvider.credential(
          user.email,
          currentPassword
        )
        await reauthenticateWithCredential(user, credential)
        await updateEmail(user, newEmail)

        toast.success("Email updated successfully!")
        setCurrentPassword("")
      } catch (reauthErr) {
        toast.error("Current password is incorrect")
        setCurrentPassword("")
      }
    } else {
      toast.error(err.message)
    }
  }
}

  const handleUpdatePassword = async () => {
    if (!currentPassword) {
      toast.error("Please enter your current password")
      return
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)

      await updatePassword(user, newPassword)
      toast.success("Password updated successfully!")
      setNewPassword("")
      setCurrentPassword("")
    } catch (err) {
      setCurrentPassword("")
      setNewPassword("")
      if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        toast.error("Current password is incorrect")
      } else {
        toast.error(err.message)
      }
    }
  }

  if (!user) return null

  return (
    <div className="flex pt-28 px-6 max-w-5xl mx-auto">
      {/* Toast Container */}
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Sidebar */}
      <div className="w-1/4 bg-gray-100 p-4 rounded-lg shadow mr-6 flex flex-col justify-between">
        <div>
          <h2 className="text-lg font-bold mb-4">Dashboard</h2>
          <ul className="space-y-2">
            <li className="cursor-pointer hover:text-[#7B2220]">Order Status</li>
            <li className="cursor-pointer hover:text-[#7B2220]">Order History</li>
          </ul>
        </div>

        <button
          onClick={handleLogout}
          className="mt-6 w-full bg-[#7B2220] text-white px-4 py-2 rounded hover:opacity-90"
        >
          Logout
        </button>
      </div>

      {/* Profile Content */}
      <div className="flex-1 bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>

        {/* Email Update */}
        <div className="mb-4">
          <label className="block font-semibold mb-1">Email:</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
          <button
            onClick={handleUpdateEmail}
            className="mt-2 bg-[#7B2220] text-white px-4 py-2 rounded hover:opacity-90"
          >
            Update Email
          </button>
        </div>

        {/* Password Update */}
        <div className="mb-6">
          {/* Current Password */}
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
              className="absolute right-2 top-2 text-gray-500"
            >
              {showCurrent ? (
                <EyeSlashIcon className="w-5 h-5" />
              ) : (
                <EyeIcon className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* New Password */}
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
              className="absolute right-2 top-2 text-gray-500"
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
      </div>
    </div>
  )
}

export default Profile
