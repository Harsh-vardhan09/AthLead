import { Navigate } from "react-router";
import { useAuth } from "./useAuth";

const AdminRoute = ({ children }) => {
  const { loggedIn, loading, user } = useAuth();

  if (loading) return null;
  if (!loggedIn) return <Navigate to="/login" replace />;
  if (user?.role !== "ADMIN") return <Navigate to="/" replace />;
  return children;
};

export default AdminRoute;
