// ─── services/interview.service.js ───────────────────────────────────────────
// Business logic for all interview scheduling operations.
// Doc reference: Document 5 — API Design §13 (Interview Routes)
//                Document 4 — Database Schema §5 (interviews)
//
// All service functions throw { message, statusCode, errorCode } on failure.

import Interview   from '../models/Interview.model.js';
import Application from '../models/Application.model.js';
import User        from '../models/User.model.js';
import { paginate, buildPagination } from '../utils/paginate.js';
import { createNotification }        from './notification.service.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const throwNotFound = (msg = 'Interview not found', code = 'INTERVIEW_NOT_FOUND') => {
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

// ─── POST /interviews — Recruiter schedule ────────────────────────────────────
/**
 * Schedules an interview for an application.
 *
 * Guards:
 *   - Application must exist and belong to a job created by this recruiter
 *   - Application status must be 'shortlisted' or 'interview' (not applied/hired etc.)
 *   - scheduledAt must be in the future
 *   - interviewerId (if provided) must be a hiring_manager
 *
 * Denormalization: job and candidate are copied from the application document
 * so reads don't require multi-level populate chains.
 *
 * After creation, updates application status to 'interview' if not already.
 *
 * @param {object} payload - { applicationId, scheduledAt, format, location,
 *                             candidateInstructions, interviewerId }
 * @param {string} recruiterId
 * @returns {object} Created interview
 */
export const scheduleInterview = async (payload, recruiterId) => {
  const { applicationId, scheduledAt, format, location = '',
          candidateInstructions = '', interviewerId = null } = payload;

  // 1. Validate application exists and recruiter owns the job
  const application = await Application.findOne({ _id: applicationId, isDeleted: false })
    .populate('job', 'createdBy department title');

  if (!application) {
    const err = new Error('Application not found');
    err.statusCode = 404; err.errorCode = 'APPLICATION_NOT_FOUND'; throw err;
  }

  if (application.job.createdBy.toString() !== recruiterId) {
    throwForbidden('You can only schedule interviews for applications on your jobs');
  }

  // 2. Application must be in a schedulable state
  const SCHEDULABLE_STATUSES = ['shortlisted', 'interview'];
  if (!SCHEDULABLE_STATUSES.includes(application.status)) {
    throwBad(
      `Cannot schedule an interview for an application with status '${application.status}'. ` +
      `Application must be shortlisted or interview.`,
      'VALIDATION_ERROR'
    );
  }

  // 3. scheduledAt must be in the future
  if (new Date(scheduledAt) <= new Date()) {
    throwBad('scheduledAt must be a future date and time', 'VALIDATION_ERROR');
  }

  // 4. Validate interviewer is a hiring_manager (if provided)
  if (interviewerId) {
    const hm = await User.findById(interviewerId).select('role');
    if (!hm || hm.role !== 'hiring_manager') {
      throwBad('interviewerId must reference a user with the hiring_manager role', 'VALIDATION_ERROR');
    }
  }

  // 5. Create interview — denormalize job and candidate from application
  const interview = await Interview.create({
    application:           applicationId,
    job:                   application.job._id,
    candidate:             application.candidate,
    scheduledBy:           recruiterId,
    interviewer:           interviewerId || null,
    scheduledAt:           new Date(scheduledAt),
    format,
    location,
    candidateInstructions,
    status:                'scheduled',
  });

  // 6. Advance application status to 'interview' if still 'shortlisted'
  if (application.status === 'shortlisted') {
    application.status = 'interview';
    application.statusHistory.push({
      status:    'interview',
      changedAt: new Date(),
      changedBy: recruiterId,
    });
    await application.save();
  }

  // Trigger notifications
  await createNotification({
    recipient:  application.candidate,
    type:       'interview_scheduled',
    message:    `An interview has been scheduled for "${application.job?.title || 'the job'}"`,
    link:       `/interviews/${interview._id}`,
    icon:       'info',
    relatedJob: application.job?._id,
    relatedApp: application._id,
  });

  if (interviewerId) {
    await createNotification({
      recipient:  interviewerId,
      type:       'interview_scheduled',
      message:    `You have been assigned to conduct an interview for "${application.job?.title || 'the job'}"`,
      link:       `/interviews/${interview._id}`,
      icon:       'info',
      relatedJob: application.job?._id,
      relatedApp: application._id,
    });
  }

  return interview.populate([
    { path: 'application', select: 'status coverNote appliedAt' },
    { path: 'job',         select: 'title department location' },
    { path: 'candidate',   select: 'name email' },
    { path: 'scheduledBy', select: 'name' },
    { path: 'interviewer', select: 'name department' },
  ]);
};

