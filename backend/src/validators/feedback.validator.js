// ─── validators/feedback.validator.js ────────────────────────────────────────
// express-validator rules for all feedback endpoints.
// Doc reference: Document 5 — API Design §14 (Feedback Routes)
//                Document 4 — Database Schema §6 (feedback field constraints)

import { body, param, query } from 'express-validator';
import { FEEDBACK_RECOMMENDATIONS } from '../utils/constants.js';

// ─── POST /feedback — HM submit scorecard ─────────────────────────────────────
export const createFeedbackValidator = [
  body('interviewId')
    .notEmpty().withMessage('interviewId is required')
    .isMongoId().withMessage('interviewId must be a valid ObjectId'),

  body('applicationId')
    .notEmpty().withMessage('applicationId is required')
    .isMongoId().withMessage('applicationId must be a valid ObjectId'),

  // ratings object — all 4 sub-fields required, integer 1–5
  body('ratings')
    .notEmpty().withMessage('ratings object is required'),

  body('ratings.overall')
    .notEmpty().withMessage('ratings.overall is required')
    .isInt({ min: 1, max: 5 }).withMessage('ratings.overall must be an integer between 1 and 5'),

  body('ratings.technical')
    .notEmpty().withMessage('ratings.technical is required')
    .isInt({ min: 1, max: 5 }).withMessage('ratings.technical must be an integer between 1 and 5'),

  body('ratings.communication')
    .notEmpty().withMessage('ratings.communication is required')
    .isInt({ min: 1, max: 5 }).withMessage('ratings.communication must be an integer between 1 and 5'),

  body('ratings.cultureFit')
    .notEmpty().withMessage('ratings.cultureFit is required')
    .isInt({ min: 1, max: 5 }).withMessage('ratings.cultureFit must be an integer between 1 and 5'),

  body('recommendation')
    .notEmpty().withMessage('recommendation is required')
    .isIn(FEEDBACK_RECOMMENDATIONS)
    .withMessage(`recommendation must be one of: ${FEEDBACK_RECOMMENDATIONS.join(', ')}`),

  body('comments')
    .optional()
    .trim()
    .isLength({ max: 3000 }).withMessage('comments cannot exceed 3000 characters'),

  body('decisionReason')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('decisionReason cannot exceed 1000 characters'),
];

// ─── PATCH /feedback/:id — HM partial update ──────────────────────────────────
export const updateFeedbackValidator = [
  // All fields optional — PATCH semantics
  body('ratings.overall')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('ratings.overall must be an integer between 1 and 5'),

  body('ratings.technical')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('ratings.technical must be an integer between 1 and 5'),

  body('ratings.communication')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('ratings.communication must be an integer between 1 and 5'),

  body('ratings.cultureFit')
    .optional()
    .isInt({ min: 1, max: 5 }).withMessage('ratings.cultureFit must be an integer between 1 and 5'),

  body('recommendation')
    .optional()
    .isIn(FEEDBACK_RECOMMENDATIONS)
    .withMessage(`recommendation must be one of: ${FEEDBACK_RECOMMENDATIONS.join(', ')}`),

  body('comments')
    .optional()
    .trim()
    .isLength({ max: 3000 }).withMessage('comments cannot exceed 3000 characters'),

  body('decisionReason')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('decisionReason cannot exceed 1000 characters'),
];

// ─── GET /feedback/application/:applicationId — Recruiter/HM (paginated) ──────
export const getFeedbackByApplicationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('limit must be between 1 and 50'),
];
