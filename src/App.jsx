import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Order from "./pages/Order";
import Menu from "./pages/Menu";
import Wishlist from "./components/Wishlist";
import AdminDashboard from "./pages/admin/dashboard";
import UsersPage from "./pages/admin/users";
import ProductsPage from "./pages/admin/products";
import OrdersPage from "./pages/admin/orders";
import Profile from "./pages/Profile";
import ProductDetail from "./pages/ProductDetails";

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
        <Route path="/profile" element={<Profile />} />
        <Route path="/product/:id" element={<ProductDetail />} />

        </Route>

        {/* ADMIN PAGES */}
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<UsersPage />} />
          <Route path="/admin/products" element={<ProductsPage />} />
          <Route path="/admin/orders" element={<OrdersPage />} />
        </Route>

      </Routes>
    
      {/* TOAST CONTAINER */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
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