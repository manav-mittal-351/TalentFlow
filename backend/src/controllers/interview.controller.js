// ─── controllers/interview.controller.js ──────────────────────────────────────
// Thin controller layer for all interview endpoints.
// No business logic here — all delegated to interview.service.js.
// Doc reference: Document 5 — API Design §13 (Interview Routes)

import * as interviewService from '../services/interview.service.js';
import { success, paginatedSuccess } from '../utils/apiResponse.js';

// ─── POST /api/v1/interviews — Recruiter ──────────────────────────────────────
export const scheduleInterview = async (req, res, next) => {
  try {
    const interview = await interviewService.scheduleInterview(req.body, req.user.id);
    return success(res, 'Interview scheduled successfully', interview, 201);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/v1/interviews — Recruiter (paginated) ───────────────────────────
export const getInterviews = async (req, res, next) => {
  try {
    const { interviews, pagination } = await interviewService.getInterviews(
      req.user.id,
      req.query
    );
    return paginatedSuccess(res, 'Interviews fetched successfully', interviews, pagination);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/v1/interviews/:id — All roles (scoped) ─────────────────────────
export const getInterviewById = async (req, res, next) => {
  try {
    const interview = await interviewService.getInterviewById(req.params.id, req.user);
    return success(res, 'Interview fetched successfully', interview);
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/v1/interviews/:id — Recruiter (partial update) ────────────────
export const updateInterview = async (req, res, next) => {
  try {
    const interview = await interviewService.updateInterview(
      req.params.id,
      req.body,
      req.user.id
    );
    return success(res, 'Interview updated successfully', interview);
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/v1/interviews/:id/status — Recruiter ─────────────────────────
export const updateInterviewStatus = async (req, res, next) => {
  try {
    const { status, cancelledReason = '' } = req.body;
    const interview = await interviewService.updateInterviewStatus(
      req.params.id,
      status,
      cancelledReason,
      req.user.id
    );
    return success(res, `Interview status updated to '${interview.status}'`, interview);
  } catch (err) {
    next(err);
  }
};
