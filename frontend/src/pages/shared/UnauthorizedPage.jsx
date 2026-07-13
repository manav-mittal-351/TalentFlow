// ─── pages/shared/UnauthorizedPage.jsx ───────────────────────────────────────
// Custom 403 Access Unauthorized warning screen.

import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { ROUTES } from '../../constants/routes.js';

export default function UnauthorizedPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-6 shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight mb-2">
        403 — Access Denied
      </h1>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 text-sm md:text-base">
        You do not hold correct role permissions to view this internal workspace section.
      </p>
      <Link
        to={ROUTES.HOME}
        className="inline-flex items-center gap-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 font-semibold px-5 py-2.5 rounded-xl shadow-md transition-all focus-ring hover:scale-[1.02]"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Go Back</span>
      </Link>
    </div>
  );
}
