// ─── routes/dashboard.routes.js ───────────────────────────────────────────────
// Dashboard route definitions — 3 endpoints.
// Doc reference: Document 5 — API Design §16 (Dashboard Routes)

import { Router } from 'express';
import {
  getRecruiterDashboard,
  getCandidateDashboard,
  getHiringManagerDashboard,
} from '../controllers/dashboard.controller.js';
import { verifyToken }    from '../middleware/verifyToken.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';

const router = Router();

// Apply verifyToken as all dashboard endpoints require authentication
router.use(verifyToken);

// GET /api/v1/dashboard/recruiter — Recruiter only
router.get(
  '/recruiter',
  authorizeRoles('recruiter'),
  getRecruiterDashboard
);

// GET /api/v1/dashboard/candidate — Candidate only
router.get(
  '/candidate',
  authorizeRoles('candidate'),
  getCandidateDashboard
);

// GET /api/v1/dashboard/hiring-manager — Hiring Manager only
router.get(
  '/hiring-manager',
  authorizeRoles('hiring_manager'),
  getHiringManagerDashboard
);

export default router;
