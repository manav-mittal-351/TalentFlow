// ─── hooks/useRouteMeta.js ───────────────────────────────────────────────────
// Custom hook resolving active layout metadata based on dynamic path patterns.

import { matchPath, useLocation } from 'react-router-dom';
import { ROUTE_META } from '../constants/routeMeta.js';

export function useRouteMeta() {
  const { pathname } = useLocation();

  // 1. Try exact match first
  if (ROUTE_META[pathname]) {
    return { ...ROUTE_META[pathname], activePattern: pathname, params: {} };
  }

  // 2. Pattern match for parameterized routes
  for (const [pattern, meta] of Object.entries(ROUTE_META)) {
    const match = matchPath({ path: pattern, end: true }, pathname);
    if (match) {
      return {
        ...meta,
        activePattern: pattern,
        params: match.params,
      };
    }
  }

  // Default fallback meta
  return {
    title: 'TalentFlow',
    icon: null,
    roles: [],
    requiresAuth: false,
    layout: 'public',
    showInSidebar: false,
    breadcrumb: [],
    activePattern: null,
    params: {},
  };
}
