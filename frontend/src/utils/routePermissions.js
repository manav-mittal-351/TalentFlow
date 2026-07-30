// ─── utils/routePermissions.js ───────────────────────────────────────────────
// Utility functions for resolving role-scoped dashboard destinations and validating route permissions.

import { matchPath } from 'react-router-dom';
import { ROUTE_META } from '../constants/routeMeta.js';
import { ROUTES } from '../constants/routes.js';
import { ROLES } from '../constants/roles.js';

export function getRoleDashboard(role) {
  switch (role) {
    case ROLES.RECRUITER:
      return ROUTES.RECRUITER.DASHBOARD;
    case ROLES.HIRING_MANAGER:
      return ROUTES.HM.DASHBOARD;
    case ROLES.CANDIDATE:
    default:
      return ROUTES.CANDIDATE.DASHBOARD;
  }
}

export function isPathAllowedForRole(pathname, role) {
  if (
    !pathname ||
    pathname === ROUTES.LOGIN ||
    pathname === ROUTES.REGISTER ||
    pathname === ROUTES.UNAUTHORIZED
  ) {
    return false;
  }

  // 1. Try exact match in ROUTE_META
  if (ROUTE_META[pathname]) {
    const roles = ROUTE_META[pathname].roles || [];
    return roles.length === 0 || roles.includes(role);
  }

  // 2. Try pattern match for parameterized routes
  for (const [pattern, meta] of Object.entries(ROUTE_META)) {
    const match = matchPath({ path: pattern, end: true }, pathname);
    if (match) {
      const roles = meta.roles || [];
      return roles.length === 0 || roles.includes(role);
    }
  }

  // 3. Fallback prefix check
  if (pathname.startsWith('/recruiter') && role !== ROLES.RECRUITER) return false;
  if (pathname.startsWith('/hiring-manager') && role !== ROLES.HIRING_MANAGER) return false;
  if (pathname.startsWith('/candidate') && role !== ROLES.CANDIDATE) return false;

  return true;
}
