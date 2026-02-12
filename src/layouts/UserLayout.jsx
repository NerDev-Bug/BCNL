// src/layouts/UserLayout.jsx
import { Outlet } from "react-router-dom";
import { CartProvider } from "../context/CartContext";
import Navbar from "../components/Navbar";
import FooterNavbar from "../components/layouts/footer";
import ScrollToTop from "../components/ScrollToTop";
import MonthlyRating from "../components/MonthlyRating";

function UserLayout() {
  return (
    <CartProvider>
      <ScrollToTop />
      <Navbar />
        <Outlet />
      <MonthlyRating />
      <FooterNavbar />
    </CartProvider>
  );
}

export default UserLayout;
