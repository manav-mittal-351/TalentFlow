// ─── config/env.js ────────────────────────────────────────────────────────────
// Validates all required environment variables at application startup.
// If any required var is missing or malformed, the app refuses to start.
// This prevents the classic "works locally, broken in prod" env var bug.
// Doc reference: Document 7 — Tech Stack (envalid pattern)

import { cleanEnv, str, num, url } from 'envalid';

export const env = cleanEnv(process.env, {
  PORT:           num({ default: 5000,           desc: 'Port the HTTP server listens on' }),
  MONGO_URI:      str({                          desc: 'MongoDB connection string' }),
  JWT_SECRET:     str({                          desc: 'Secret used to sign JWTs — keep this long and random' }),
  JWT_EXPIRES_IN: str({ default: '7d',           desc: 'JWT expiry duration (e.g. 7d, 24h)' }),
  CLIENT_URL:     url({                          desc: 'Frontend origin for CORS whitelist' }),
  NODE_ENV:       str({ choices: ['development', 'production', 'test'], default: 'development' }),
});
