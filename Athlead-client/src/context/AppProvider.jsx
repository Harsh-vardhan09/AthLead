import { useState } from "react";
import AppContext from "./AppContext";

const AppProvider = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("accessToken"),
  );

  return (
    <AppContext.Provider value={{ loggedIn, setLoggedIn }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppProvider;
