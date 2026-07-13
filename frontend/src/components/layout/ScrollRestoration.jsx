// ─── components/layout/ScrollRestoration.jsx ──────────────────────────────────
// Automatically resets browser scroll positions to top on route transitions.

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function ScrollRestoration() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll content container to top.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
