import { Outlet } from "react-router";
import Sidebar from "../../Components/Sidebar";
import React, { useState } from "react";
import { Menu } from "lucide-react";
import { adminNavItems } from "../../assets/assets";

const AdminLayout = () => {
  const [sidebar, setSidebar] = useState(false);

  return (
    <section className="flex min-h-screen">
      <div className="dark-bg">
        <Sidebar
          pinned
          sidebar={sidebar}
          setSidebar={setSidebar}
          navItems={adminNavItems}
        />
      </div>
      <div className="flex-1">
        <Menu
          className="m-3 p-2 bg-[rgba(20,184,166,0.10)] rounded-md shadow w-10 h-10 text-gray-600 cursor-pointer lg:hidden"
          onClick={() => setSidebar(true)}
        />
        <Outlet />
      </div>
    </section>
  );
};

export default AdminLayout;
