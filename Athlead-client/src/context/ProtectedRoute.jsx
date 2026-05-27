import { Navigate } from "react-router";
import { useAuth } from "./useAuth";

const ProtectedRoute = ({ children }) => {
  const { loggedIn, loading } = useAuth();

  if (loading) return null;
  if (!loggedIn) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;