// ─── controllers/feedback.controller.js ──────────────────────────────────────
// Thin controller layer for all feedback endpoints.
// No business logic here — all delegated to feedback.service.js.
// Doc reference: Document 5 — API Design §14 (Feedback Routes)

import * as feedbackService from '../services/feedback.service.js';
import { success, paginatedSuccess } from '../utils/apiResponse.js';

// ─── POST /api/v1/feedback — Hiring Manager ───────────────────────────────────
export const submitFeedback = async (req, res, next) => {
  try {
    const feedback = await feedbackService.submitFeedback(req.body, req.user.id);
    return success(res, 'Feedback submitted successfully', feedback, 201);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/v1/feedback/application/:applicationId — Recruiter / HM ────────
export const getFeedbackByApplication = async (req, res, next) => {
  try {
    const { feedbacks, pagination } = await feedbackService.getFeedbackByApplication(
      req.params.applicationId,
      req.query,
      req.user
    );
    return paginatedSuccess(res, 'Feedback fetched successfully', feedbacks, pagination);
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/v1/feedback/:id — Hiring Manager (own only) ──────────────────
export const updateFeedback = async (req, res, next) => {
  try {
    const feedback = await feedbackService.updateFeedback(
      req.params.id,
      req.body,
      req.user.id
    );
    return success(res, 'Feedback updated successfully', feedback);
  } catch (err) {
    next(err);
  }
};
