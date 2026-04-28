import React, { useState } from "react";
import { assets, navItems } from "../assets/assets";
import { useLocation, useNavigate } from "react-router";
import { CircleUser, X } from "lucide-react";
import { cn } from "../utility/cn";
import { useEffect } from "react";
import toast from "react-hot-toast";
import { api } from "../api/axios";
import { useAuth } from "../context/AppProvider";

const Navbar = ({ sidebar, setSidebar}) => {
  const {loggedIn,setLoggedIn}=useAuth()
  const navigate = useNavigate();

  const location = useLocation();
  const pathname = location.pathname;

  const logout = async () => {
    const res = await api.post("/api/auth/logout", {});
    if (res.data.success) {
      localStorage.removeItem("accessToken");
      navigate("/login");
      setLoggedIn(false);
      toast.success(res.data.message);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");

    if (token) {
      setLoggedIn(true);
    }
  }, []);

  return (
    <>
      {/* navbar */}
      <nav
        className={cn(
          "w-full h-18 flex items-center justify-between b-0 t-0 z-1 border-b border-gray-50/8",
          pathname == "/" && "absolute",
        )}
      >
        <div
          onClick={() => navigate("/")}
          className=" ml-15 lg:ml-10 font-bold "
        >
          {sidebar ? (
            <></>
          ) : (
            <img src={assets.Logo} className="h-15 w-30 lg:h-20 lg:w-50 " />
          )}
        </div>
        <div className="flex justify-end mr-10 ">
          <ul className=" hidden flex-1 lg:flex items-center justify-between gap:4 lg:gap-8">
            {navItems.map((item) => (
              <li
                key={item.name}
                onClick={() => navigate(item.path)}
                className="cursor-pointer text-[#64748b] hover:text-[#a7b0bd] max-lg:text-sm  "
              >
                {item.name}
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-end gap-1 lg:gap-3">
            {loggedIn ? (
              <>
                <CircleUser
                  strokeWidth={1.75}
                  onClick={()=>navigate("/dashboard")}
                  className="h-6 w-12 xs:w-18 xs:h-8 ml-4 text-[#2dd4bf] hover:text-[#075f53] hover:ease-in-out transition-all"
                />
                <button
                  onClick={logout}
                  className="h-10 w-16 xs:w-24 flex items-center justify-center rounded-xl ml-2 md:ml-4 cursor-pointer border border-[rgba(20,184,166,0.25)] text-[#2dd4bf] bg-[rgba(20,184,166,0.10)] hover:bg-[rgba(53,205,187,0.1)]"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                className="h-10 w-24 flex items-center justify-center rounded-xl ml-4 cursor-pointer border border-[rgba(20,184,166,0.25)] text-[#2dd4bf] bg-[rgba(20,184,166,0.10)] hover:bg-[rgba(53,205,187,0.1)]"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-black/40 z-30 transform transition-transform duration-300 
        ${sidebar ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex p-4">
          <div className="flex flex-col justify-start gap-8">
            <div className="flex items-center justify-around ">
              <div
                onClick={() => {
                  navigate("/");
                  setSidebar(false);
                }}
                className="font-bold "
              >
                <img src={assets.Logo} className="h-15 w-40   " />
              </div>

              <X
                className="h-7 w-7 cursor-pointer text-white ml-15"
                onClick={() => setSidebar(false)}
              />
            </div>

            <ul className="flex flex-col gap-10">
              {navItems.map((item) => (
                <li
                  key={item.name}
                  onClick={() => {
                    navigate(item.path);
                    setSidebar(false);
                  }}
                  className="cursor-pointer text-[#64748b] hover:text-[#a7b0bd] text-lg"
                >
                  {item.name}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {sidebar && (
        <div
          onClick={() => setSidebar(false)}
          className="fixed inset-0 bg-black/50 z-20"
        />
      )}
    </>
  );
};

export default Navbar;
