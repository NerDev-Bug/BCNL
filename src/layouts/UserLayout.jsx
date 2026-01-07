// src/layouts/UserLayout.jsx
import Navbar from "../components/Navbar";
import FooterNavbar from "../components/layouts/footer";
import { Outlet } from "react-router-dom";

function UserLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
      <FooterNavbar />
    </>
  );
}

export default UserLayout;
