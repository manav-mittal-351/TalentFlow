// ─── components/layout/AppShell.jsx ──────────────────────────────────────────
// Responsive Layout Shell wrapping navigation columns and main view grids.
// Features layout animations and isolated error boundaries.

import { useState, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sidebar } from './Sidebar.jsx';
import { Navbar } from './Navbar.jsx';
import { ErrorBoundary } from '../common/ErrorBoundary.jsx';
import { ScrollRestoration } from './ScrollRestoration.jsx';

export function AppShell() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { pathname } = useLocation();

  const handleToggleSidebar = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  const handleMobileOpen = useCallback(() => {
    setIsMobileOpen(true);
  }, []);

  const handleMobileClose = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-200 overflow-x-hidden max-w-full">
      <ScrollRestoration />

      {/* 1. Sidebar Nav Panels */}
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onMobileClose={handleMobileClose}
      />

      {/* 2. Main content container section shifted right of fixed sidebar on desktop */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 min-w-0 max-w-full overflow-x-hidden ${
          isCollapsed ? 'ml-0 lg:ml-[68px]' : 'ml-0 lg:ml-[240px]'
        }`}
      >
        {/* Header navigation bar */}
        <Navbar
          onMobileOpen={handleMobileOpen}
          isSidebarCollapsed={isCollapsed}
          onToggleSidebar={handleToggleSidebar}
        />

        {/* Dynamic Outlet */}
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex-1 flex flex-col min-w-0 max-w-full"
        >
          {/* Isolate viewport crashes within independent pages */}
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </motion.main>
      </div>
    </div>
  );
}
