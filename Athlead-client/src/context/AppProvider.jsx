import { useState, useEffect, useCallback } from "react";
import AppContext from "./AppContext";
import { userService } from "../api";

const AppProvider = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoggedIn(false);
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await userService.getMe();
      if (res.data) {
        setLoggedIn(true);
        setUser(res.data.user);
        if (!res.data.user) {
          return res.json({ message: "User not found" });
        }
        return res.data.user;
      }
    } catch (err) {
      localStorage.removeItem("accessToken");
      setLoggedIn(false);
      setUser(null);
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <AppContext.Provider
      value={{ loggedIn, setLoggedIn, loading, user, setUser, fetchUser }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
