// ─── validators/auth.validator.js ────────────────────────────────────────────
// express-validator rule arrays for auth endpoints.
// Doc reference: Document 5 — API Design §3 (Request Validation pattern)
//                Document 4 — Database Schema §1 (users field constraints)
//
// These arrays are spread into route definitions:
//   router.post('/register', registerValidator, validate, authController.register);
//   router.post('/login',    loginValidator,    validate, authController.login);

import { body } from 'express-validator';
import { ROLE_VALUES } from '../utils/constants.js';

// ─── POST /auth/register ──────────────────────────────────────────────────────
export const registerValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(), // lowercases + trims — matches schema lowercase:true

  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),

  // Role is optional — defaults to 'candidate' in the service layer.
  // Allowing all three roles at registration supports the portfolio demo
  // where testers need to register as recruiters and hiring managers too.
  body('role')
    .optional()
    .isIn(ROLE_VALUES)
    .withMessage(`Role must be one of: ${ROLE_VALUES.join(', ')}`),
];

// ─── POST /auth/login ─────────────────────────────────────────────────────────
export const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];
