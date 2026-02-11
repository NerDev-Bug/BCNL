// src/components/admin/header.jsx
import { BellIcon } from "@heroicons/react/24/outline"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { signOut } from "firebase/auth"
import { auth } from "../../firebase"
import { toast } from "react-toastify"

function AdminHeader({ sidebarOpen }) {
  const [open, setOpen] = useState(false)
  const dropdownRef = useRef(null)
  const navigate = useNavigate()

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast.success("Logged out successfully")
      navigate("/")
    } catch (err) {
      console.error("Logout failed", err)
      toast.error("Failed to logout")
    }
  }

  return (
    <header
      className={`bg-white/95 backdrop-blur-md shadow-md border-b border-gray-200 px-6 py-4 flex justify-between items-center
      fixed top-0 right-0 z-20 transition-all duration-300
      ${sidebarOpen ? "left-64" : "left-20"}`}
    >
      {/* Left - Empty space for future content */}
      <div className="flex items-center">
        {/* Reserved for future content */}
      </div>

      {/* Right */}
      <div className="flex items-center space-x-4 relative" ref={dropdownRef}>
        <button 
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 hover:text-[#7A3DF0] transition-colors relative"
          aria-label="Notifications"
        >
          <BellIcon className="w-5 h-5" />
        </button>

        {/* Profile Avatar */}
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="focus:outline-none focus:ring-2 focus:ring-[#7A3DF0]/30 rounded-full transition-all"
          aria-label="User menu"
        >
          <img
            src="/images/free-user-icon.png"
            alt="Admin Avatar"
            className="w-9 h-9 rounded-full border-2 border-gray-200 hover:border-[#7A3DF0]/50 transition-colors"
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-14 w-48 bg-white/95 backdrop-blur-md border border-gray-200 rounded-lg shadow-lg py-2 z-50">
            <button
              onClick={() => {
                navigate("/profile")
                setOpen(false)
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[#F5EBFF] hover:text-[#502455] transition-colors"
            >
              Profile
            </button>

            <div className="border-t border-gray-200 my-1" />

            <button
              onClick={() => {
                handleLogout()
                setOpen(false)
              }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

export default AdminHeader
