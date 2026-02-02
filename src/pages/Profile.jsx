import { useEffect, useState } from "react"
import { auth } from "../firebase"
import { signOut } from "firebase/auth"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import UserInfo from "../components/profile/user-info"
import UserPasswordUpdate from "../components/profile/user-password-update"
import UserRewards from "../components/profile/user-rewards"
import UserPayment from "../components/profile/user-payment"
import UserOrderHistory from "../components/profile/user-order-history"

function Profile() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState("info") // info | rewards | orders | payment | password
  const [animateKey, setAnimateKey] = useState(0)

  // ✅ logout modal
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/")
    } else {
      setUser(auth.currentUser)
    }
  }, [navigate])

  useEffect(() => {
    setAnimateKey((k) => k + 1)
  }, [activeTab])

  const doLogout = async () => {
    await signOut(auth)
    toast.success("Logged out successfully")
    navigate("/")
  }

  const requestLogout = () => {
    setShowLogoutModal(true)
  }

  const cancelLogout = () => {
    setShowLogoutModal(false)
  }

  const confirmLogout = async () => {
    setShowLogoutModal(false)
    await doLogout()
  }

  if (!user) return null

  // ✅ menu order: Information, Points & Rewards, Order History, Payment Info, Change Password
  const tabOptions = [
    { value: "info", label: "Information" },
    { value: "rewards", label: "Points & Rewards" },
    { value: "orders", label: "Order History" },
    { value: "payment", label: "Payment Info" },
    { value: "password", label: "Change Password" },
    { value: "logout", label: "Logout" },
  ]

  const handleMobileChange = (value) => {
    if (value === "logout") {
      requestLogout()
      return
    }
    setActiveTab(value)
  }

  return (
    <div className="flex flex-col md:flex-row pt-24 md:pt-28 px-4 md:px-6 max-w-5xl mx-auto mb-4 gap-4 md:gap-0">
      {/* ✅ LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <>
          {/* overlay */}
          <div
            onClick={cancelLogout}
            className="fixed inset-0 bg-black/40 z-50"
          />

          {/* modal */}
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-5">
              <h3 className="text-lg font-semibold mb-2">Confirm Logout</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to logout?
              </p>

              <div className="flex gap-2 justify-end">
                <button
                  onClick={cancelLogout}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmLogout}
                  className="px-4 py-2 rounded bg-[#7B2220] text-white hover:opacity-90"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ✅ MOBILE DROPDOWN */}
      <div className="md:hidden w-full">
        <div className="bg-gray-100 p-3 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Menu
          </label>

          <select
            value={activeTab}
            onChange={(e) => handleMobileChange(e.target.value)}
            className="w-full border rounded-md px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[#7B2220]"
          >
            {tabOptions.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ✅ DESKTOP SIDEBAR */}
      <div
        className="
          hidden md:flex
          w-full md:w-1/4
          bg-gray-100 p-4 rounded-lg shadow
          md:mr-6
          flex-col
          md:sticky md:top-28
          md:h-[calc(100vh-7rem)]
        "
      >
        <ul className="flex flex-col gap-2">
          <li
            onClick={() => setActiveTab("info")}
            className={`cursor-pointer px-3 py-2 rounded-md font-medium transition-all duration-200 ${
              activeTab === "info"
                ? "text-[#7B2220] bg-white shadow-sm"
                : "text-gray-600 hover:text-[#7B2220] hover:bg-white/70"
            }`}
          >
            Information
          </li>

          <li
            onClick={() => setActiveTab("rewards")}
            className={`cursor-pointer px-3 py-2 rounded-md font-medium transition-all duration-200 ${
              activeTab === "rewards"
                ? "text-[#7B2220] bg-white shadow-sm"
                : "text-gray-600 hover:text-[#7B2220] hover:bg-white/70"
            }`}
          >
            Points & Rewards
          </li>

          <li
            onClick={() => setActiveTab("orders")}
            className={`cursor-pointer px-3 py-2 rounded-md font-medium transition-all duration-200 ${
              activeTab === "orders"
                ? "text-[#7B2220] bg-white shadow-sm"
                : "text-gray-600 hover:text-[#7B2220] hover:bg-white/70"
            }`}
          >
            Order History
          </li>

          <li
            onClick={() => setActiveTab("payment")}
            className={`cursor-pointer px-3 py-2 rounded-md font-medium transition-all duration-200 ${
              activeTab === "payment"
                ? "text-[#7B2220] bg-white shadow-sm"
                : "text-gray-600 hover:text-[#7B2220] hover:bg-white/70"
            }`}
          >
            Payment Info
          </li>

          <li
            onClick={() => setActiveTab("password")}
            className={`cursor-pointer px-3 py-2 rounded-md font-medium transition-all duration-200 ${
              activeTab === "password"
                ? "text-[#7B2220] bg-white shadow-sm"
                : "text-gray-600 hover:text-[#7B2220] hover:bg-white/70"
            }`}
          >
            Change Password
          </li>
        </ul>

        <button
          onClick={requestLogout}
          className="mt-4 md:mt-auto w-full bg-[#7B2220] text-white px-4 py-2 rounded hover:opacity-90 transition-opacity duration-200"
        >
          Logout
        </button>
      </div>

      {/* CONTENT */}
      <div className="w-full md:flex-1 bg-white p-4 md:p-6 rounded-lg shadow">
        <div key={animateKey} className="animate-tabEnter">
          {activeTab === "info" && <UserInfo user={user} />}
          {activeTab === "rewards" && <UserRewards user={user} />}
          {activeTab === "orders" && <UserOrderHistory user={user} />}
          {activeTab === "payment" && <UserPayment user={user} />}
          {activeTab === "password" && <UserPasswordUpdate user={user} />}
        </div>
      </div>

      <style>{`
        @keyframes tabEnter {
          0% { opacity: 0; transform: translateY(10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-tabEnter {
          animation: tabEnter 220ms ease-out;
        }
      `}</style>
    </div>
  )
}

export default Profile
