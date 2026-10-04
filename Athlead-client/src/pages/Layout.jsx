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

      {sidebar ? (
        <></>
      ) : (
        <Menu
          className="absolute top-3 left-1 p-2 z-100 bg-[rgba(20,184,166,0.10)] rounded-md shadow w-10 h-10 text-gray-600 lg:hidden"
          onClick={() => setSidebar(true)}
        />
      )}

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll to top"
          title="Scroll to top"
          className="fixed bottom-6 right-6 z-50 rounded-full bg-teal-500 p-3 text-white shadow-lg transition hover:scale-110 hover:bg-teal-600"
        >
          <ArrowUp size={22} />
        </button>
      )}
    </section>
  );
};

export default Layout;