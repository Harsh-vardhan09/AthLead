import React, { useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { cn } from "../utility/cn";
import { FaRegUserCircle } from "react-icons/fa";
import { isUserAuthenticated } from "../utility/Utils";
// import { useParams } from "react-router-dom";

const Navbar = () => {
  const [isAuth, setAuth] = useState(false);

  const location = useLocation();
  const pathname = location.pathname;
  console.log(location.pathname);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  



  const navigate = useNavigate();

  const handleButtonClick = () => {
    navigate("/Authentication");
  };

  const navItems = [
    { name: "Events", path: "/Events" },
    { name: "About Us", path: "/About" },
    { name: "Program", path: "/Program" },
  ];
  const HiddenItems = [
    { name: "Events", path: "/Events" },
    { name: "About Us", path: "/About" },
    { name: "Program", path: "/Program" },
    { name: "profile", path: "/Dashboard" },
    { name: "Sign in", path: "/Authentication" },
  ];

  useEffect(() => {
    (async () => {
      setAuth(await isUserAuthenticated());
    })();
  }, []);

  return (
    <header
      className={cn(
        "fixed relative z-50 p-4 md:p-2 text-black",
        pathname == "/" && "bg-transparent absolute inset-0 text-white",
        pathname == "/About" && "bg-transparent absolute inset-0 text-white",
        pathname == "/Dashboard" &&
          "fixed relative z-50 bg-gray-800 text-white",
        pathname == "/Authentication" &&
          "fixed relative z-50 bg-gray-800 text-white",
          pathname == "/Scorecard" &&
          "fixed relative z-50 bg-gray-800 text-white"
      )}
    >
      <div
        className="container mx-auto flex items-center justify-between
      "
      >
        <div className="flex flex-row  justify-between ">
          <Link
            to="/"
            className="text-xl font-bold text-gray-800 focus:outline-none md:text-4xl"
          >
            <span
              className={cn(
                pathname == "/" && "text-white",
                pathname == "/Dashboard" && " text-white",
                pathname == "/Authentication" && " text-white",
                pathname == "/Scorecard" && " text-white"
              )}
            >
              AthLead
            </span>
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-4">
          {/* <button className="focus:outline-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                onClick={handleButtonClick}
              />
            </svg>
          </button> */}
          <nav className="hidden md:flex md:flex-row  md:space-x-10 text-xl mr-10">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="transition-colors duration-200 focus:outline-none"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <Link to={isAuth ? "/Dashboard" : "/Authentication"}>
            <button className="text-4xl">
              <FaRegUserCircle />
            </button>
          </Link>

          <button
            className="px-6 py-2 bg-white text-blue-500 rounded-full font-semibold shadow-lg hover:bg-gray-200 transition-colors duration-200 focus:outline-none"
            onClick={handleButtonClick}
          >
            SIGN IN
          </button>
        </div>
        <div className="md:hidden ">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={cn("text-black focus:outline-none",
              pathname == "/" && " text-white focus:outline-none",
              pathname == "/Authentication" && " text-white focus:outline-none",
              pathname == "/Dashboard" && " text-white focus:outline-none",
              pathname == "/Scorecard" && " text-white focus:outline-none",
              
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
        </div>
      </div>
      {isMenuOpen && (
        <div className="md:hidden mt-4 p-4 bg-gray-900 bg-opacity-80 rounded-lg shadow-lg">
          <nav className="flex flex-col space-y-2">
            {HiddenItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className="text-white hover:text-gray-300 text-left py-2 px-4 transition-colors duration-200 focus:outline-none"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar;
