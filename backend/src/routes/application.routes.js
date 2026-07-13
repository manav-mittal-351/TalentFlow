// ─── routes/application.routes.js ────────────────────────────────────────────
// Application route definitions — 10 endpoints as documented.
// Doc reference: Document 5 — API Design §12 (Application Routes)
//
// ⚠️  ROUTE ORDER IS CRITICAL — static routes before parametric:
//
//   /my                   (Candidate)
//   /my/:applicationId    (Candidate)
//   /job/:jobId           (Recruiter)
//   /job/:jobId/hm        (HM)
//   /:jobId               (Candidate — apply)    POST
//   /:id                  (Recruiter / HM)       GET
//   /:id/withdraw         (Candidate)            PATCH
//   /:id/status           (Recruiter)            PATCH
//   /:id/notes            (Recruiter)            PATCH
//   /:id/resume           (Recruiter / HM)       GET
//
// Route summary:
//   POST   /:jobId                  Candidate — apply to job
//   GET    /my                      Candidate — their own applications (paginated)
//   GET    /my/:applicationId       Candidate — single own application
//   PATCH  /:id/withdraw            Candidate — withdraw
//   GET    /job/:jobId              Recruiter — all apps for a job (paginated)
//   GET    /job/:jobId/hm           HM — shortlisted+interview for a job (paginated)
//   GET    /:id                     Recruiter / HM — full detail
//   PATCH  /:id/status              Recruiter — status update
//   PATCH  /:id/notes               Recruiter — private notes
//   GET    /:id/resume              Recruiter / HM — resume download

import { Router }         from 'express';
import {
  applyToJob,
  getMyApplications,
  getMyApplicationById,
  withdrawApplication,
  getJobApplications,
  getJobApplicationsHM,
  getApplicationById,
  updateApplicationStatus,
  updateRecruiterNotes,
  downloadResume,
} from '../controllers/application.controller.js';
import {
  applyValidator,
  updateStatusValidator,
  updateNotesValidator,
  getMyApplicationsValidator,
  getJobApplicationsValidator,
} from '../validators/application.validator.js';
import { validate }            from '../middleware/validate.js';
import { verifyToken }         from '../middleware/verifyToken.js';
import { authorizeRoles }      from '../middleware/authorizeRoles.js';
import { handleResumeUpload }  from '../middleware/uploadResume.js';

const router = Router();

// ─── Candidate — static routes first ─────────────────────────────────────────

// GET /api/v1/applications/my — Candidate (paginated list)
router.get(
  '/my',
  verifyToken,
  authorizeRoles('candidate'),
  getMyApplicationsValidator,
  validate,
  getMyApplications
);

// GET /api/v1/applications/my/:applicationId — Candidate (single application)
router.get(
  '/my/:applicationId',
  verifyToken,
  authorizeRoles('candidate'),
  getMyApplicationById
);

// ─── Recruiter / HM — static routes ──────────────────────────────────────────

// GET /api/v1/applications/job/:jobId — Recruiter
router.get(
  '/job/:jobId',
  verifyToken,
  authorizeRoles('recruiter'),
  getJobApplicationsValidator,
  validate,
  getJobApplications
);

// GET /api/v1/applications/job/:jobId/hm — Hiring Manager
router.get(
  '/job/:jobId/hm',
  verifyToken,
  authorizeRoles('hiring_manager'),
  getJobApplicationsHM
);

// ─── Candidate — apply (parametric POST after static GETs) ───────────────────

// POST /api/v1/applications/:jobId — Candidate apply
// handleResumeUpload runs multer for optional resume upload
router.post(
  '/:jobId',
  verifyToken,
  authorizeRoles('candidate'),
  handleResumeUpload,       // optional multipart/form-data resume
  applyValidator,
  validate,
  applyToJob
);

// ─── Parametric routes — after all static routes ──────────────────────────────

// PATCH /api/v1/applications/:id/withdraw — Candidate
router.patch(
  '/:id/withdraw',
  verifyToken,
  authorizeRoles('candidate'),
  withdrawApplication
);

// PATCH /api/v1/applications/:id/status — Recruiter
router.patch(
  '/:id/status',
  verifyToken,
  authorizeRoles('recruiter'),
  updateStatusValidator,
  validate,
  updateApplicationStatus
);

// PATCH /api/v1/applications/:id/notes — Recruiter
router.patch(
  '/:id/notes',
  verifyToken,
  authorizeRoles('recruiter'),
  updateNotesValidator,
  validate,
  updateRecruiterNotes
);

// GET /api/v1/applications/:id/resume — Recruiter / HM
router.get(
  '/:id/resume',
  verifyToken,
  authorizeRoles('recruiter', 'hiring_manager'),
  downloadResume
);

// GET /api/v1/applications/:id — Recruiter / HM (most general — MUST be last)
router.get(
  '/:id',
  verifyToken,
  authorizeRoles('recruiter', 'hiring_manager'),
  getApplicationById
);

export default router;
