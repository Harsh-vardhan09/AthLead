import React from "react";
import { Outlet } from "react-router";

const Layout = () => {
  return (
    <section>
      <Outlet />
    </section>
  );
};

export default Layout;
