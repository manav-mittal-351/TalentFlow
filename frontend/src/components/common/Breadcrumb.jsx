// ─── components/common/Breadcrumb.jsx ─────────────────────────────────────────
// Dynamic breadcrumb navigator driven automatically from route metadata.
// Supports segment overrides for parameterised routes.
// Document reference: Document 10 — Route Structure §6

import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useRouteMeta } from '../../hooks/useRouteMeta.js';
import { ROUTES } from '../../constants/routes.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

export function Breadcrumb({ overrides = {} }) {
  const { user } = useAuth();
  const meta = useRouteMeta();
  const rawSegments = meta?.breadcrumb || [];

  if (rawSegments.length === 0) return null;

  const getDashboardPath = () => {
    if (!user) return ROUTES.HOME;
    if (user.role === 'recruiter') return ROUTES.RECRUITER.DASHBOARD;
    if (user.role === 'hiring_manager') return ROUTES.HM.DASHBOARD;
    return ROUTES.CANDIDATE.DASHBOARD;
  };

  const resolveSegmentPath = (segment) => {
    if (segment === 'Dashboard') return getDashboardPath();
    if (segment === 'Home') return ROUTES.HOME;
    if (segment === 'Jobs') {
      if (user?.role === 'recruiter') return ROUTES.RECRUITER.JOBS;
      if (user?.role === 'hiring_manager') return ROUTES.HM.JOBS;
      return ROUTES.JOBS;
    }
    if (segment === 'Applications') {
      return ROUTES.CANDIDATE.APPLICATIONS;
    }
    if (segment === 'Notifications') {
      if (user?.role === 'recruiter') return ROUTES.RECRUITER.NOTIFICATIONS;
      if (user?.role === 'hiring_manager') return ROUTES.HM.NOTIFICATIONS;
      return ROUTES.CANDIDATE.NOTIFICATIONS;
    }
    return '#';
  };

  const resolveLabel = (segment) => {
    if (segment.startsWith(':')) {
      return overrides[segment] || segment.replace(':', '').replace(/([A-Z])/g, ' $1').trim();
    }
    return segment;
  };

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1.5 md:space-x-2 text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">
        {rawSegments.map((segment, index) => {
          const isFirst = index === 0;
          const isLast = index === rawSegments.length - 1;
          const path = resolveSegmentPath(segment);
          const label = resolveLabel(segment);

          return (
            <li key={index} className="inline-flex items-center">
              {!isFirst && (
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 mx-1 shrink-0" aria-hidden="true" />
              )}
              {isLast || path === '#' ? (
                <span
                  className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[140px] sm:max-w-xs inline-flex items-center"
                  aria-current="page"
                >
                  {isFirst && (segment === 'Dashboard' || segment === 'Home') && (
                    <Home className="w-3.5 h-3.5 shrink-0 mr-1.5 text-slate-500" />
                  )}
                  {label}
                </span>
              ) : (
                <Link
                  to={path}
                  className="inline-flex items-center hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus-ring rounded"
                >
                  {isFirst && (segment === 'Dashboard' || segment === 'Home') && (
                    <Home className="w-3.5 h-3.5 shrink-0 mr-1.5 text-slate-400" />
                  )}
                  <span>{label}</span>
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
