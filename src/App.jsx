import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Order from "./pages/Order";
import Menu from "./pages/Menu";
import Events from "./pages/Events"
import Wishlist from "./components/Wishlist";
import AdminDashboard from "./components/admin/dashboard";
import UsersPage from "./components/admin/users";
import ProductsPage from "./components/admin/products";
import OrdersPage from "./components/admin/orders";
import Profile from "./pages/Profile";
import ProductDetail from "./pages/ProductDetails";
import Pages from "./components/admin/pages";
import PaymentSuccess from "./pages/PaymentSuccess"; // ✅ ADD THIS

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
          <Route path="/menu" element={<Menu />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/events" element={<Events />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/product/:id" element={<ProductDetail />} />

          {/* ✅ PAYMENT SUCCESS PAGE */}
          <Route path="/payment-success" element={<PaymentSuccess />} />
        </Route>

        {/* ADMIN PAGES */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/products" element={<ProductsPage />} />
          <Route path="/admin/orders" element={<OrdersPage />} />
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
