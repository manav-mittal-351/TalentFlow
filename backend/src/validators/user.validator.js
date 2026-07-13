// ─── validators/user.validator.js ─────────────────────────────────────────────
// express-validator arrays for candidate profile and saved jobs.
// Doc reference: Document 5 — API Design §9 (User / Profile Routes)
//                Document 4 — Database Schema §1 (users fields & regexes)

import { body, query, param } from 'express-validator';

// ─── PUT /users/profile — Candidate ───────────────────────────────────────────
export const updateProfileValidator = [
  body('headline')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('Headline cannot exceed 150 characters'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Bio cannot exceed 1000 characters'),

  body('phone')
    .optional()
    .trim()
    .matches(/^\+?[0-9\s\-().]{7,20}$/)
    .withMessage('Please enter a valid phone number'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters'),

  body('portfolioUrl')
    .optional()
    .trim()
    .matches(/^(https?:\/\/).+/)
    .withMessage('Portfolio URL must start with http:// or https://'),

  body('githubUrl')
    .optional()
    .trim()
    .matches(/^(https?:\/\/(www\.)?github\.com\/).+/)
    .withMessage('Must be a valid GitHub URL (github.com/...)'),

  body('linkedinUrl')
    .optional()
    .trim()
    .matches(/^(https?:\/\/(www\.)?linkedin\.com\/).+/)
    .withMessage('Must be a valid LinkedIn URL (linkedin.com/...)'),
];

// ─── GET /users/saved-jobs — Candidate (query validation) ──────────────────────
export const getSavedJobsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
];

// ─── POST/DELETE /users/saved-jobs/:jobId ──────────────────────────────────────
export const savedJobParamValidator = [
  param('jobId')
    .isMongoId().withMessage('Invalid job ID format'),
];
