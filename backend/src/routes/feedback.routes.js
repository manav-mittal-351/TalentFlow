// ─── routes/feedback.routes.js ───────────────────────────────────────────────
// Feedback route definitions — 3 endpoints as documented.
// Doc reference: Document 5 — API Design §14 (Feedback Routes)
//
// ⚠️  Route order: static routes before parametric
//
//   POST   /                          HM — submit scorecard
//   GET    /application/:applicationId Recruiter / HM — feedback for an application
//   PATCH  /:id                       HM — partial update (own only)
//
// Route summary:
//   POST   /feedback                         HM — submit feedback
//   GET    /feedback/application/:id         Recruiter / HM — list by application (paginated)
//   PATCH  /feedback/:id                     HM (own only) — partial update

import { Router }       from 'express';
import {
  submitFeedback,
  getFeedbackByApplication,
  updateFeedback,
} from '../controllers/feedback.controller.js';
import {
  createFeedbackValidator,
  updateFeedbackValidator,
  getFeedbackByApplicationValidator,
} from '../validators/feedback.validator.js';
import { validate }       from '../middleware/validate.js';
import { verifyToken }    from '../middleware/verifyToken.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';

const router = Router();

// ─── POST /api/v1/feedback — Hiring Manager submit ───────────────────────────
router.post(
  '/',
  verifyToken,
  authorizeRoles('hiring_manager'),
  createFeedbackValidator,
  validate,
  submitFeedback
);

// ─── GET /api/v1/feedback/application/:applicationId — static before /:id ────
// Recruiter + HM; must be registered before PATCH /:id to avoid Express
// matching 'application' as a feedback ID.
router.get(
  '/application/:applicationId',
  verifyToken,
  authorizeRoles('recruiter', 'hiring_manager'),
  getFeedbackByApplicationValidator,
  validate,
  getFeedbackByApplication
);

// ─── PATCH /api/v1/feedback/:id — HM own only (parametric — LAST) ─────────────
router.patch(
  '/:id',
  verifyToken,
  authorizeRoles('hiring_manager'),
  updateFeedbackValidator,
  validate,
  updateFeedback
);

export default router;
