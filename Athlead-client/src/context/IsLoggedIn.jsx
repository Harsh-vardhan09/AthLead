import { Navigate} from "react-router";
import { useAuth } from "./useAuth";
import { Children } from "react";

const IsLoggedIn = ({ children }) => {
  const { loggedIn } = useAuth();

  if (loggedIn) {
    return <Navigate to={"/dashboard"} replace />;
  }
  return children;
};

export default IsLoggedIn;
