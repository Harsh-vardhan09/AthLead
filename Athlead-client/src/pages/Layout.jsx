import React, { useEffect, useState } from "react";
import Navbar from "../Components/Navbar";
import { Outlet } from "react-router";
import { Menu, ArrowUp } from "lucide-react";
import { useAuth } from "../context/useAuth";

const Layout = () => {
  const [sidebar, setSidebar] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const { loggedIn, setLoggedIn } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <section className="dark-bg">
      <Navbar
        sidebar={sidebar}
        setSidebar={setSidebar}
        loggedIn={loggedIn}
        setLoggedIn={setLoggedIn}
      />

      <div>
        <Outlet />
      </div>

      {!sidebar && (
        <Menu
          className="absolute top-3 left-1 z-[100] h-10 w-10 rounded-md bg-[rgba(20,184,166,0.10)] p-2 text-gray-600 shadow lg:hidden"
          onClick={() => setSidebar(true)}
        />
      )}

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          title="Scroll to top"
          className="fixed bottom-6 right-6 z-50 grid h-12 w-12 place-items-center rounded-full bg-teal-500 text-white shadow-lg transition-all hover:scale-105 hover:bg-teal-600"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </section>
  );
};

export default Layout;