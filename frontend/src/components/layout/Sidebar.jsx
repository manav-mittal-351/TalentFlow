// ─── components/layout/Sidebar.jsx ───────────────────────────────────────────
// Responsive and animated navigation sidebar with role-filtered links.
// Incorporates NavLink components and accessibility standards.

import { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { ROUTE_META } from '../../constants/routeMeta.js';
import { cn } from '../../utils/cn.js';
import { LogOut, X } from 'lucide-react';

export function Sidebar({ isCollapsed, isMobileOpen, onMobileClose }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const sidebarRef = useRef(null);

  // Close mobile drawer on route changes
  useEffect(() => {
    onMobileClose();
  }, [pathname, onMobileClose]);

  // Close mobile drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMobileOpen) {
        onMobileClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onMobileClose]);

  if (!user) return null;

  // Filter routes to display in Sidebar based on user role and showInSidebar flag
  const navItems = Object.entries(ROUTE_META)
    .filter(([, meta]) => meta.roles.includes(user.role) && meta.showInSidebar)
    .map(([path, meta]) => ({
      path,
      title: meta.title,
      icon: meta.icon,
    }));

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
      {/* 1. Brand Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-200 dark:shadow-none shrink-0">
            T
          </div>
          {(!isCollapsed || isMobileOpen) && (
            <span className="font-bold text-lg bg-gradient-to-r from-slate-900 to-indigo-700 dark:from-slate-100 dark:to-indigo-400 bg-clip-text text-transparent">
              TalentFlow
            </span>
          )}
        </div>

        {/* Mobile close button */}
        {isMobileOpen && (
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 focus-ring lg:hidden"
            aria-label="Close menu"
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* 2. Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 focus-ring group',
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                )
              }
              aria-label={item.title}
            >
              {({ isActive }) => (
                <>
                  {Icon && (
                    <Icon
                      className={cn(
                        'w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-105',
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                      )}
                    />
                  )}
                  {(!isCollapsed || isMobileOpen) && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.15 }}
                    >
                      {item.title}
                    </motion.span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* 3. Sidebar Footer */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-400 transition-colors focus-ring"
          aria-label="Log Out"
          type="button"
        >
          <LogOut className="w-5 h-5 text-slate-400 group-hover:text-rose-600 shrink-0" />
          {(!isCollapsed || isMobileOpen) && <span>Log Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (visible on screens >= 1024px) */}
      <motion.aside
        ref={sidebarRef}
        className="hidden lg:block fixed left-0 top-0 bottom-0 z-20 h-full shrink-0 overflow-hidden"
        animate={{ width: isCollapsed ? 68 : 240 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      >
        <div className="h-full w-full">{sidebarContent}</div>
      </motion.aside>

      {/* Mobile Drawer (visible on screens < 1024px) */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Dark Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={onMobileClose}
              className="fixed inset-0 bg-black z-30 lg:hidden"
              aria-hidden="true"
            />

            {/* Slide-out Drawer Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed top-0 bottom-0 left-0 w-72 z-40 h-full shadow-2xl lg:hidden"
              role="navigation"
              aria-label="Mobile Navigation"
            >
              <div className="h-full w-full">{sidebarContent}</div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
