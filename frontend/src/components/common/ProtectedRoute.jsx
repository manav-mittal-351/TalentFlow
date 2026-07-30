import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { PageSkeleton } from './PageSkeleton.jsx';
import { ROUTES } from '../../constants/routes.js';
import { getRoleDashboard } from '../../utils/routePermissions.js';

export function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // 1. Show page skeletons while fetching profile sessions
  if (isLoading) {
    return <PageSkeleton />;
  }

  // 2. Gate unauthenticated guest users
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // 3. Gate authenticated users with wrong roles — redirect to their own dashboard
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to={getRoleDashboard(user?.role)} replace />;
  }

  // 4. Resolve children
  return children;
}
