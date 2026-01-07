// src/components/admin/sidebar.jsx
import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  UsersIcon,
  ShoppingBagIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";

function AdminSidebar({ isOpen }) {
  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 p-3 rounded-md transition
     ${isActive ? "bg-gray-300 text-blue-600" : "hover:text-blue-400 text-[#502455]"}`;

  return (
    <aside
      className={`fixed top-0 left-0 h-screen w-64 bg-white shadow-md
      transform transition-transform duration-300 z-20
      ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div className="text-black p-6 text-xl font-bold border-b border-gray-300">
        <NavLink to="/">Bake Corner NL</NavLink>
      </div>

      <nav className="p-4 space-y-2 font-bold">
        <NavLink to="/admin/dashboard" className={linkClass}>
          <HomeIcon className="w-5 h-5" />
          Dashboard
        </NavLink>

        <NavLink to="/admin/users" className={linkClass}>
          <UsersIcon className="w-5 h-5" />
          Users
        </NavLink>

        <NavLink to="/admin/orders" className={linkClass}>
          <ShoppingBagIcon className="w-5 h-5" />
          Orders
        </NavLink>

        <NavLink to="/admin/products" className={linkClass}>
          <CubeIcon className="w-5 h-5" />
          Products
        </NavLink>
      </nav>
    </aside>
  );
}

export default AdminSidebar;
