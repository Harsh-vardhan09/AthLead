import React, { useState } from "react";
import Navbar from "../Components/Navbar";
import { Outlet } from "react-router";
import { Menu, X } from "lucide-react";

const Layout = () => {
  const [sidebar, setSidebar] = useState(false);
  return (
    <section className="dark-bg " >
      <Navbar sidebar={sidebar} setSidebar={setSidebar} />
      <div>
        <Outlet />
      </div>
      {sidebar ? (
        <></>
      ) : (
        <Menu
          className="absolute top-3 left-1 p-2 z-100 bg-[rgba(20,184,166,0.10)] rounded-md shadow w-10 h-10 text-gray-600 lg:hidden"
          onClick={() => setSidebar(true)}
        />
      )}
    </section>
  );
};

export default Layout;
