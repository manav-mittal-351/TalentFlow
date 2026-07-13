// ─── routes/user.routes.js ────────────────────────────────────────────────────
// User / Profile route definitions — 5 candidate-only endpoints.
// Doc reference: Document 5 — API Design §9 (User / Profile Routes)
//
// ⚠️  Route order is critical:
//   Static endpoint (GET /saved-jobs) MUST be defined BEFORE parametric endpoints
//   (POST/DELETE /saved-jobs/:jobId) — otherwise Express treats the literal
//   string "saved-jobs" as jobId param values.

import { Router } from 'express';
import {
  updateProfile,
  uploadResume,
  saveJob,
  unsaveJob,
  getSavedJobs,
} from '../controllers/user.controller.js';
import {
  updateProfileValidator,
  getSavedJobsValidator,
  savedJobParamValidator,
} from '../validators/user.validator.js';
import { validate }           from '../middleware/validate.js';
import { verifyToken }        from '../middleware/verifyToken.js';
import { authorizeRoles }     from '../middleware/authorizeRoles.js';
import { handleResumeUpload } from '../middleware/uploadResume.js';

const router = Router();

// Apply verifyToken and candidate role restriction to all user/profile endpoints
router.use(verifyToken);
router.use(authorizeRoles('candidate'));

// PUT /api/v1/users/profile — Candidate profile fields update
router.put('/profile', updateProfileValidator, validate, updateProfile);

// POST /api/v1/users/resume — Candidate resume file upload
router.post('/resume', handleResumeUpload, uploadResume);

// ─── Saved Jobs endpoints (order is critical!) ────────────────────────────────

// GET /api/v1/users/saved-jobs — Candidate (static route must be first)
router.get('/saved-jobs', getSavedJobsValidator, validate, getSavedJobs);

// POST /api/v1/users/saved-jobs/:jobId — Candidate (parametric route)
router.post('/saved-jobs/:jobId', savedJobParamValidator, validate, saveJob);

// DELETE /api/v1/users/saved-jobs/:jobId — Candidate (parametric route)
router.delete('/saved-jobs/:jobId', savedJobParamValidator, validate, unsaveJob);

export default router;
