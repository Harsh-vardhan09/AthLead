import { Outlet } from "react-router";
import Sidebar from "../../Components/Sidebar";
import React, { useState } from "react";
import { Menu } from "lucide-react";
import { adminNavItems } from "../../assets/assets";

const AdminLayout = () => {
  const [sidebar, setSidebar] = useState(false);

  return (
    <section className="flex min-h-screen w-full bg-slate-50">
      <div className="dark-bg lg:block">
        <Sidebar
          pinned
          showLogout
          sidebar={sidebar}
          setSidebar={setSidebar}
          navItems={adminNavItems}
        />
      </div>
      <div className="flex-1 min-w-0 flex flex-col w-full">
        <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200 lg:hidden shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setSidebar(true)}
              className="p-2 rounded-lg bg-[rgba(20,184,166,0.10)] text-teal-700 hover:bg-[rgba(20,184,166,0.20)] transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-semibold text-slate-800 text-sm">
              AthLead Admin
            </span>
          </div>
        </header>
        <main className="flex-1 min-w-0 w-full">
          <Outlet />
        </main>
      </div>
    </section>
  );
};

export default AdminLayout;
