import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import AppContext from "./AppContext";
import { api, onAuthFailure } from "../api/axios";

const AppProvider = ({ children }) => {
  // Optimistic until /me answers, so a returning user does not see a flash of
  // the logged-out navbar. fetchUser corrects it if the session is invalid.
  const [loggedIn, setLoggedIn] = useState(() =>
    Boolean(localStorage.getItem("accessToken")),
  );
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const clearSession = useCallback(() => {
    localStorage.removeItem("accessToken");
    setLoggedIn(false);
    setUser(null);
  }, []);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setLoggedIn(false);
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get("/api/auth/me");
      const me = res.data?.user;

      if (!me) {
        setLoggedIn(false);
        setUser(null);
        return;
      }

      setUser(me);
      setLoggedIn(true);
      return me;
    } catch (err) {
      // A 401 has already been through the interceptor's refresh attempt; if
      // that failed for real, it removed the token and notified us. Any other
      // failure (network error, 5xx) leaves the stored token alone so that a
      // reload can recover the session instead of forcing a new login.
      setLoggedIn(false);
      setUser(null);
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // The refresh cookie is gone or expired: the session is over. Bring the UI
  // in line with the (already cleared) token so ProtectedRoute redirects.
  useEffect(() => {
    const unsubscribe = onAuthFailure(() => {
      clearSession();
      toast.error("Your session has expired. Please log in again.", {
        id: "session-expired",
      });
    });

    return unsubscribe;
  }, [clearSession]);

  // Signing out must always succeed locally. The server call only clears the
  // refresh cookie, so an offline server or an already-dead session must not
  // leave the user stuck on a "logged in" screen.
  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout", {}, { timeout: 5000 });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      clearSession();
    }
  }, [clearSession]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <AppContext.Provider
      value={{
        loggedIn,
        setLoggedIn,
        loading,
        user,
        setUser,
        fetchUser,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
