// ─── middleware/validate.js ───────────────────────────────────────────────────
// Collects express-validator errors and returns a 400 response if any exist.
// Placed after validator arrays in route definitions, before the controller.
// Doc reference: Document 5 — API Design §3 (Request Validation)
//
// Usage:
//   router.post('/register', registerValidator, validate, authController.register);

import { validationResult } from 'express-validator';

/**
 * Middleware: collects express-validator errors.
 * If any exist → 400 VALIDATION_ERROR.
 * If none → calls next() and the controller executes.
 */
export const validate = (req, res, next) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errorCode: 'VALIDATION_ERROR',
      errors: result.array().map((e) => ({
        field:   e.path,
        message: e.msg,
      })),
    });
  }

  next();
};
