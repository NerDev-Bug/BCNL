// src/layouts/AdminLayout.jsx
// Protects admin routes: requires login + Firestore role === "admin".
// Optional: session idle timeout (30 min) for security.
import { useEffect, useState } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";
import {
  touchAdminSession,
  clearAdminSession,
  isAdminSessionExpired,
} from "../utils/sessionSecurity";
import AdminHeader from "../components/admin/header";
import AdminSidebar from "../components/admin/sidebar";

function AdminLayout() {
  const { user, isAdmin, authLoading } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Redirect URL: send user back to login, then after login redirect to the admin path they wanted
  const loginRedirect = `/?login=1&redirect=${encodeURIComponent(location.pathname + location.search)}`;

  // Session idle: track activity and log out after inactivity
  useEffect(() => {
    if (!user || !isAdmin) return;
    touchAdminSession();

    const onActivity = () => touchAdminSession();
    window.addEventListener("click", onActivity);
    window.addEventListener("keydown", onActivity);

    const interval = setInterval(() => {
      if (isAdminSessionExpired()) {
        clearAdminSession();
        signOut(auth);
        toast.info("Logged out due to inactivity for your security.");
        window.location.href = "/?login=1";
      }
    }, 60 * 1000); // check every minute

    return () => {
      window.removeEventListener("click", onActivity);
      window.removeEventListener("keydown", onActivity);
      clearInterval(interval);
    };
  }, [user, isAdmin]);

  // Sidebar toggle
  useEffect(() => {
    const handler = () => setSidebarOpen((prev) => !prev);
    window.addEventListener("admin-sidebar-toggle", handler);
    return () => window.removeEventListener("admin-sidebar-toggle", handler);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-[#7B2220] border-t-transparent rounded-full animate-spin" />
          <p className="mt-3 text-sm text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={loginRedirect} replace />;
  }

  if (!isAdmin) {
    toast.error("Access denied. Admin only.");
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar
        isOpen={sidebarOpen}
        mobileMenuOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div
        className={`flex-1 min-h-screen min-w-0 overflow-x-hidden bg-gray-100 transition-all duration-300 ml-0 ${
          sidebarOpen ? "md:ml-64" : "md:ml-20"
        }`}
      >
        <AdminHeader
          sidebarOpen={sidebarOpen}
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen((p) => !p)}
        />

        <main className="pt-14 md:pt-16 px-3 sm:px-4 md:px-6 pb-6 min-h-screen min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
