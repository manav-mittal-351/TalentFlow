// ─── validators/notification.validator.js ─────────────────────────────────────
// Validation rules for all notification routes.
// Doc reference: Document 5 — API Design §15 (Notification Routes)

import { query } from 'express-validator';

// ─── GET /notifications — Paginated list ──────────────────────────────────────
export const getNotificationsValidator = [
  query('isRead')
    .optional()
    .isIn(['true', 'false']).withMessage('isRead must be true or false'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
];
