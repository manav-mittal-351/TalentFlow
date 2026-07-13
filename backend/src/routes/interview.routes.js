// ─── routes/interview.routes.js ──────────────────────────────────────────────
// Interview route definitions — 5 endpoints as documented.
// Doc reference: Document 5 — API Design §13 (Interview Routes)
//
// ⚠️  Route order: static routes before parametric
//
//   GET    /                   Recruiter — paginated list
//   POST   /                   Recruiter — schedule new interview
//   GET    /:id/status         (not a route — status is only a PATCH target)
//   GET    /:id                All roles (scoped)
//   PATCH  /:id/status         Recruiter — status update
//   PATCH  /:id                Recruiter — partial update
//
// Route summary:
//   POST   /interviews                  Recruiter — schedule interview
//   GET    /interviews                  Recruiter — list (paginated, filtered)
//   GET    /interviews/:id              All roles (scoped: recruiter/candidate/HM)
//   PATCH  /interviews/:id              Recruiter — partial update
//   PATCH  /interviews/:id/status       Recruiter — status update

import { Router }       from 'express';
import {
  scheduleInterview,
  getInterviews,
  getInterviewById,
  updateInterview,
  updateInterviewStatus,
} from '../controllers/interview.controller.js';
import {
  createInterviewValidator,
  updateInterviewValidator,
  updateInterviewStatusValidator,
  getInterviewsValidator,
} from '../validators/interview.validator.js';
import { validate }       from '../middleware/validate.js';
import { verifyToken }    from '../middleware/verifyToken.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';

const router = Router();

// ─── POST /api/v1/interviews — Recruiter schedule ────────────────────────────
router.post(
  '/',
  verifyToken,
  authorizeRoles('recruiter'),
  createInterviewValidator,
  validate,
  scheduleInterview
);

// ─── GET /api/v1/interviews — Recruiter list (paginated) ─────────────────────
router.get(
  '/',
  verifyToken,
  authorizeRoles('recruiter'),
  getInterviewsValidator,
  validate,
  getInterviews
);

// ─── PATCH /api/v1/interviews/:id/status — Recruiter (static before /:id) ────
router.patch(
  '/:id/status',
  verifyToken,
  authorizeRoles('recruiter'),
  updateInterviewStatusValidator,
  validate,
  updateInterviewStatus
);

// ─── PATCH /api/v1/interviews/:id — Recruiter partial update ─────────────────
router.patch(
  '/:id',
  verifyToken,
  authorizeRoles('recruiter'),
  updateInterviewValidator,
  validate,
  updateInterview
);

// ─── GET /api/v1/interviews/:id — All roles (scoped — most general, LAST) ────
router.get(
  '/:id',
  verifyToken,
  authorizeRoles('recruiter', 'hiring_manager', 'candidate'),
  getInterviewById
);

export default router;
