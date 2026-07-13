// ─── lib/queryClient.js ───────────────────────────────────────────────────────
// Configures and exports the central TanStack Query Client for managing server state.
// Uses custom defaults designed to prevent redundant network calls in development.

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5,          // 5 minutes caching window before data is stale
      refetchOnWindowFocus: false,       // prevents refetching when user toggles tabs
    },
  },
});
