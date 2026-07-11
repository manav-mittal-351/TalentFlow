// ─── middleware/authorizeRoles.js ─────────────────────────────────────────────
// Role-based access control middleware.
// Must be used AFTER verifyToken (req.user must already be set).
// Doc reference: Document 5 — API Design (Authorization Middleware layer)
//                Document 5 — Error code: FORBIDDEN_ROLE (403)
//
// Usage:
//   router.post('/jobs', verifyToken, authorizeRoles('recruiter'), jobController.create);
//   router.get('/dashboard/recruiter', verifyToken, authorizeRoles('recruiter'), dashController.recruiter);
//   router.post('/feedback', verifyToken, authorizeRoles('hiring_manager'), feedbackController.create);
//
// Multiple roles allowed:
//   router.get('/applications/:id', verifyToken, authorizeRoles('recruiter', 'hiring_manager'), ...);

import { error } from '../utils/apiResponse.js';

/**
 * Returns a middleware function that allows only the specified roles.
 *
 * @param {...string} roles - One or more of: 'recruiter', 'hiring_manager', 'candidate'
 * @returns {import('express').RequestHandler}
 */
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // req.user is set by verifyToken — if missing, verifyToken was skipped (config error)
    if (!req.user || !roles.includes(req.user.role)) {
      return error(
        res,
        'You do not have permission to access this resource',
        'FORBIDDEN_ROLE',
        403
      );
    }
    next();
  };
};
