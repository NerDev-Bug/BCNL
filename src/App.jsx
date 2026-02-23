import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Order from "./pages/Order";
import Menu from "./pages/Menu";
import Wishlist from "./components/Wishlist";
import AdminDashboard from "./components/admin/dashboard";
import UsersPage from "./components/admin/users";
import ProductsPage from "./components/admin/products";
import OrdersPage from "./components/admin/orders";
import SalesPage from "./components/admin/sales";
import CustomersPage from "./components/admin/customers";
import ReportsPage from "./components/admin/reports";
import DiscountsPage from "./components/admin/discounts";
import BundlesPage from "./components/admin/bundles";
import Profile from "./pages/Profile";
import ProductDetail from "./pages/ProductDetails";
import Pages from "./components/admin/pages";
import PaymentSuccess from "./pages/PaymentSuccess";
import Events from "./pages/Events"
import Notifications from "./pages/Notifications"

// React Toastify
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";

function App() {
  return (
    <>
      {/* ROUTES */}
      <Routes>

        {/* USER PAGES */}
        <Route element={<UserLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/order" element={<Order />} />
          <Route path="/events" element={<Events />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/product/:id" element={<ProductDetail />} />

          {/* ✅ PAYMENT SUCCESS PAGE */}
          <Route path="/payment-success" element={<PaymentSuccess />} />
          {/* ✅ NOTIFICATIONS PAGE */}
          <Route path="/notifications" element={<Notifications />} />
        </Route>

        {/* ADMIN PAGES */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/products" element={<ProductsPage />} />
          <Route path="/admin/orders" element={<OrdersPage />} />
          {/* Redirect old /admin/orders/returned to new query param format */}
          <Route path="/admin/orders/returned" element={<Navigate to="/admin/orders?tab=returned" replace />} />
          <Route path="/admin/sales" element={<SalesPage />} />
          <Route path="/admin/customers" element={<CustomersPage />} />
          <Route path="/admin/reports" element={<ReportsPage />} />
          <Route path="/admin/discounts" element={<DiscountsPage />} />
          <Route path="/admin/bundles" element={<BundlesPage />} />
          <Route path="/admin/pages" element={<Pages />} />
        </Route>

      </Routes>

      {/* TOAST CONTAINER */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        style={{ zIndex: 99999 }}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        pauseOnHover
        draggable
        pauseOnFocusLoss
      />
    </>
  );
}

export default App;
