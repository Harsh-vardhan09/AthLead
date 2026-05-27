import { Navigate } from "react-router";
import { useAuth } from "./useAuth";

const IsLoggedIn = ({ children }) => {
  const { loggedIn, loading } = useAuth();

  if (loading) return null;
  if (loggedIn) return <Navigate to="/dashboard" replace />;
  return children;
};

export default IsLoggedIn;