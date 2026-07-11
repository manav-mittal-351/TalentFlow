// ─── routes/auth.routes.js ────────────────────────────────────────────────────
// Auth route definitions — 3 endpoints as documented.
// Doc reference: Document 5 — API Design §8 (Auth Routes)
//
// Request pipeline per route:
//   validator array → validate → [verifyToken] → controller

import { Router } from 'express';
import { register, login, me } from '../controllers/auth.controller.js';
import { registerValidator, loginValidator } from '../validators/auth.validator.js';
import { validate }      from '../middleware/validate.js';
import { verifyToken }   from '../middleware/verifyToken.js';

const router = Router();

// POST /api/v1/auth/register — Public (rate-limited in app.js)
router.post('/register', registerValidator, validate, register);

// POST /api/v1/auth/login   — Public (rate-limited in app.js)
router.post('/login', loginValidator, validate, login);

// GET  /api/v1/auth/me      — All authenticated roles
router.get('/me', verifyToken, me);

export default router;
