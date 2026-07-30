// ─── components/layout/PublicLayout.jsx ───────────────────────────────────────
// Layout wrapper for unauthenticated pages (Landing, Login, Register).
// Integrates SEO title updates and responsive designs.

import { useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useRouteMeta } from '../../hooks/useRouteMeta.js';
import { ThemeToggle } from './ThemeToggle.jsx';
import { ROUTES } from '../../constants/routes.js';
import { ScrollRestoration } from './ScrollRestoration.jsx';
import Logo from '../common/Logo.jsx';


import { useAuth } from '../../contexts/AuthContext.jsx';
import { UserMenu } from './UserMenu.jsx';

export function PublicLayout() {
  const { user } = useAuth();
  const meta = useRouteMeta();

  const getDashboardPath = () => {
    if (!user) return ROUTES.LOGIN;
    if (user.role === 'recruiter') return ROUTES.RECRUITER.DASHBOARD;
    if (user.role === 'hiring_manager') return ROUTES.HM.DASHBOARD;
    return ROUTES.CANDIDATE.DASHBOARD;
  };

  // Set document title and SEO descriptions dynamically for public crawlers
  useEffect(() => {
    if (meta?.meta?.title) {
      document.title = meta.meta.title;
    }

    // Set meta description
    if (meta?.meta?.description) {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', meta.meta.description);
    }

    // Set canonical url
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href);
  }, [meta]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <ScrollRestoration />

      {/* 1. Header */}
      <header className="w-full h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link to={user ? getDashboardPath() : ROUTES.HOME} className="focus-ring rounded-lg">
            <Logo size="md" />
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              to={ROUTES.JOBS}
              className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 focus-ring px-2.5 py-1.5 rounded-lg"
            >
              Careers
            </Link>
            <ThemeToggle />

            {user ? (
              <>
                <Link
                  to={getDashboardPath()}
                  className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl shadow-md transition-all focus-ring hover:scale-[1.02]"
                >
                  Dashboard
                </Link>
                <UserMenu />
              </>
            ) : (
              <>
                <Link
                  to={ROUTES.LOGIN}
                  className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 focus-ring px-2.5 py-1.5 rounded-lg"
                >
                  Sign In
                </Link>
                <Link
                  to={ROUTES.REGISTER}
                  className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl shadow-md transition-all focus-ring hover:scale-[1.02]"
                >
                  Join Us
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* 2. Main Content */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* 3. Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} TalentFlow Platform. All rights reserved.</p>
          <div className="flex gap-4">
            <Link to="#" className="hover:text-indigo-600 focus-ring">Terms</Link>
            <Link to="#" className="hover:text-indigo-600 focus-ring">Privacy Policy</Link>
            <Link to="#" className="hover:text-indigo-600 focus-ring">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
