// ─── validators/user.validator.js ─────────────────────────────────────────────
// express-validator arrays for candidate profile and saved jobs.
// Doc reference: Document 5 — API Design §9 (User / Profile Routes)
//                Document 4 — Database Schema §1 (users fields & regexes)
//
// NOTE on empty-string handling:
//   `.optional({ values: 'falsy' })` treats '', null, and undefined as absent,
//   so the subsequent `.isURL()` / `.matches()` check is skipped entirely.
//   This mirrors the Mongoose schema's `^$|^pattern` match regexes which
//   also permit empty strings for optional fields.

import { body, query, param } from 'express-validator';

// ─── Reusable URL validator factory ───────────────────────────────────────────
// Produces a chain that:
//   • skips validation when the value is empty/null/undefined
//   • validates the URL is a proper HTTP(S) URL when a value is present
//   • optionally enforces a hostname-specific regex for branded links
const urlField = (field, options = {}) => {
  const { hostnamePattern, message } = options;
  let chain = body(field)
    .optional({ values: 'falsy' })  // skip when '', null, or undefined
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage(`${field}: Must be a valid URL — include http:// or https:// (e.g. https://example.com)`);

  if (hostnamePattern) {
    chain = chain
      .matches(hostnamePattern)
      .withMessage(message || `${field}: Invalid URL format`);
  }

  return chain;
};

// ─── PUT /users/profile — Candidate ───────────────────────────────────────────
export const updateProfileValidator = [
  body('headline')
    .optional()
    .trim()
    .isLength({ max: 150 }).withMessage('headline: Headline cannot exceed 150 characters'),

  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('bio: Bio cannot exceed 1000 characters'),

  body('phone')
    .optional({ values: 'falsy' })   // allow empty string (field cleared)
    .trim()
    .matches(/^\+?[0-9\s\-().]{7,20}$/)
    .withMessage('phone: Please enter a valid phone number'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('location: Location cannot exceed 100 characters'),

  // ── Social / Portfolio links ──────────────────────────────────────────────
  urlField('portfolioUrl'),

  urlField('githubUrl', {
    hostnamePattern: /^https?:\/\/(www\.)?github\.com\/.+/,
    message:         'GitHub URL must include your username — e.g. https://github.com/yourusername',
  }),

  urlField('linkedinUrl', {
    hostnamePattern: /^https?:\/\/(www\.)?linkedin\.com\/.+/,
    message:         'LinkedIn URL must include your profile path — e.g. https://linkedin.com/in/yourusername',
  }),

  // Extra free-form link slots — accept any valid http/https URL
  urlField('twitterUrl'),
  urlField('leetcodeUrl'),
  urlField('codechefUrl'),
  urlField('hackerrankUrl'),
  urlField('behanceUrl'),
  urlField('dribbbleUrl'),
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
