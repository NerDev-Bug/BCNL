import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Order from "./pages/Order";
import Menu from "./pages/Menu";
import OurStory from "./pages/OurStory";
import Wishlist from "./components/Wishlist";
import AdminDashboard from "./pages/admin/dashboard";
import UsersPage from "./pages/admin/users";
import ProductsPage from "./pages/admin/products";
import OrdersPage from "./pages/admin/orders";

import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";

function App() {
  return (
    <Routes>

      {/* USER PAGES */}
      <Route element={<UserLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/order" element={<Order />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/our-story" element={<OurStory />} />
        <Route path="/wishlist" element={<Wishlist />} />
      </Route>

      {/* ADMIN PAGES */}
      <Route element={<AdminLayout />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UsersPage />} />
        <Route path="/admin/products" element={<ProductsPage />} />
        <Route path="/admin/orders" element={<OrdersPage />} />
      </Route>

    </Routes>
  );
}

export default App;
