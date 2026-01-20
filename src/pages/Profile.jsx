import { useEffect, useState } from "react"
import { auth } from "../firebase"
import { signOut } from "firebase/auth"
import { useNavigate } from "react-router-dom"
import { toast, ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import UserInfo from "../components/profile/user-info"
import UserPasswordUpdate from "../components/profile/user-password-update"

function Profile() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState("info") // info | password
  const navigate = useNavigate()

  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/")
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(auth.currentUser)
    }
  }, [navigate])

  const handleLogout = async () => {
    await signOut(auth)
    toast.success("Logged out successfully")
    navigate("/")
  }

  if (!user) return null

  return (
    <div className="flex pt-28 px-6 max-w-5xl mx-auto mb-4">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Sidebar */}
      <div className="w-1/4 bg-gray-100 p-4 rounded-lg shadow mr-6 flex flex-col justify-between">
        <div>
          <h2 className="text-lg font-bold mb-4">Dashboard</h2>
          <ul className="space-y-2">
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
        <h1 className="text-2xl font-bold mb-4">My Profile</h1>

        {/* Top Buttons */}
        <div className="flex gap-4 mb-6 border-b pb-2">
          <button
            onClick={() => setActiveTab("info")}
            className={`px-4 py-2 font-semibold border-b-2 ${
              activeTab === "info"
                ? "border-[#7B2220] text-[#7B2220]"
                : "border-transparent text-gray-500 hover:text-[#7B2220]"
            }`}
          >
            Information
          </button>

          <button
            onClick={() => setActiveTab("password")}
            className={`px-4 py-2 font-semibold border-b-2 ${
              activeTab === "password"
                ? "border-[#7B2220] text-[#7B2220]"
                : "border-transparent text-gray-500 hover:text-[#7B2220]"
            }`}
          >
            Change Password
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "info" && <UserInfo user={user} />}
        {activeTab === "password" && <UserPasswordUpdate user={user} />}
      </div>
    </div>
  )
}

export default Profile
