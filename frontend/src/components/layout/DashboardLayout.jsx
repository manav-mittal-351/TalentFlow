// ─── components/layout/DashboardLayout.jsx ────────────────────────────────────
// Structural Layout wrapper applying dynamic ProtectedRoute gatechecks to AppShell content.

import { ProtectedRoute } from '../common/ProtectedRoute.jsx';
import { AppShell } from './AppShell.jsx';
import { useRouteMeta } from '../../hooks/useRouteMeta.js';

export function DashboardLayout() {
  const meta = useRouteMeta();

  return (
    <ProtectedRoute allowedRoles={meta?.roles ?? []}>
      <AppShell />
    </ProtectedRoute>
  );
}
