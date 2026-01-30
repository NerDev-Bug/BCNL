import { useEffect, useState } from "react"
import { auth } from "../firebase"
import { signOut } from "firebase/auth"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import UserInfo from "../components/profile/user-info"
import UserPasswordUpdate from "../components/profile/user-password-update"
import UserRewards from "../components/profile/user-rewards"
import UserPayment from "../components/profile/user-payment" // ✅ ADD

function Profile() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState("info") // info | password | rewards | payment ✅
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
      {/* Sidebar */}
      <div
        className="w-1/4 bg-gray-100 p-4 rounded-lg shadow mr-6 flex flex-col
                   sticky top-28 h-[calc(100vh-7rem)]"
      >
        <div>
          <h2 className="text-lg font-bold mb-4">Dashboard</h2>
          <ul className="space-y-2">
            <li className="cursor-pointer hover:text-[#7B2220]">Order History</li>

            <li
              onClick={() => setActiveTab("rewards")}
              className={`cursor-pointer hover:text-[#7B2220] ${
                activeTab === "rewards" ? "text-[#7B2220] font-semibold" : ""
              }`}
            >
              Points & Rewards
            </li>

            {/* ✅ NEW */}
            <li
              onClick={() => setActiveTab("payment")}
              className={`cursor-pointer hover:text-[#7B2220] ${
                activeTab === "payment" ? "text-[#7B2220] font-semibold" : ""
              }`}
            >
              Payment Information
            </li>
          </ul>
        </div>

        <button
          onClick={handleLogout}
          className="mt-auto w-full bg-[#7B2220] text-white px-4 py-2 rounded hover:opacity-90"
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

          <button
            onClick={() => setActiveTab("rewards")}
            className={`px-4 py-2 font-semibold border-b-2 ${
              activeTab === "rewards"
                ? "border-[#7B2220] text-[#7B2220]"
                : "border-transparent text-gray-500 hover:text-[#7B2220]"
            }`}
          >
            Points & Rewards
          </button>

          {/* ✅ NEW */}
          <button
            onClick={() => setActiveTab("payment")}
            className={`px-4 py-2 font-semibold border-b-2 ${
              activeTab === "payment"
                ? "border-[#7B2220] text-[#7B2220]"
                : "border-transparent text-gray-500 hover:text-[#7B2220]"
            }`}
          >
            Payment Info
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "info" && <UserInfo user={user} />}
        {activeTab === "password" && <UserPasswordUpdate user={user} />}
        {activeTab === "rewards" && <UserRewards user={user} />}
        {activeTab === "payment" && <UserPayment user={user} />} {/* ✅ NEW */}
      </div>
    </div>
  )
}

export default Profile
