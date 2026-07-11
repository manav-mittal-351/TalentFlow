// ─── routes/company.routes.js ─────────────────────────────────────────────────
// Company route definitions — 3 endpoints as documented.
// Doc reference: Document 5 — API Design §10 (Company Routes)
//
// GET  /api/v1/company       — Public (no auth required)
// POST /api/v1/company       — Recruiter only
// PATCH /api/v1/company      — Recruiter only (partial update)

import { Router } from 'express';
import {
  getCompanyProfile,
  createCompanyProfile,
  updateCompanyProfile,
} from '../controllers/company.controller.js';
import {
  createCompanyValidator,
  updateCompanyValidator,
} from '../validators/company.validator.js';
import { validate }         from '../middleware/validate.js';
import { verifyToken }      from '../middleware/verifyToken.js';
import { authorizeRoles }   from '../middleware/authorizeRoles.js';

const router = Router();

// GET /api/v1/company — Public
router.get('/', getCompanyProfile);

// POST /api/v1/company — Recruiter only
router.post(
  '/',
  verifyToken,
  authorizeRoles('recruiter'),
  createCompanyValidator,
  validate,
  createCompanyProfile
);

// PATCH /api/v1/company — Recruiter only (partial update)
router.patch(
  '/',
  verifyToken,
  authorizeRoles('recruiter'),
  updateCompanyValidator,
  validate,
  updateCompanyProfile
);

export default router;
