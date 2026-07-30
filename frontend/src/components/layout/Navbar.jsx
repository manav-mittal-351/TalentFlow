// ─── components/layout/Navbar.jsx ────────────────────────────────────────────
// Sticky header navbar providing breadcrumbs, command search trigger,
// theme toggling, and user menu triggers. Responsive viewport layouts.

import { useState, useEffect } from 'react';
import { Menu, Search, Bell, CheckCheck, ArrowRight, PanelLeft } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle.jsx';
import { UserMenu } from './UserMenu.jsx';
import { Breadcrumb } from '../common/Breadcrumb.jsx';
import { CommandPalette } from './CommandPalette.jsx';
import { useRouteMeta } from '../../hooks/useRouteMeta.js';
import { useNotifications } from '../../contexts/NotificationContext.jsx';
import { Link, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { formatDistanceToNow } from 'date-fns';
import { getNotificationTargetUrl } from '../../utils/notificationRoute.js';

export function Navbar({ onMobileOpen, isSidebarCollapsed, onToggleSidebar }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const meta = useRouteMeta();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

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

  const handleNotifClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif._id);
    }
    setIsNotifOpen(false);
    const targetUrl = getNotificationTargetUrl(notif, user?.role || 'candidate');
    navigate(targetUrl);
  };

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch (e) {
      return '';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors duration-200">
        <div className="h-full px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-4 max-w-7xl mx-auto">
          {/* 1. Left Section: Menu trigger and Page Header/Breadcrumb */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial">
            {/* Mobile menu trigger */}
            <button
              onClick={onMobileOpen}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 focus-ring transition-colors shrink-0"
              aria-label="Open navigation menu"
              type="button"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Desktop sidebar toggle trigger */}
            {onToggleSidebar && (
              <button
                onClick={onToggleSidebar}
                className="hidden lg:flex w-9 h-9 items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 focus-ring transition-colors shrink-0"
                aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                type="button"
              >
                <PanelLeft className="w-5 h-5" />
              </button>
            )}

            {/* Breadcrumb navigator */}
            <div className="hidden sm:block">
              <Breadcrumb />
            </div>
            {/* Dynamic page title fallback for mobile */}
            <div className="sm:hidden font-extrabold text-slate-900 dark:text-slate-100 text-xs sm:text-sm truncate max-w-[110px]">
              {meta?.title}
            </div>
          </div>

          {/* 2. Middle Section: Search Bar Trigger (Ctrl+K) */}
          <div className="flex-1 max-w-md mx-4 hidden md:block">
            <button
              onClick={() => setIsCommandOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:text-slate-600 dark:hover:text-slate-300 transition-all text-xs font-medium focus-ring shadow-2xs"
              aria-label="Search jobs, candidates and pages"
              type="button"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 shrink-0 text-slate-400" />
                <span>Search dashboard...</span>
              </div>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-sans text-[10px] font-semibold text-slate-400 uppercase">
                <span className="text-[9px]">Ctrl</span>K
              </kbd>
            </button>
          </div>

          {/* 3. Right Section: Theme Toggle, Notifications, User Menu */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Mobile search button */}
            <button
              onClick={() => setIsCommandOpen(true)}
              className="md:hidden w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 focus-ring transition-colors shrink-0"
              aria-label="Search database"
              type="button"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Theme Toggle selector */}
            <ThemeToggle />

            {/* In-app Notification Alert panel */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setIsNotifOpen((prev) => !prev)}
                  className="relative w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors focus-ring"
                  aria-label={`${unreadCount} unread notifications`}
                  type="button"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                    </span>
                  )}
                </button>

                {/* Dropdown Popover */}
                {isNotifOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsNotifOpen(false)} />
                    <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:right-0 sm:mt-2.5 w-auto sm:w-96 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl z-50 overflow-hidden flex flex-col text-left text-xs animate-in fade-in slide-in-from-top-2 duration-150 max-h-[80vh]">
                      
                      {/* Header */}
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/40">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 dark:text-slate-50">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={() => markAllAsRead()}
                            className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                            type="button"
                          >
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Mark all read</span>
                          </button>
                        )}
                      </div>

                      {/* List */}
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                        {notifications.length === 0 ? (
                          <div className="py-8 px-4 text-center space-y-1">
                            <p className="font-bold text-slate-700 dark:text-slate-300">No notifications yet</p>
                            <p className="text-[11px] text-slate-400">Updates will appear here as activity occurs.</p>
                          </div>
                        ) : (
                          notifications.slice(0, 5).map((n) => (
                            <div
                              key={n._id}
                              onClick={() => handleNotifClick(n)}
                              className={`p-3.5 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-850/60 cursor-pointer transition-colors ${
                                !n.isRead ? 'bg-indigo-50/20 dark:bg-indigo-950/20' : ''
                              }`}
                            >
                              <div className="flex-1 min-w-0 space-y-0.5">
                                {n.title && (
                                  <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                    {n.title}
                                  </p>
                                )}
                                <p className={`text-slate-600 dark:text-slate-300 line-clamp-2 ${!n.title && !n.isRead ? 'font-bold text-slate-900 dark:text-slate-100' : ''}`}>
                                  {n.message}
                                </p>
                                <p className="text-[10px] text-slate-400 font-medium pt-0.5">
                                  {getRelativeTime(n.createdAt)}
                                </p>
                              </div>
                              {!n.isRead && (
                                <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 mt-1" />
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Footer */}
                      <div className="p-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-center">
                        <Link
                          to={getNotificationLink()}
                          onClick={() => setIsNotifOpen(false)}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline py-1 px-2"
                        >
                          <span>Go to Notification Center</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                    </div>
                  </>
                )}
              </div>
            )}

            <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block" />

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
