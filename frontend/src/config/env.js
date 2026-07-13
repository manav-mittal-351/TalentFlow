// ─── config/env.js ────────────────────────────────────────────────────────────
// Centralized config layer validating and exposing environment variables.
// This prevents direct reads of import.meta.env throughout the components tree.

export const env = {
  API_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1',
};

// Freeze configuration to prevent mutation at runtime
Object.freeze(env);
