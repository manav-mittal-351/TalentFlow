// ─── controllers/dashboard.controller.js ──────────────────────────────────────
// Thin controller layer for all dashboard aggregation endpoints.
// No business logic here — all delegated to dashboard.service.js.
// Doc reference: Document 5 — API Design §16 (Dashboard Routes)

import * as dashboardService from '../services/dashboard.service.js';
import { success } from '../utils/apiResponse.js';

// ─── GET /api/v1/dashboard/recruiter — Recruiter ──────────────────────────────
export const getRecruiterDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getRecruiterDashboard(req.user.id);
    return success(res, 'Recruiter dashboard fetched successfully', data);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/v1/dashboard/candidate — Candidate ──────────────────────────────
export const getCandidateDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getCandidateDashboard(req.user.id);
    return success(res, 'Candidate dashboard fetched successfully', data);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/v1/dashboard/hiring-manager — Hiring Manager ────────────────────
export const getHiringManagerDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getHiringManagerDashboard(req.user.id);
    return success(res, 'Hiring Manager dashboard fetched successfully', data);
  } catch (err) {
    next(err);
  }
};
