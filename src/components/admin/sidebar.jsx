// src/components/admin/sidebar.jsx
import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  HomeIcon,
  BanknotesIcon,
  ClipboardDocumentListIcon,
  CubeIcon,
  UserGroupIcon,
  ChartBarSquareIcon,
  ShieldCheckIcon,
  TagIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase";

/**
 * AdminSidebar
 *
 * - Vertical, collapsible sidebar
 * - Uses React Router v6 NavLink for active highlighting
 * - Uses Firestore onSnapshot for real‑time badge counts
 *
 * `isOpen` = desktop expanded; `mobileMenuOpen` = mobile drawer visible; `onCloseMobile` = close mobile drawer.
 */
function AdminSidebar({ isOpen, mobileMenuOpen = false, onCloseMobile }) {
  const location = useLocation();

  // Real‑time badge counts from Firestore
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  // ✅ Real‑time pending orders count
  useEffect(() => {
    try {
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("status", "==", "pending"));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        setPendingOrdersCount(snapshot.size);
      });

      return unsubscribe;
    } catch (err) {
      console.error("Failed to subscribe to pending orders:", err);
    }
  }, []);

  // ✅ Real‑time low‑stock products count (based on dailyLimit)
  useEffect(() => {
    try {
      const productsRef = collection(db, "products");
      // Check products with dailyLimit <= 5
      const q = query(productsRef, where("dailyLimit", "<=", 5));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        // Filter out products with dailyLimit <= 0 or null
        const validLowStock = snapshot.docs.filter((doc) => {
          const data = doc.data();
          return typeof data.dailyLimit === "number" && data.dailyLimit > 0;
        });
        setLowStockCount(validLowStock.length);
      });

      return unsubscribe;
    } catch (err) {
      console.error("Failed to subscribe to low‑stock products:", err);
    }
  }, []);

  // Central menu configuration
  const menuItems = useMemo(
    () => [
      {
        title: "Dashboard",
        route: "/admin/dashboard",
        icon: HomeIcon,
        description: "Overview of sales, orders, and inventory health.",
      },
      {
        title: "Sales / Transactions",
        route: "/admin/sales",
        icon: BanknotesIcon,
        description: "List of all payments, refunds, and returns.",
      },
      {
        title: "Orders / POS Orders",
        route: "/admin/orders",
        icon: ClipboardDocumentListIcon,
        description: "Pending, in‑progress, and completed POS orders.",
        badgeKey: "pendingOrders",
      },
      {
        title: "Products / Inventory",
        route: "/admin/products",
        icon: CubeIcon,
        description: "Product catalog, stock, categories, and alerts.",
        badgeKey: "lowStock",
      },
      {
        title: "Customers",
        route: "/admin/customers",
        icon: UserGroupIcon,
        description: "Customer profiles, history, and loyalty points.",
      },
      {
        title: "Reports",
        route: "/admin/reports",
        icon: ChartBarSquareIcon,
        description: "Sales, inventory, and financial reporting.",
      },
      {
        title: "Users / Staff",
        route: "/admin/users",
        icon: ShieldCheckIcon,
        description: "Staff roles, permissions, and activity logs.",
      },
      {
        title: "Discounts / Promotions",
        route: "/admin/discounts",
        icon: TagIcon,
        description: "Promo codes, discounts, and loyalty programs.",
      },
      {
        title: "Pages",
        route: "/admin/pages",
        icon: CubeIcon,
        description: "Marketing and content pages for the site.",
      },
    ],
    []
  );

  const badgeValues = {
    pendingOrders: pendingOrdersCount,
    lowStock: lowStockCount,
  };

  const isCollapsed = !isOpen;

  const linkClass = ({ isActive }) =>
    [
      "group flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-150",
      "text-sm font-semibold",
      isCollapsed && "md:justify-center",
      isActive
        ? "bg-[#F5EBFF] text-[#502455] shadow-sm"
        : "text-[#502455] hover:bg-gray-100 hover:text-[#7A3DF0]",
    ].join(" ");

  const renderBadge = (badgeKey) => {
    if (!badgeKey) return null;
    const value = badgeValues[badgeKey] ?? 0;
    if (!value) return null;

    return (
      <span className="ml-auto inline-flex items-center justify-center rounded-full bg-red-500 px-2 py-0.5 text-[0.7rem] font-semibold text-white">
        {value > 99 ? "99+" : value}
      </span>
    );
  };

  return (
    <>
      {/* Mobile overlay: close drawer on tap */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
          onKeyDown={(e) => e.key === "Escape" && onCloseMobile?.()}
          role="button"
          tabIndex={0}
          aria-label="Close menu"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-gray-200 bg-white shadow-xl transition-all duration-300 ease-out
          w-64
          ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:!translate-x-0
          ${isCollapsed ? "md:w-20" : "md:w-64"}`}
      >
        {/* Brand + collapse toggle + mobile close */}
        <div className="flex items-center justify-between border-b border-gray-200 px-3 py-3 flex-shrink-0">
          <NavLink
            to="/"
            onClick={() => onCloseMobile?.()}
            className={`flex items-center gap-2 font-bold tracking-tight text-[#502455] ${
              isCollapsed ? "md:justify-center md:w-full" : ""
            }`}
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#7A3DF0] text-xs font-black text-white flex-shrink-0">
              BC
            </span>
            <span className={`text-sm truncate ${isCollapsed ? "md:hidden" : ""}`}>
              Bake Corner NL
            </span>
          </NavLink>

          <div className="flex items-center gap-1">
            {/* Mobile: close drawer */}
            <button
              type="button"
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              onClick={onCloseMobile}
              aria-label="Close menu"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            {/* Desktop: collapse / expand */}
            <button
              type="button"
              className="hidden md:inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              onClick={() => window.dispatchEvent(new CustomEvent("admin-sidebar-toggle"))}
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isCollapsed ? (
                <ChevronDoubleRightIcon className="h-4 w-4" />
              ) : (
                <ChevronDoubleLeftIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <div className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActiveRoute = location.pathname.startsWith(item.route);

            return (
              <NavLink
                key={item.route}
                to={item.route}
                className={linkClass}
                title={isCollapsed ? item.title : undefined}
                onClick={onCloseMobile}
              >
                <span
                  className={`relative inline-flex h-9 w-9 items-center justify-center rounded-lg ${
                    isActiveRoute
                      ? "bg-[#7A3DF0]/10 text-[#7A3DF0]"
                      : "bg-gray-100 text-gray-600 group-hover:bg-[#7A3DF0]/10 group-hover:text-[#7A3DF0]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>

                {/* Label + description: on desktop hide when collapsed; mobile drawer always shows labels */}
                <div className={`flex min-w-0 flex-1 flex-col ${isCollapsed ? "md:hidden" : ""}`}>
                  <span className="truncate text-xs font-semibold">{item.title}</span>
                  <span className="truncate text-[0.7rem] font-normal text-gray-500 hidden md:block">
                    {item.description}
                  </span>
                </div>

                {/* Badges */}
                {renderBadge(item.badgeKey)}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </aside>
    </>
  );
}

export default AdminSidebar;