// ─── GET /interviews — Recruiter (paginated) ──────────────────────────────────
/**
 * Returns all interviews scheduled by this recruiter.
 * Supports: status filter, sortBy (upcoming | latest), pagination.
 *
 * @param {string} recruiterId
 * @param {object} query - req.query
 * @returns {{ interviews: Array, pagination: object }}
 */
export const getInterviews = async (recruiterId, query) => {
  const { page, limit, skip } = paginate(query);

  const filter = { scheduledBy: recruiterId };
  if (query.status) filter.status = query.status;

  // sortBy: 'upcoming' = scheduledAt ASC (next interviews first)
  //         'latest'   = scheduledAt DESC (most recently scheduled)
  const sort = query.sortBy === 'latest'
    ? { scheduledAt: -1 }
    : { scheduledAt: 1 }; // default: upcoming

  const [interviews, total] = await Promise.all([
    Interview.find(filter)
      .populate('candidate',   'name email')
      .populate('job',         'title department')
      .populate('interviewer', 'name department')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Interview.countDocuments(filter),
  ]);

  return { interviews, pagination: buildPagination(total, page, limit) };
};

// ─── GET /interviews/:id — All roles (scoped) ─────────────────────────────────
/**
 * Returns a single interview. Access is scoped by role:
 *
 *   Recruiter    → only if scheduledBy === req.user.id
 *   Candidate    → only if candidate === req.user.id
 *   HiringManager → only if interviewer === req.user.id OR job.department === hm.department
 *
 * @param {string} interviewId
 * @param {{ id: string, role: string }} user
 * @returns {object} Interview document
 */
export const getInterviewById = async (interviewId, user) => {
  const interview = await Interview.findById(interviewId)
    .populate('application', 'status coverNote appliedAt')
    .populate('job',         'title department location company')
    .populate('candidate',   'name email profile.headline')
    .populate('scheduledBy', 'name email')
    .populate('interviewer', 'name email department');

  if (!interview) throwNotFound();

  const { id, role } = user;

  if (role === 'recruiter' && interview.scheduledBy._id?.toString() !== id) {
    throwForbidden('You can only view interviews you scheduled');
  }

  if (role === 'candidate' && interview.candidate._id?.toString() !== id) {
    throwForbidden('You can only view your own interviews');
  }

  if (role === 'hiring_manager') {
    const isAssignedInterviewer = interview.interviewer?._id?.toString() === id;
    if (!isAssignedInterviewer) {
      // Fall back: check if HM's department matches job department
      const hm = await User.findById(id).select('department');
      const jobDept = interview.job?.department;
      if (!hm?.department || hm.department !== jobDept) {
        throwForbidden('You can only view interviews for jobs in your department or assigned to you');
      }
    }
  }

  return interview;
};

// ─── PATCH /interviews/:id — Recruiter partial update ─────────────────────────
/**
 * Partially updates an interview. Only provided fields are changed.
 * Doc 05 §13: "Changed from PUT → PATCH: only provided fields are updated"
 *
 * Guards:
 *   - Only the recruiter who scheduled it can update
 *   - Cannot update a cancelled interview
 *   - scheduledAt (if provided) must be in the future
 *   - interviewerId (if provided) must be a hiring_manager
 *
 * @param {string} interviewId
 * @param {object} updates    - Partial update fields
 * @param {string} recruiterId
 * @returns {object} Updated interview
 */
