// ─── components/common/Breadcrumb.jsx ─────────────────────────────────────────
// Dynamic breadcrumb navigator driven automatically from route metadata.
// Supports segment overrides for parameterised routes.
// Document reference: Document 10 — Route Structure §6

import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { useRouteMeta } from '../../hooks/useRouteMeta.js';
import { ROUTES } from '../../constants/routes.js';

export function Breadcrumb({ overrides = {} }) {
  const meta = useRouteMeta();
  const segments = meta?.breadcrumb || [];

  if (segments.length === 0) return null;

  // Resolves the link for historic steps inside the breadcrumb trail.
  const resolveSegmentPath = (index) => {
    // Basic heuristics:
    if (index === 0) return ROUTES.HOME;
    if (segments[index] === 'Jobs') return ROUTES.JOBS;
    return '#';
  };

  const resolveLabel = (segment) => {
    // If the segment starts with a colon (e.g. :jobTitle), check if an override is provided
    if (segment.startsWith(':')) {
      return overrides[segment] || segment.replace(':', '').replace(/([A-Z])/g, ' $1').trim();
    }
    return segment;
  };

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1.5 md:space-x-2.5 text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400">
        <li className="inline-flex items-center">
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center gap-1.5 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus-ring rounded"
            aria-label="Home page"
          >
            <Home className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </li>

        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const path = resolveSegmentPath(index);
          const label = resolveLabel(segment);

          return (
            <li key={index} className="inline-flex items-center">
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 mx-1 shrink-0" aria-hidden="true" />
              {isLast || path === '#' ? (
                <span
                  className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[120px] sm:max-w-xs"
                  aria-current="page"
                >
                  {label}
                </span>
              ) : (
                <Link
                  to={path}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors focus-ring rounded"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
