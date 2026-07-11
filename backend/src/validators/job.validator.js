// ─── validators/job.validator.js ──────────────────────────────────────────────
// express-validator rule arrays for all job endpoints.
// Doc reference: Document 5 — API Design §11 (Job Routes)
//                Document 4 — Database Schema §3 (jobs field constraints)

import { body, query, param } from 'express-validator';
import {
  DEPARTMENTS,
  JOB_TYPES,
  EXPERIENCE_LEVELS,
  JOB_STATUSES,
} from '../utils/constants.js';

// ─── POST /jobs — Recruiter ───────────────────────────────────────────────────
export const createJobValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Job title is required')
    .isLength({ max: 150 }).withMessage('Job title cannot exceed 150 characters'),

  body('department')
    .notEmpty().withMessage('Department is required')
    .isIn(DEPARTMENTS).withMessage(`Department must be one of: ${DEPARTMENTS.join(', ')}`),

  body('location')
    .trim()
    .notEmpty().withMessage('Location is required')
    .isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters'),

  body('jobType')
    .notEmpty().withMessage('Job type is required')
    .isIn(JOB_TYPES).withMessage(`Job type must be one of: ${JOB_TYPES.join(', ')}`),

  body('isRemote')
    .optional()
    .isBoolean().withMessage('isRemote must be true or false'),

  body('experienceLevel')
    .optional()
    .isIn(EXPERIENCE_LEVELS)
    .withMessage(`Experience level must be one of: ${EXPERIENCE_LEVELS.join(', ')}`),

  body('description')
    .trim()
    .notEmpty().withMessage('Job description is required')
    .isLength({ max: 10000 }).withMessage('Description cannot exceed 10,000 characters'),

  body('salaryMin')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Minimum salary must be a non-negative number'),

  body('salaryMax')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Maximum salary must be a non-negative number'),

  // Cross-field salary validation — service layer enforces salaryMax >= salaryMin
  // via the Mongoose pre-save hook (returns SALARY_RANGE_INVALID)

  body('applicationDeadline')
    .optional({ nullable: true })
    .isISO8601().withMessage('Application deadline must be a valid date (ISO 8601)'),
    // Must be a future date — enforced in service layer (Doc 04 §8)

  body('status')
    .optional()
    .isIn(JOB_STATUSES)
    .withMessage(`Status must be one of: ${JOB_STATUSES.join(', ')}`),
];

// ─── PATCH /jobs/:jobId — Recruiter (partial update) ──────────────────────────
// All fields optional — only provided fields are updated.
export const updateJobValidator = [
  body('title')
    .optional()
    .trim()
    .notEmpty().withMessage('Job title cannot be empty')
    .isLength({ max: 150 }).withMessage('Job title cannot exceed 150 characters'),

  body('department')
    .optional()
    .isIn(DEPARTMENTS).withMessage(`Department must be one of: ${DEPARTMENTS.join(', ')}`),

  body('location')
    .optional()
    .trim()
    .notEmpty().withMessage('Location cannot be empty')
    .isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters'),

  body('jobType')
    .optional()
    .isIn(JOB_TYPES).withMessage(`Job type must be one of: ${JOB_TYPES.join(', ')}`),

  body('isRemote')
    .optional()
    .isBoolean().withMessage('isRemote must be true or false'),

  body('experienceLevel')
    .optional()
    .isIn(EXPERIENCE_LEVELS)
    .withMessage(`Experience level must be one of: ${EXPERIENCE_LEVELS.join(', ')}`),

  body('description')
    .optional()
    .trim()
    .notEmpty().withMessage('Description cannot be empty')
    .isLength({ max: 10000 }).withMessage('Description cannot exceed 10,000 characters'),

  body('salaryMin')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Minimum salary must be a non-negative number'),

  body('salaryMax')
    .optional({ nullable: true })
    .isFloat({ min: 0 }).withMessage('Maximum salary must be a non-negative number'),

  body('applicationDeadline')
    .optional({ nullable: true })
    .isISO8601().withMessage('Application deadline must be a valid date (ISO 8601)'),
];

// ─── PATCH /jobs/:jobId/status — Recruiter ────────────────────────────────────
export const updateJobStatusValidator = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(JOB_STATUSES)
    .withMessage(`Status must be one of: ${JOB_STATUSES.join(', ')}`),

  // cancelledReason only applies to interviews — not needed here
  // If status is 'closed' or 'archived', no extra body field is required
];

// ─── Query param validators for GET /jobs ────────────────────────────────────
export const getJobsValidator = [
  query('department')
    .optional()
    .isIn(DEPARTMENTS).withMessage(`Department must be one of: ${DEPARTMENTS.join(', ')}`),

  query('jobType')
    .optional()
    .isIn(JOB_TYPES).withMessage(`jobType must be one of: ${JOB_TYPES.join(', ')}`),

  query('isRemote')
    .optional()
    .isIn(['true', 'false']).withMessage('isRemote must be true or false'),

  query('sortBy')
    .optional()
    .isIn(['newest', 'salary', 'location']).withMessage('sortBy must be newest, salary, or location'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50'),
];
