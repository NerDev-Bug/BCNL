// src/components/admin/header.jsx
import { Bars3Icon, BellIcon } from "@heroicons/react/24/outline";

function AdminHeader({ toggleSidebar, sidebarOpen }) {
  return (
    <header
      className={`bg-white shadow-md p-4 flex justify-between items-center
      fixed top-0 right-0 z-10 transition-all duration-300
      ${sidebarOpen ? "left-64" : "left-0"}`}
    >
      <div className="flex items-center space-x-4">
        {/* Hamburger */}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded hover:bg-gray-100"
        >
          <Bars3Icon className="w-6 h-6 text-gray-700" />
        </button>

        {/* <h1 className="text-xl font-semibold text-gray-800">
          Admin Panel
        </h1> */}
      </div>

      {/* User */}
      <div className="flex items-center space-x-6">
        <button className="p-2 rounded hover:bg-gray-200 transition">
            <BellIcon className="w-5 h-5 text-gray-700" />
        </button>
        <img
          src="/images/free-user-icon.png"
          alt="Admin Avatar"
          className="w-8 h-8 rounded-full"
        />
      </div>
    </header>
  );
}

export default AdminHeader;
