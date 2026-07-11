// ─── middleware/verifyToken.js ────────────────────────────────────────────────
// JWT verification middleware — runs on all protected routes.
// Decodes the token and attaches { id, role } to req.user.
// Doc reference: Document 5 — API Design (Auth Middleware layer)
//                Document 5 — Error codes: NO_TOKEN, TOKEN_EXPIRED, INVALID_TOKEN
//
// Usage:
//   router.get('/me', verifyToken, authController.me);
//   router.get('/jobs', verifyToken, authorizeRoles('recruiter'), jobController.all);

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { error } from '../utils/apiResponse.js';

/**
 * Verifies the Bearer token in the Authorization header.
 * On success → attaches req.user = { id, role } and calls next().
 * On failure → returns 401 with the appropriate error code.
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check Authorization header exists and follows "Bearer <token>" format
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Authorization token is required', 'NO_TOKEN', 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify signature and expiry. Throws on failure.
    const decoded = jwt.verify(token, env.JWT_SECRET);

    // Attach decoded payload to request — available to all downstream middleware
    // decoded = { id: string, role: string, iat: number, exp: number }
    req.user = {
      id:   decoded.id,
      role: decoded.role,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, 'Your session has expired. Please log in again.', 'TOKEN_EXPIRED', 401);
    }
    // JsonWebTokenError, NotBeforeError, etc.
    return error(res, 'Invalid token. Please log in again.', 'INVALID_TOKEN', 401);
  }
};
