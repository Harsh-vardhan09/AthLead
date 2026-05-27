import { useState, useEffect } from "react";
import AppContext from "./AppContext";
import { api } from "../api/axios";

const AppProvider = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data) setLoggedIn(true);
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem("accessToken");
          setLoggedIn(false);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppContext.Provider value={{ loggedIn, setLoggedIn, loading }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;