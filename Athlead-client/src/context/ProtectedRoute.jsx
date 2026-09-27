import { Navigate } from "react-router";
import { useAuth } from "./useAuth";

const ProtectedRoute = ({ children, allowedRoles }) => {
  // Extract user object alongside loggedIn and loading states
  const { loggedIn, loading, user } = useAuth();

  if (loading) return null;
  
  if (!loggedIn) return <Navigate to="/login" replace />;

  // Enforce role-based access if allowedRoles are provided
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role?.toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase());
    
    // Redirect unauthorized users to the main dashboard
    if (!userRole || !normalizedAllowedRoles.includes(userRole)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
