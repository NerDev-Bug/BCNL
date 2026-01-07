// src/layouts/AdminLayout.jsx
import { useState } from "react";
import AdminHeader from "../components/admin/header";
import AdminSidebar from "../components/admin/sidebar";
import { Outlet } from "react-router-dom";

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex">
      <AdminSidebar isOpen={sidebarOpen} />

      {/* MAIN CONTENT */}
      <div
        className={`flex-1 min-h-screen bg-gray-100 transition-all duration-300
        ${sidebarOpen ? "ml-64" : "ml-0"}`}
      >
        <AdminHeader
          sidebarOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="pt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
