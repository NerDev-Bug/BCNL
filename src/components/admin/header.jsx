// src/components/admin/header.jsx
import { Bars3Icon, BellIcon } from "@heroicons/react/24/outline"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { signOut } from "firebase/auth"
import { auth } from "../../firebase"
import { toast } from "react-toastify"

function AdminHeader({ toggleSidebar, sidebarOpen }) {
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
      className={`bg-white shadow-md p-4 flex justify-between items-center
      fixed top-0 right-0 z-10 transition-all duration-300
      ${sidebarOpen ? "left-64" : "left-0"}`}
    >
      {/* Left */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded hover:bg-gray-100"
        >
          <Bars3Icon className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center space-x-6 relative" ref={dropdownRef}>
        <button className="p-2 rounded hover:bg-gray-200 transition">
          <BellIcon className="w-5 h-5 text-gray-700" />
        </button>

        {/* Profile Avatar */}
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="focus:outline-none"
        >
          <img
            src="/images/free-user-icon.png"
            alt="Admin Avatar"
            className="w-8 h-8 rounded-full border"
          />
        </button>

        {/* Dropdown */}
        {open && (
          <div className="absolute right-0 top-12 w-44 bg-white border rounded-md shadow-lg py-1">
            <button
              onClick={() => {
                navigate("/profile")
                setOpen(false)
              }}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
            >
              Profile
            </button>

            <div className="border-t my-1" />

            <button
              onClick={() => {
                handleLogout()
                setOpen(false)
              }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
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
