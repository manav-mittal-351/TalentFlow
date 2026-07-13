// ─── validators/interview.validator.js ────────────────────────────────────────
// express-validator rules for all interview endpoints.
// Doc reference: Document 5 — API Design §13 (Interview Routes)
//                Document 4 — Database Schema §5 (interview field constraints)

import { body, query } from 'express-validator';
import { INTERVIEW_FORMATS, INTERVIEW_STATUSES } from '../utils/constants.js';

// Statuses a Recruiter can set via PATCH /:id/status
// 'scheduled' is the default — recruiter transitions to 'completed' or 'cancelled'
const RECRUITER_SETTABLE_STATUSES = ['completed', 'cancelled'];

// ─── POST /interviews — Recruiter create ──────────────────────────────────────
export const createInterviewValidator = [
  body('applicationId')
    .notEmpty().withMessage('applicationId is required')
    .isMongoId().withMessage('applicationId must be a valid ObjectId'),

  body('scheduledAt')
    .notEmpty().withMessage('scheduledAt is required')
    .isISO8601().withMessage('scheduledAt must be a valid ISO 8601 date'),

  body('format')
    .notEmpty().withMessage('format is required')
    .isIn(INTERVIEW_FORMATS)
    .withMessage(`format must be one of: ${INTERVIEW_FORMATS.join(', ')}`),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('location cannot exceed 300 characters'),

  body('candidateInstructions')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('candidateInstructions cannot exceed 1000 characters'),

  body('interviewerId')
    .optional({ nullable: true })
    .isMongoId().withMessage('interviewerId must be a valid ObjectId'),
];

// ─── PATCH /interviews/:id — Recruiter partial update ─────────────────────────
export const updateInterviewValidator = [
  body('scheduledAt')
    .optional()
    .isISO8601().withMessage('scheduledAt must be a valid ISO 8601 date'),

  body('format')
    .optional()
    .isIn(INTERVIEW_FORMATS)
    .withMessage(`format must be one of: ${INTERVIEW_FORMATS.join(', ')}`),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('location cannot exceed 300 characters'),

  body('candidateInstructions')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('candidateInstructions cannot exceed 1000 characters'),

  body('interviewerId')
    .optional({ nullable: true })
    .isMongoId().withMessage('interviewerId must be a valid ObjectId'),
];

// ─── PATCH /interviews/:id/status — Recruiter status update ───────────────────
export const updateInterviewStatusValidator = [
  body('status')
    .notEmpty().withMessage('status is required')
    .isIn(RECRUITER_SETTABLE_STATUSES)
    .withMessage(`status must be one of: ${RECRUITER_SETTABLE_STATUSES.join(', ')}`),

  body('cancelledReason')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('cancelledReason cannot exceed 500 characters'),
];

// ─── GET /interviews — Recruiter list ─────────────────────────────────────────
export const getInterviewsValidator = [
  query('status')
    .optional()
    .isIn(INTERVIEW_STATUSES)
    .withMessage(`status must be one of: ${INTERVIEW_STATUSES.join(', ')}`),

  query('sortBy')
    .optional()
    .isIn(['upcoming', 'latest'])
    .withMessage('sortBy must be upcoming or latest'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50'),
];
