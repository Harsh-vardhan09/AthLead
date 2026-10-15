import { Navigate } from "react-router";
import { useAuth } from "./useAuth";

const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { loggedIn, loading, user } = useAuth();

  if (loading) return null;
  if (!loggedIn) return <Navigate to="/login" replace />;

  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default RoleBasedRoute;
