// src/layouts/UserLayout.jsx
import { Outlet } from "react-router-dom";
import { CartProvider } from "../context/CartContext";
import Navbar from "../components/Navbar";
import FooterNavbar from "../components/layouts/footer";
import ScrollToTop from "../components/ScrollToTop";

function UserLayout() {
  return (
    <CartProvider>
      <ScrollToTop />
      <Navbar />
        <Outlet />
      <FooterNavbar />
    </CartProvider>
  );
}

export default UserLayout;
