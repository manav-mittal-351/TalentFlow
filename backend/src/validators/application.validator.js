// ─── validators/application.validator.js ──────────────────────────────────────
// express-validator rules for all application endpoints.
// Doc reference: Document 5 — API Design §12 (Application Routes)
//                Document 4 — Database Schema §4 (application field constraints)

import { body, query, param } from 'express-validator';
import { APPLICATION_STATUSES } from '../utils/constants.js';

// Statuses a Recruiter can set (cannot set 'applied', 'withdrawn' from this endpoint)
const RECRUITER_SETTABLE_STATUSES = [
  'under_review', 'shortlisted', 'interview', 'offer', 'hired', 'rejected',
];

// ─── POST /applications/:jobId — Candidate apply ──────────────────────────────
export const applyValidator = [
  body('coverNote')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Cover note cannot exceed 2000 characters'),
  // resumeUrl comes from multer or candidate profile — not validated in body
];

// ─── PATCH /applications/:id/status — Recruiter ───────────────────────────────
export const updateStatusValidator = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(RECRUITER_SETTABLE_STATUSES)
    .withMessage(`Status must be one of: ${RECRUITER_SETTABLE_STATUSES.join(', ')}`),
];

// ─── PATCH /applications/:id/notes — Recruiter ────────────────────────────────
export const updateNotesValidator = [
  body('recruiterNotes')
    .notEmpty().withMessage('recruiterNotes is required')
    .trim()
    .isLength({ max: 3000 }).withMessage('Recruiter notes cannot exceed 3000 characters'),
];

// ─── GET /applications/my — Candidate ─────────────────────────────────────────
export const getMyApplicationsValidator = [
  query('status')
    .optional()
    .isIn(APPLICATION_STATUSES)
    .withMessage(`Status must be one of: ${APPLICATION_STATUSES.join(', ')}`),

  query('sortBy')
    .optional()
    .isIn(['latest', 'oldest'])
    .withMessage('sortBy must be latest or oldest'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50'),
];

// ─── GET /applications/job/:jobId — Recruiter ─────────────────────────────────
export const getJobApplicationsValidator = [
  query('status')
    .optional()
    .isIn(APPLICATION_STATUSES)
    .withMessage(`Status must be one of: ${APPLICATION_STATUSES.join(', ')}`),

  query('sortBy')
    .optional()
    .isIn(['latest', 'oldest', 'status'])
    .withMessage('sortBy must be latest, oldest, or status'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50'),
];
