// ─── components/layout/AppShell.jsx ──────────────────────────────────────────
// Responsive Layout Shell wrapping navigation columns and main view grids.
// Features layout animations and isolated error boundaries.

import { useState } from 'react';
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

  const handleToggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <ScrollRestoration />

      {/* 1. Sidebar Nav Panels */}
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* 2. Main content container section */}
      <div
        className="flex-1 flex flex-col transition-all duration-300"
        style={{
          paddingLeft: isCollapsed ? '0px' : '0px', // Handled responsively via tailwind ml classes below
        }}
      >
        {/* Header navigation bar */}
        <Navbar
          onMobileOpen={() => setIsMobileOpen(true)}
          isSidebarCollapsed={isCollapsed}
          onToggleSidebar={handleToggleSidebar}
        />

        {/* Dynamic Outlet with responsive offsets: left margin on large screens */}
        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="flex-1 flex flex-col lg:transition-all lg:duration-300 ml-0 lg:ml-[240px]"
          style={{
            marginLeft: isCollapsed ? '68px' : undefined,
          }}
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
