// ─── app.js ───────────────────────────────────────────────────────────────────
// Configures the Express application: global middleware, rate limiting,
// route mounting, 404 handler, and global error handler.
// Does NOT start the server — that is server.js's responsibility.
// Doc reference: Document 5 — API Design §2 (Global Middleware Stack)
//                Document 5 — API Design §2 (Rate Limiting)

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import router from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS ─────────────────────────────────────────────────────────────────────
// Only allows requests from the documented CLIENT_URL (Vite dev server / Vercel).
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true, // allow cookies / Authorization headers cross-origin
  })
);

// ─── Performance ──────────────────────────────────────────────────────────────
app.use(compression()); // Gzip responses

// ─── Request logging ─────────────────────────────────────────────────────────
// Suppress in test environment to keep test output clean
if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Rate limiting — auth routes only ─────────────────────────────────────────
// Applied before route mounting so it wraps the endpoints regardless of
// middleware order inside the router.
// Doc: 10 requests per 15-minute window per IP.
const authLimiter = rateLimit({
  windowMs:       15 * 60 * 1000, // 15 minutes
  max:            10,
  skip(req) {
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      if (req.headers['x-test-rate-limit'] !== 'true') {
        return true;
      }
    }
    return false;
  },
  standardHeaders: true,           // RateLimit-* headers (RFC 6585)
  legacyHeaders:  false,           // suppress X-RateLimit-* headers
  message: {
    success:   false,
    message:   'Too many requests from this IP. Please try again after 15 minutes.',
    errorCode: 'RATE_LIMIT_EXCEEDED',
  },
});

app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/login',    authLimiter);

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api/v1', router);

// ─── Health check ─────────────────────────────────────────────────────────────
// Used by Render health checks and uptime monitors.
app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'TalentFlow API is healthy',
    environment: env.NODE_ENV,
  });
});

// ─── 404 — unmatched routes ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success:   false,
    message:   `Route ${req.method} ${req.originalUrl} not found`,
    errorCode: 'NOT_FOUND',
  });
});

// ─── Global error handler ─────────────────────────────────────────────────────
// MUST be the last middleware registered — Express identifies error handlers
// by their 4-argument signature (err, req, res, next).
app.use(errorHandler);

export default app;
