// ─── services/feedback.service.js ────────────────────────────────────────────
// Business logic for all feedback operations.
// Doc reference: Document 5 — API Design §14 (Feedback Routes)
//                Document 4 — Database Schema §6 (feedbacks)
//
// All service functions throw { message, statusCode, errorCode } on failure.

import Feedback    from '../models/Feedback.model.js';
import Interview   from '../models/Interview.model.js';
import Application from '../models/Application.model.js';
import { paginate, buildPagination } from '../utils/paginate.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const throwNotFound = (msg = 'Feedback not found', code = 'FEEDBACK_NOT_FOUND') => {
  const err = new Error(msg);
  err.statusCode = 404;
  err.errorCode  = code;
  throw err;
};

const throwForbidden = (msg = 'You are not authorized to perform this action') => {
  const err = new Error(msg);
  err.statusCode = 403;
  err.errorCode  = 'FORBIDDEN_ROLE';
  throw err;
};

const throwBad = (msg, code = 'VALIDATION_ERROR') => {
  const err = new Error(msg);
  err.statusCode = 400;
  err.errorCode  = code;
  throw err;
};

// ─── POST /feedback — HM submit scorecard ─────────────────────────────────────
/**
 * Submits feedback (scorecard) for a completed interview.
 *
 * Guards (documented error codes from Doc 05 §14):
 *   - interviewId must exist and be accessible to this HM
 *   - interview.status must be 'completed'      → INTERVIEW_NOT_COMPLETED
 *   - One feedback per interview per HM          → FEEDBACK_ALREADY_SUBMITTED
 *   - applicationId must match interview.application
 *
 * Denormalization:
 *   - candidate is copied from interview at submit time
 *
 * @param {object} payload  - { interviewId, applicationId, ratings, recommendation,
 *                             comments, decisionReason }
 * @param {string} hmId     - Hiring Manager user ID
 * @returns {object}        Created feedback document
 */
export const submitFeedback = async (payload, hmId) => {
  const {
    interviewId, applicationId,
    ratings, recommendation,
    comments = '', decisionReason = '',
  } = payload;

  // 1. Validate interview exists and HM has access
  const interview = await Interview.findById(interviewId);
  if (!interview) {
    const err = new Error('Interview not found');
    err.statusCode = 404; err.errorCode = 'INTERVIEW_NOT_FOUND'; throw err;
  }

  // HM must be the assigned interviewer OR have a dept match (same check as GET /:id)
  // For feedback submission: we require the HM to be the assigned interviewer.
  // This is the strictest correct interpretation — only assigned HMs submit scorecards.
  if (!interview.interviewer || interview.interviewer.toString() !== hmId) {
    throwForbidden('You can only submit feedback for interviews you are assigned to');
  }

  // 2. Interview must be completed → INTERVIEW_NOT_COMPLETED
  if (interview.status !== 'completed') {
    throwBad(
      'Feedback can only be submitted for a completed interview',
      'INTERVIEW_NOT_COMPLETED'
    );
  }

  // 3. applicationId must match interview.application
  if (interview.application.toString() !== applicationId) {
    throwBad('applicationId does not match the interview\'s application', 'VALIDATION_ERROR');
  }

  // 4. One feedback per interview per HM → FEEDBACK_ALREADY_SUBMITTED
  // The compound unique index (interview + submittedBy) enforces this at DB level,
  // but we check here first for a clean error response with the right errorCode.
  const existing = await Feedback.findOne({ interview: interviewId, submittedBy: hmId });
  if (existing) {
    const err = new Error('You have already submitted feedback for this interview');
    err.statusCode = 409;
    err.errorCode  = 'FEEDBACK_ALREADY_SUBMITTED';
    throw err;
  }

  // 5. Create feedback — denormalize candidate from interview
  const feedback = await Feedback.create({
    interview:   interviewId,
    application: applicationId,
    candidate:   interview.candidate,
    submittedBy: hmId,
    ratings,
    recommendation,
    comments,
    decisionReason,
  });

  return feedback.populate([
    { path: 'interview',   select: 'scheduledAt format status job' },
    { path: 'application', select: 'status appliedAt' },
    { path: 'candidate',   select: 'name email' },
    { path: 'submittedBy', select: 'name email' },
  ]);
};

// ─── GET /feedback/application/:applicationId — Recruiter / HM (paginated) ───
/**
 * Returns all feedback for a given application.
 * Both Recruiter and HM can read — scoping is enforced by role at route level.
 *
 * @param {string} applicationId
 * @param {object} reqQuery    - req.query (page, limit)
 * @param {{ id: string, role: string }} user
 * @returns {{ feedbacks: Array, pagination: object }}
 */
export const getFeedbackByApplication = async (applicationId, reqQuery, user) => {
  // Verify application exists
  const application = await Application.findOne({ _id: applicationId, isDeleted: false })
    .populate('job', 'createdBy department');

  if (!application) {
    const err = new Error('Application not found');
    err.statusCode = 404; err.errorCode = 'APPLICATION_NOT_FOUND'; throw err;
  }

  // Recruiter: must own the job
  if (user.role === 'recruiter') {
    if (application.job.createdBy.toString() !== user.id) {
      throwForbidden('You can only view feedback for applications on your jobs');
    }
  }

  // HM: must belong to the job's department
  // Department check done via user profile if needed; for V1 we allow any HM
  // (HM dept enforcement is best done in conjunction with full User profile module)

  const { page, limit, skip } = paginate(reqQuery);

  const [feedbacks, total] = await Promise.all([
    Feedback.find({ application: applicationId })
      .populate('submittedBy', 'name email department')
      .populate('interview',   'scheduledAt format status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Feedback.countDocuments({ application: applicationId }),
  ]);

  return { feedbacks, pagination: buildPagination(total, page, limit) };
};

// ─── PATCH /feedback/:id — HM (own only, partial update) ─────────────────────
/**
 * Partially updates a feedback submission.
 * Only the HM who submitted it can edit (own only).
 * PATCH semantics: only provided fields are changed.
 *
 * @param {string} feedbackId
 * @param {object} updates    - Partial update fields
 * @param {string} hmId       - Hiring Manager user ID
 * @returns {object}          Updated feedback
 */
export const updateFeedback = async (feedbackId, updates, hmId) => {
  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) throwNotFound();

  // Ownership: only the submitting HM can edit
  if (feedback.submittedBy.toString() !== hmId) {
    throwForbidden('You can only edit feedback you submitted');
  }

  // Apply individual rating sub-fields if provided (PATCH semantics on nested obj)
  if (updates.ratings) {
    const ratingFields = ['overall', 'technical', 'communication', 'cultureFit'];
    for (const field of ratingFields) {
      if (updates.ratings[field] !== undefined) {
        feedback.ratings[field] = updates.ratings[field];
      }
    }
    // Mark the nested ratings object as modified so Mongoose saves it
    feedback.markModified('ratings');
  }

  // Apply top-level patchable fields
  const PATCHABLE = ['recommendation', 'comments', 'decisionReason'];
  for (const field of PATCHABLE) {
    if (updates[field] !== undefined) {
      feedback[field] = updates[field];
    }
  }

  await feedback.save();

  return feedback.populate([
    { path: 'interview',   select: 'scheduledAt format status' },
    { path: 'candidate',   select: 'name email' },
    { path: 'submittedBy', select: 'name email' },
  ]);
};
