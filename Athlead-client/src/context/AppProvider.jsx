import { useState } from "react";
import { createContext,useContext } from "react";

const appContext = createContext();

const AppProvider = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState(
    !!localStorage.getItem("accessToken"),
  );
  return (
  <appContext.Provider value={{loggedIn,setLoggedIn}}>
      {children}
  </appContext.Provider>)
};

export default AppProvider;
export const useAuth = () => useContext(appContext);