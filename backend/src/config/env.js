// ─── config/env.js ────────────────────────────────────────────────────────────
// Validates all required environment variables at application startup.
// If any required var is missing or malformed, the app refuses to start.
// This prevents the classic "works locally, broken in prod" env var bug.
// Doc reference: Document 7 — Tech Stack (envalid pattern)

import { cleanEnv, str, num } from 'envalid';

// Normalize MONGODB_URI and MONGO_URI
if (!process.env.MONGODB_URI && process.env.MONGO_URI) {
  process.env.MONGODB_URI = process.env.MONGO_URI;
} else if (!process.env.MONGO_URI && process.env.MONGODB_URI) {
  process.env.MONGO_URI = process.env.MONGODB_URI;
}

export const env = cleanEnv(process.env, {
  PORT:           num({ default: 5000, desc: 'Port the HTTP server listens on' }),
  MONGODB_URI:    str({ default: process.env.MONGO_URI || '', desc: 'MongoDB connection string' }),
  MONGO_URI:      str({ default: process.env.MONGODB_URI || '', desc: 'MongoDB connection string fallback' }),
  JWT_SECRET:     str({ desc: 'Secret used to sign JWTs — keep this long and random' }),
  JWT_EXPIRES_IN: str({ default: '7d', desc: 'JWT expiry duration (e.g. 7d, 24h)' }),
  CLIENT_URL:     str({ default: 'http://localhost:5173', desc: 'Frontend origin(s) for CORS whitelist' }),
  NODE_ENV:       str({ choices: ['development', 'production', 'test'], default: 'development' }),
});
