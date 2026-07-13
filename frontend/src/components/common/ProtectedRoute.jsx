// ─── components/common/ProtectedRoute.jsx ───────────────────────────────────
// Role-based auth protection routing gate. Resolves current session context
// and handles redirections for unauthorized page accesses.

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { PageSkeleton } from './PageSkeleton.jsx';
import { ROUTES } from '../../constants/routes.js';

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

  // 3. Gate authenticated users with wrong roles
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  // 4. Resolve children
  return children;
}
