// ─── components/layout/Navbar.jsx ────────────────────────────────────────────
// Sticky header navbar providing breadcrumbs, command search trigger,
// theme toggling, and user menu triggers. Responsive viewport layouts.

import { useState, useEffect } from 'react';
import { Menu, Search, Bell } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle.jsx';
import { UserMenu } from './UserMenu.jsx';
import { Breadcrumb } from '../common/Breadcrumb.jsx';
import { CommandPalette } from './CommandPalette.jsx';
import { useRouteMeta } from '../../hooks/useRouteMeta.js';
import { useNotifications } from '../../contexts/NotificationContext.jsx';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

export function Navbar({ onMobileOpen }) {
  const { user } = useAuth();
  const meta = useRouteMeta();
  const { unreadCount } = useNotifications();
  const [isCommandOpen, setIsCommandOpen] = useState(false);

  // Sync document title with current page title metadata
  useEffect(() => {
    if (meta?.title) {
      document.title = `${meta.title} — TalentFlow`;
    }
  }, [meta?.title]);

  // Open CommandPalette on Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getNotificationLink = () => {
    if (!user) return '#';
    if (user.role === 'recruiter') return ROUTES.RECRUITER.NOTIFICATIONS;
    if (user.role === 'hiring_manager') return ROUTES.HM.NOTIFICATIONS;
    return ROUTES.CANDIDATE.NOTIFICATIONS;
  };

  return (
    <>
      <header className="sticky top-0 z-10 w-full h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors duration-200">
        <div className="h-full px-4 flex items-center justify-between gap-4 max-w-7xl mx-auto">
          {/* 1. Left Section: Menu trigger and Page Header/Breadcrumb */}
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              onClick={onMobileOpen}
              className="lg:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 focus-ring"
              aria-label="Open navigation menu"
              type="button"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb navigator */}
            <div className="hidden sm:block">
              <Breadcrumb />
            </div>
            {/* Dynamic page title fallback for mobile */}
            <div className="sm:hidden font-semibold text-slate-950 dark:text-slate-50 text-sm truncate">
              {meta?.title}
            </div>
          </div>

          {/* 2. Middle Section: Search Bar Trigger (Ctrl+K) */}
          <div className="flex-1 max-w-md mx-auto hidden md:block">
            <button
              onClick={() => setIsCommandOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-500 dark:hover:text-slate-400 transition-all text-sm focus-ring"
              aria-label="Search jobs, candidates and pages"
              type="button"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 shrink-0" />
                <span>Search dashboard...</span>
              </div>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-sans text-[10px] font-medium text-slate-400 uppercase">
                <span className="text-[9px]">Ctrl</span>K
              </kbd>
            </button>
          </div>

          {/* 3. Right Section: Theme Toggle, Notifications, User Menu */}
          <div className="flex items-center gap-2">
            {/* Mobile search button */}
            <button
              onClick={() => setIsCommandOpen(true)}
              className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 focus-ring"
              aria-label="Search database"
              type="button"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Theme Toggle selector */}
            <ThemeToggle />

            {/* In-app Notification Alert panel */}
            {user && (
              <Link
                to={getNotificationLink()}
                className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors focus-ring"
                aria-label={`${unreadCount} unread notifications`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                  </span>
                )}
              </Link>
            )}

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

            {/* User credentials menu dropdown */}
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Ctrl+K Search Dialog Overlay */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
    </>
  );
}
