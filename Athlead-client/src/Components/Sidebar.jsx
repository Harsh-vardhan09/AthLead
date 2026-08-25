import { LogOut, X } from "lucide-react";
import { assets } from "../assets/assets";
import { useNavigate } from "react-router";
import { cn } from "../utility/cn";
import React from "react";
import toast from "react-hot-toast";
import { api } from "../api/axios";
import { useAuth } from "../context/useAuth";

// pinned: stays visible on lg+ (admin layout); otherwise it's a drawer only.
// showLogout: renders a logout button pinned to the bottom (admin sidebar only).
const Sidebar = ({ sidebar, setSidebar, navItems, pinned, showLogout }) => {
  const navigate = useNavigate();
  const { setLoggedIn } = useAuth();

  const go = (path) => {
    navigate(path);
    setSidebar(false);
  };

  const logout = async () => {
    const res = await api.post("/api/auth/logout", {});
    if (res.data.success) {
      localStorage.removeItem("accessToken");
      setLoggedIn(false);
      setSidebar(false);
      navigate("/login");
      toast.success(res.data.message);
    }
  };

  return (
    <>
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-black/40 z-30 transform transition-transform duration-300",
          sidebar ? "translate-x-0" : "-translate-x-full",
          pinned &&
            "lg:sticky lg:top-0 lg:h-screen lg:shrink-0 lg:translate-x-0",
        )}
      >
        <div className="flex flex-col justify-start gap-8 p-4 h-full">
          <div className="flex items-center justify-around">
            <div onClick={() => go("/")} className="font-bold cursor-pointer">
              <img src={assets.Logo} className="h-15 w-40" />
            </div>

            <X
              className={cn(
                "h-7 w-7 cursor-pointer text-white ml-15",
                pinned && "lg:hidden",
              )}
              onClick={() => setSidebar(false)}
            />
          </div>

          <ul className="flex flex-col gap-10">
            {navItems.map((item) => (
              <li
                key={item.name}
                onClick={() => go(item.path)}
                className="cursor-pointer text-[#64748b] hover:text-[#a7b0bd] text-lg"
              >
                {item.name}
              </li>
            ))}
          </ul>

          {showLogout && (
            <button
              onClick={logout}
              className="mt-auto flex items-center gap-2 cursor-pointer text-[#64748b] hover:text-[#a7b0bd] text-lg"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          )}
        </div>
      </aside>

      {sidebar && (
        <div
          onClick={() => setSidebar(false)}
          className={cn(
            "fixed inset-0 bg-black/50 z-20",
            pinned && "lg:hidden",
          )}
        />
      )}
    </>
  );
};

export default Sidebar;
