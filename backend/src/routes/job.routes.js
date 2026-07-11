// ─── routes/job.routes.js ─────────────────────────────────────────────────────
// Job route definitions — 8 endpoints as documented.
// Doc reference: Document 5 — API Design §11 (Job Routes)
//
// ⚠️  ROUTE ORDER IS CRITICAL:
//   Static routes (/recruiter/all, /hiring-manager/assigned) MUST be defined
//   BEFORE parametric routes (/:jobId) — otherwise Express will treat the
//   literal strings "recruiter" and "hiring-manager" as jobId values.
//
// Route summary:
//   GET    /                      Public — paginated list
//   GET    /recruiter/all         Recruiter — all their jobs (all statuses)
//   GET    /hiring-manager/assigned  HM — dept-scoped published jobs
//   POST   /                      Recruiter — create
//   GET    /:jobId                Public — single job
//   PATCH  /:jobId/status         Recruiter — status-only update
//   PATCH  /:jobId                Recruiter — partial update
//   DELETE /:jobId                Recruiter — soft-delete

import { Router } from 'express';
import {
  getJobs,
  getJobById,
  createJob,
  updateJob,
  updateJobStatus,
  deleteJob,
  getRecruiterJobs,
  getHMJobs,
} from '../controllers/job.controller.js';
import {
  createJobValidator,
  updateJobValidator,
  updateJobStatusValidator,
  getJobsValidator,
} from '../validators/job.validator.js';
import { validate }       from '../middleware/validate.js';
import { verifyToken }    from '../middleware/verifyToken.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';

const router = Router();

// ─── Static routes (must be first) ───────────────────────────────────────────

// GET /api/v1/jobs — Public
router.get('/', getJobsValidator, validate, getJobs);

// GET /api/v1/jobs/recruiter/all — Recruiter only
router.get(
  '/recruiter/all',
  verifyToken,
  authorizeRoles('recruiter'),
  getRecruiterJobs
);

// GET /api/v1/jobs/hiring-manager/assigned — Hiring Manager only
router.get(
  '/hiring-manager/assigned',
  verifyToken,
  authorizeRoles('hiring_manager'),
  getHMJobs
);

// POST /api/v1/jobs — Recruiter only
router.post(
  '/',
  verifyToken,
  authorizeRoles('recruiter'),
  createJobValidator,
  validate,
  createJob
);

// ─── Parametric routes (must be after static) ─────────────────────────────────

// GET /api/v1/jobs/:jobId — Public
router.get('/:jobId', getJobById);

// PATCH /api/v1/jobs/:jobId/status — Recruiter only (must be before /:jobId)
router.patch(
  '/:jobId/status',
  verifyToken,
  authorizeRoles('recruiter'),
  updateJobStatusValidator,
  validate,
  updateJobStatus
);

// PATCH /api/v1/jobs/:jobId — Recruiter only
router.patch(
  '/:jobId',
  verifyToken,
  authorizeRoles('recruiter'),
  updateJobValidator,
  validate,
  updateJob
);

// DELETE /api/v1/jobs/:jobId — Recruiter only (soft-delete)
router.delete(
  '/:jobId',
  verifyToken,
  authorizeRoles('recruiter'),
  deleteJob
);

export default router;
