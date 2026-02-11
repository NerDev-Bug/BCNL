// src/layouts/AdminLayout.jsx
import { useEffect, useState } from "react";
import AdminHeader from "../components/admin/header";
import AdminSidebar from "../components/admin/sidebar";
import { Outlet } from "react-router-dom";

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Optional: listen to sidebar toggle events fired from the sidebar itself
  useEffect(() => {
    const handler = () => setSidebarOpen((prev) => !prev);
    window.addEventListener("admin-sidebar-toggle", handler);
    return () => window.removeEventListener("admin-sidebar-toggle", handler);
  }, []);

  return (
    <div className="flex">
      <AdminSidebar isOpen={sidebarOpen} />

      {/* MAIN CONTENT */}
      <div
        className={`flex-1 min-h-screen bg-gray-100 transition-all duration-300
        ${sidebarOpen ? "ml-64" : "ml-20"}`}
      >
        <AdminHeader sidebarOpen={sidebarOpen} />

        <main className="pt-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
