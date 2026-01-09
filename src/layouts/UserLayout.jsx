// src/layouts/UserLayout.jsx
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import FooterNavbar from "../components/layouts/footer";
import ScrollToTop from "../components/ScrollToTop";

function UserLayout() {
  return (
    <>
      <ScrollToTop />
      <Navbar />
      <Outlet />
      <FooterNavbar />
    </>
  );
}

export default UserLayout;
