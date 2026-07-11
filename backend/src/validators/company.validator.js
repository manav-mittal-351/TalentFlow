// ─── validators/company.validator.js ─────────────────────────────────────────
// express-validator rule arrays for company endpoints.
// Doc reference: Document 5 — API Design §10 (Company Routes)
//                Document 4 — Database Schema §2 (companies field constraints)
//
// Usage:
//   router.post('/',  createCompanyValidator, validate, companyController.create);
//   router.patch('/', updateCompanyValidator,  validate, companyController.update);

import { body } from 'express-validator';

// ─── POST /company — Recruiter ────────────────────────────────────────────────
// Only `name` is required. All other fields are optional on creation.
export const createCompanyValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Company name is required')
    .isLength({ max: 200 })
    .withMessage('Company name cannot exceed 200 characters'),

  body('website')
    .optional({ checkFalsy: true })
    .matches(/^(https?:\/\/).+/)
    .withMessage('Website must start with http:// or https://'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),

  body('industry')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Industry cannot exceed 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),

  body('logoUrl')
    .optional()
    .isString()
    .withMessage('logoUrl must be a string'),
];

// ─── PATCH /company — Recruiter (partial update) ──────────────────────────────
// All fields optional — only provided fields are updated.
// Doc note: "PATCH for partial updates — Never PUT unless replacing the full document"
export const updateCompanyValidator = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Company name cannot be empty')
    .isLength({ max: 200 })
    .withMessage('Company name cannot exceed 200 characters'),

  body('website')
    .optional({ checkFalsy: true })
    .matches(/^(https?:\/\/).+/)
    .withMessage('Website must start with http:// or https://'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),

  body('industry')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Industry cannot exceed 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),

  body('logoUrl')
    .optional()
    .isString()
    .withMessage('logoUrl must be a string'),
];