export const updateInterview = async (interviewId, updates, recruiterId) => {
  const interview = await Interview.findById(interviewId)
    .populate('job', 'title');
  if (!interview) throwNotFound();

  if (interview.scheduledBy.toString() !== recruiterId) {
    throwForbidden('You can only update interviews you scheduled');
  }

  if (interview.status === 'cancelled' || interview.status === 'completed') {
    throwBad(`Cannot update a ${interview.status} interview`, 'VALIDATION_ERROR');
  }

  // Validate scheduledAt future constraint
  if (updates.scheduledAt && new Date(updates.scheduledAt) <= new Date()) {
    throwBad('scheduledAt must be a future date and time', 'VALIDATION_ERROR');
  }

  // Validate interviewerId is a HM
  if (updates.interviewerId !== undefined) {
    if (updates.interviewerId) {
      const hm = await User.findById(updates.interviewerId).select('role');
      if (!hm || hm.role !== 'hiring_manager') {
        throwBad('interviewerId must reference a user with the hiring_manager role', 'VALIDATION_ERROR');
      }
    }
    interview.interviewer = updates.interviewerId || null;
  }

  // Apply only provided fields (PATCH semantics)
  const PATCHABLE = ['scheduledAt', 'format', 'location', 'candidateInstructions'];
  for (const field of PATCHABLE) {
    if (updates[field] !== undefined) {
      interview[field] = field === 'scheduledAt' ? new Date(updates[field]) : updates[field];
    }
  }

  await interview.save();

  // Send notifications if schedule changed
  if (updates.scheduledAt || updates.format || updates.location) {
    await createNotification({
      recipient:  interview.candidate,
      type:       'interview_scheduled',
      message:    `The details of your interview for "${interview.job?.title || 'the job'}" have been updated`,
      link:       `/interviews/${interview._id}`,
      icon:       'info',
      relatedJob: interview.job?._id,
      relatedApp: interview.application,
    });

    if (interview.interviewer) {
      await createNotification({
        recipient:  interview.interviewer,
        type:       'interview_scheduled',
        message:    `The details of the interview for "${interview.job?.title || 'the job'}" have been updated`,
        link:       `/interviews/${interview._id}`,
        icon:       'info',
        relatedJob: interview.job?._id,
        relatedApp: interview.application,
      });
    }
  }

  return interview.populate([
    { path: 'candidate',   select: 'name email' },
    { path: 'job',         select: 'title department' },
    { path: 'scheduledBy', select: 'name' },
    { path: 'interviewer', select: 'name department' },
  ]);
};

// ─── PATCH /interviews/:id/status — Recruiter ─────────────────────────────────
/**
 * Updates interview status to 'completed' or 'cancelled'.
 * If cancelling, records cancelledReason.
 *
 * Guards:
 *   - Only the recruiter who scheduled it
 *   - Cannot transition from 'completed' (final state)
 *
 * @param {string} interviewId
 * @param {string} status          - 'completed' | 'cancelled'
 * @param {string} cancelledReason - optional, only for 'cancelled'
 * @param {string} recruiterId
 * @returns {object} Updated interview
 */
export const updateInterviewStatus = async (interviewId, status, cancelledReason = '', recruiterId) => {
  const interview = await Interview.findById(interviewId)
    .populate('job', 'title');
  if (!interview) throwNotFound();

  if (interview.scheduledBy.toString() !== recruiterId) {
    throwForbidden('You can only update interviews you scheduled');
  }

  // 'completed' is a terminal state — cannot transition out
  if (interview.status === 'completed') {
    throwBad('Cannot change the status of a completed interview', 'VALIDATION_ERROR');
  }

  interview.status = status;
  if (status === 'cancelled' && cancelledReason) {
    interview.cancelledReason = cancelledReason;
  }

  await interview.save();

  // Send status change notifications
  if (status === 'completed') {
    await createNotification({
      recipient:  interview.scheduledBy,
      type:       'interview_completed',
      message:    `Interview for "${interview.job?.title || 'the job'}" has been completed`,
      link:       `/interviews/${interview._id}`,
      icon:       'success',
      relatedJob: interview.job?._id,
      relatedApp: interview.application,
    });
    // Send to candidate too
    await createNotification({
      recipient:  interview.candidate,
      type:       'status_updated',
      message:    `Your interview for "${interview.job?.title || 'the job'}" has been completed`,
      link:       `/interviews/${interview._id}`,
      icon:       'success',
      relatedJob: interview.job?._id,
      relatedApp: interview.application,
    });
  } else if (status === 'cancelled') {
    await createNotification({
      recipient:  interview.candidate,
      type:       'interview_cancelled',
      message:    `Your interview for "${interview.job?.title || 'the job'}" has been cancelled`,
      link:       `/interviews/${interview._id}`,
      icon:       'warning',
      relatedJob: interview.job?._id,
      relatedApp: interview.application,
    });
    if (interview.interviewer) {
      await createNotification({
        recipient:  interview.interviewer,
        type:       'interview_cancelled',
        message:    `The interview for "${interview.job?.title || 'the job'}" has been cancelled`,
        link:       `/interviews/${interview._id}`,
        icon:       'warning',
        relatedJob: interview.job?._id,
        relatedApp: interview.application,
      });
    }
  }

  return interview.populate([
    { path: 'candidate',   select: 'name email' },
    { path: 'job',         select: 'title department' },
    { path: 'scheduledBy', select: 'name' },
    { path: 'interviewer', select: 'name department' },
  ]);
};
