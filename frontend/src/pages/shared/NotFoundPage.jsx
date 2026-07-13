// ─── pages/shared/NotFoundPage.jsx ───────────────────────────────────────────
// Custom 404 Page Not Found screen.

import { Link } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';
import { ROUTES } from '../../constants/routes.js';

export default function NotFoundPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6 shadow-sm">
        <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight mb-2">
        404 — Page Not Found
      </h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8 text-sm md:text-base">
        The destination directory or link does not exist or may have shifted location.
      </p>
      <Link
        to={ROUTES.HOME}
        className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all focus-ring hover:scale-[1.02]"
      >
        <Home className="w-4 h-4" />
        <span>Return Home</span>
      </Link>
    </div>
  );
}
