// ─── services/application.service.js ─────────────────────────────────────────
// Business logic for all application operations.
// Doc reference: Document 5 — API Design §12 (Application Routes)
//                Document 4 — Database Schema §4 (applications)
//
// All service functions throw { message, statusCode, errorCode } on failure.
// Controllers catch and forward to next(err) → errorHandler.

import mongoose from 'mongoose';
import Application from '../models/Application.model.js';
import Job         from '../models/Job.model.js';
import User        from '../models/User.model.js';
import { paginate, buildPagination } from '../utils/paginate.js';
import { createNotification }        from './notification.service.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const throwNotFound = (msg = 'Application not found', code = 'APPLICATION_NOT_FOUND') => {
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

const throwBad = (msg, code) => {
  const err = new Error(msg);
  err.statusCode = 400;
  err.errorCode  = code;
  throw err;
};

// ─── POST /applications/:jobId — Candidate apply ──────────────────────────────
/**
 * Candidate applies to a job.
 *
 * Guards:
 *   - Job must exist, be published, and not deleted
 *   - Job must not be closed or archived
 *   - Application deadline must not have passed
 *   - Candidate must have a resumeUrl on profile (isProfileComplete check)
 *   - No duplicate applications (DB index enforces; service returns clean 409)
 *
 * Resume priority: req.file (uploaded this request) > candidate.profile.resumeUrl
 *
 * @param {string} jobId       - Job ObjectId string
 * @param {string} candidateId - Candidate's User _id
 * @param {string} coverNote   - Optional cover note (max 2000 chars)
 * @param {string|null} uploadedResumeUrl - path from multer (may be null)
 * @returns {object} Created application
 */
export const applyToJob = async (jobId, candidateId, coverNote = '', uploadedResumeUrl = null) => {
  // 1. Validate job
  const job = await Job.findOne({ _id: jobId, isDeleted: false });
  if (!job) {
    const err = new Error('Job not found');
    err.statusCode = 404; err.errorCode = 'JOB_NOT_FOUND'; throw err;
  }

  if (job.status !== 'published') {
    throwBad('This job is not accepting applications', 'JOB_CLOSED');
  }

  if (job.applicationDeadline && new Date() > new Date(job.applicationDeadline)) {
    throwBad('The application deadline for this job has passed', 'DEADLINE_PASSED');
  }

  // 2. Determine resume URL — uploaded file takes priority over profile resume
  let resumeUrl = uploadedResumeUrl;

  if (!resumeUrl) {
    // Fallback to candidate's profile resume
    const candidate = await User.findById(candidateId).select('profile.resumeUrl profile.isProfileComplete');
    if (!candidate?.profile?.resumeUrl) {
      throwBad(
        'Please upload your resume before applying. You can upload it in your profile.',
        'PROFILE_INCOMPLETE'
      );
    }
    resumeUrl = candidate.profile.resumeUrl;
  }

  // 3. Create application — the compound unique index (job+candidate) will throw
  //    a Mongoose duplicate key error (code 11000) if already applied.
  //    errorHandler converts it to 409 ALREADY_APPLIED below.
  try {
    const application = await Application.create({
      job:       jobId,
      candidate: candidateId,
      coverNote,
      resumeUrl,
      status:    'applied',
      statusHistory: [{
        status:    'applied',
        changedAt: new Date(),
        changedBy: candidateId,
      }],
    });

    // Increment job application count (denormalized stat)
    await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } });

    // Send notification to recruiter (job.createdBy)
    const applicant = await User.findById(candidateId).select('name');
    await createNotification({
      recipient:  job.createdBy,
      type:       'application_received',
      message:    `${applicant?.name || 'A candidate'} applied for "${job.title}"`,
      link:       `/applications/job/${job._id}`,
      icon:       'info',
      relatedJob: job._id,
      relatedApp: application._id,
    });

    // Strip recruiterNotes from create() result.
    // select:false blocks it in find() queries but create() returns the full doc.
    // The candidate should never see recruiterNotes in any response.
    const result = application.toObject();
    delete result.recruiterNotes;
    return result;
  } catch (err) {
    if (err.code === 11000) {
      // 409 Conflict — compound unique index (job + candidate) violated
      const conflict = new Error('You have already applied to this job');
      conflict.statusCode = 409;
      conflict.errorCode  = 'ALREADY_APPLIED';
      throw conflict;
    }
    throw err;
  }
};

// ─── GET /applications/my — Candidate (paginated) ─────────────────────────────
/**
 * Returns all non-deleted applications for the authenticated candidate.
 *
 * @param {string} candidateId
 * @param {object} query - req.query (status, sortBy, page, limit)
 * @returns {{ applications: Array, pagination: object }}
 */
export const getMyApplications = async (candidateId, query) => {
  const { page, limit, skip } = paginate(query);

  const filter = { candidate: candidateId, isDeleted: false };
  if (query.status) filter.status = query.status;

  const sort = query.sortBy === 'oldest'
    ? { appliedAt: 1 }
    : { appliedAt: -1 }; // default: latest

  const [applications, total] = await Promise.all([
    Application.find(filter)
      .populate('job', 'title department location jobType status company')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter),
  ]);

  return { applications, pagination: buildPagination(total, page, limit) };
};

// ─── GET /applications/my/:applicationId — Candidate ──────────────────────────
/**
 * Returns a single application — only the owning candidate can access.
 *
 * @param {string} applicationId
 * @param {string} candidateId
 * @returns {object} Application document (no recruiterNotes)
 */
export const getMyApplicationById = async (applicationId, candidateId) => {
  const application = await Application.findOne({
    _id:       applicationId,
    candidate: candidateId, // ownership enforced in query
    isDeleted: false,
  }).populate('job', 'title department location jobType status company');

  if (!application) throwNotFound();
  return application;
};

// ─── PATCH /applications/:id/withdraw — Candidate ─────────────────────────────
/**
 * Candidate withdraws their own application.
 * Cannot withdraw if already hired or rejected (Doc 05 §12 → CANNOT_WITHDRAW).
 *
 * @param {string} applicationId
 * @param {string} candidateId
 * @returns {object} Updated application
 */
export const withdrawApplication = async (applicationId, candidateId) => {
  const application = await Application.findOne({
    _id:       applicationId,
    candidate: candidateId,
    isDeleted: false,
  }).populate('job', 'title createdBy');

  if (!application) throwNotFound();

  // Cannot withdraw after final decisions
  if (['hired', 'rejected'].includes(application.status)) {
    throwBad(
      `Cannot withdraw an application with status '${application.status}'`,
      'CANNOT_WITHDRAW'
    );
  }

  if (application.status === 'withdrawn') {
    throwBad('Application is already withdrawn', 'CANNOT_WITHDRAW');
  }

  application.status = 'withdrawn';
  application.statusHistory.push({
    status:    'withdrawn',
    changedAt: new Date(),
    changedBy: candidateId,
  });

  await application.save();

  // Send notification to recruiter
  const candidateUser = await User.findById(candidateId).select('name');
  await createNotification({
    recipient:  application.job.createdBy,
    type:       'application_withdrawn',
    message:    `${candidateUser?.name || 'A candidate'} withdrew their application for "${application.job.title}"`,
    link:       `/applications/job/${application.job._id}`,
    icon:       'warning',
    relatedJob: application.job._id,
    relatedApp: application._id,
  });

  return application;
};

// ─── GET /applications/job/:jobId — Recruiter (paginated) ─────────────────────
/**
 * All applications for a specific job (full pipeline view).
 * Includes recruiterNotes — only for recruiter role.
 * Supports: status filter, candidate name/email search, sortBy.
 *
 * @param {string} jobId
 * @param {string} recruiterId - For job ownership verification
 * @param {object} query       - req.query
 * @returns {{ applications: Array, pagination: object }}
 */
export const getJobApplications = async (jobId, recruiterId, query) => {
  // Verify job exists and belongs to this recruiter
  const job = await Job.findOne({ _id: jobId, isDeleted: false });
  if (!job) {
    const err = new Error('Job not found');
    err.statusCode = 404; err.errorCode = 'JOB_NOT_FOUND'; throw err;
  }
  if (job.createdBy.toString() !== recruiterId) {
    throwForbidden('You can only view applications for jobs you created');
  }

  const { page, limit, skip } = paginate(query);
  const filter = { job: jobId, isDeleted: false };
  if (query.status) filter.status = query.status;

  // Build sort
  let sort = { appliedAt: -1 }; // default: latest
  if (query.sortBy === 'oldest') sort = { appliedAt: 1 };
  if (query.sortBy === 'status') sort = { status: 1, appliedAt: -1 };

  let applicationQuery = Application.find(filter)
    .select('+recruiterNotes') // explicitly include recruiterNotes for recruiter
    .populate('candidate', 'name email profile.headline profile.location profile.resumeUrl')
    .populate('job', 'title department')
    .sort(sort)
    .skip(skip)
    .limit(limit);

  // Candidate name/email search (post-populate client-side filter is inefficient at scale;
  // for V1 we use a lookup pipeline — or a pre-populate regex approach)
  // V1 implementation: fetch all matching, then filter in memory if search provided.
  // Documented as Technical Debt — V2 will use $lookup + $match.
  let applications = await applicationQuery.lean();
  let total;

  if (query.search) {
    const pattern = new RegExp(query.search, 'i');
    applications = applications.filter(
      (a) =>
        pattern.test(a.candidate?.name ?? '') ||
        pattern.test(a.candidate?.email ?? '')
    );
    total = applications.length;
    // Re-apply pagination to filtered results
    applications = applications.slice(skip, skip + limit);
  } else {
    total = await Application.countDocuments(filter);
  }

  return { applications, pagination: buildPagination(total, page, limit) };
};

// ─── GET /applications/job/:jobId/hm — Hiring Manager (paginated) ─────────────
/**
 * HM view: shortlisted + interview stage only. No recruiterNotes.
 * Scoped by department (HM's dept must match the job's dept).
 *
 * @param {string} jobId
 * @param {string} hmId  - HM user id (for dept verification)
 * @param {object} query
 * @returns {{ applications: Array, pagination: object }}
 */
export const getJobApplicationsHM = async (jobId, hmId, query) => {
  // Get HM's department
  const hm  = await User.findById(hmId).select('department');
  const job = await Job.findOne({ _id: jobId, isDeleted: false });

  if (!job) {
    const err = new Error('Job not found');
    err.statusCode = 404; err.errorCode = 'JOB_NOT_FOUND'; throw err;
  }

  if (!hm?.department || hm.department !== job.department) {
    throwForbidden('You can only view applications for jobs in your department');
  }

  const { page, limit, skip } = paginate(query);

  // HM sees only shortlisted + interview (Doc 05 §12)
  const filter = {
    job:       jobId,
    status:    { $in: ['shortlisted', 'interview'] },
    isDeleted: false,
  };

  const sort = query.sortBy === 'oldest' ? { appliedAt: 1 } : { appliedAt: -1 };

  const [applications, total] = await Promise.all([
    Application.find(filter)
      // recruiterNotes NOT selected — toJSON transform strips it even if it somehow leaks
      .populate('candidate', 'name email profile.headline profile.location')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Application.countDocuments(filter),
  ]);

  return { applications, pagination: buildPagination(total, page, limit) };
};

// ─── GET /applications/:id — Recruiter / HM ───────────────────────────────────
/**
 * Full application detail including statusHistory.
 * recruiterNotes included ONLY for recruiter role — HM receives stripped version.
 *
 * @param {string} applicationId
 * @param {{ id: string, role: string }} user - from req.user (JWT payload)
 * @returns {object} Application document
 */
export const getApplicationById = async (applicationId, user) => {
  let appQuery = Application.findOne({ _id: applicationId, isDeleted: false })
    .populate('candidate', 'name email profile')
    .populate('job', 'title department location status company');

  // Only recruiter gets recruiterNotes
  if (user.role === 'recruiter') {
    appQuery = appQuery.select('+recruiterNotes');
  }

  const application = await appQuery;
  if (!application) throwNotFound();

  // HM: additionally verify the job is in their department
  if (user.role === 'hiring_manager') {
    const hm  = await User.findById(user.id).select('department');
    const job = application.job;
    if (!hm?.department || hm.department !== job?.department) {
      throwForbidden('You can only view applications for jobs in your department');
    }
  }

  return application;
};

// ─── PATCH /applications/:id/status — Recruiter ───────────────────────────────
/**
 * Recruiter updates application status.
 * Ownership: recruiter must own the job the application belongs to.
 * Appends to statusHistory.
 *
 * @param {string} applicationId
 * @param {string} status        - New status value
 * @param {string} recruiterId
 * @returns {object} Updated application
 */
export const updateApplicationStatus = async (applicationId, status, recruiterId) => {
  const application = await Application.findOne({ _id: applicationId, isDeleted: false })
    .populate('job', 'createdBy title');

  if (!application) throwNotFound();

  // Verify the recruiter owns the job this application belongs to
  if (application.job.createdBy.toString() !== recruiterId) {
    throwForbidden('You can only manage applications for jobs you created');
  }

  // Append to history
  application.statusHistory.push({
    status,
    changedAt: new Date(),
    changedBy: recruiterId,
  });

  application.status = status;
  await application.save();

  // Send notification to candidate
  let notificationType = 'status_updated';
  let notificationIcon = 'info';
  let notificationMessage = `Your application status for "${application.job.title}" has been updated to ${status}`;

  if (status === 'hired') {
    notificationType = 'hired';
    notificationIcon = 'success';
    notificationMessage = `Congratulations! You have been hired for "${application.job.title}"`;
  } else if (status === 'rejected') {
    notificationType = 'rejected';
    notificationIcon = 'error';
    notificationMessage = `We regret to inform you that your application for "${application.job.title}" has been rejected`;
  } else if (status === 'shortlisted') {
    notificationIcon = 'success';
  }

  await createNotification({
    recipient:  application.candidate,
    type:       notificationType,
    message:    notificationMessage,
    link:       `/applications/my/${application._id}`,
    icon:       notificationIcon,
    relatedJob: application.job._id,
    relatedApp: application._id,
  });

  return application;
};

// ─── PATCH /applications/:id/notes — Recruiter ────────────────────────────────
/**
 * Recruiter adds/updates private notes on an application.
 * recruiterNotes is returned explicitly here — recruiter endpoint only.
 *
 * @param {string} applicationId
 * @param {string} recruiterNotes
 * @param {string} recruiterId
 * @returns {object} Updated application (with recruiterNotes included)
 */
export const updateRecruiterNotes = async (applicationId, recruiterNotes, recruiterId) => {
  const application = await Application.findOne({ _id: applicationId, isDeleted: false })
    .select('+recruiterNotes')
    .populate('job', 'createdBy');

  if (!application) throwNotFound();

  if (application.job.createdBy.toString() !== recruiterId) {
    throwForbidden('You can only add notes to applications for jobs you created');
  }

  application.recruiterNotes = recruiterNotes;
  await application.save();

  // Return with recruiterNotes visible — recruiter endpoint
  return application;
};

// ─── GET /applications/:id/resume — Recruiter / HM ───────────────────────────
/**
 * Returns the resume file path for streaming to the client.
 * Authorization and path resolution only — actual streaming in controller.
 *
 * @param {string} applicationId
 * @param {{ id: string, role: string }} user
 * @returns {{ resumeUrl: string, filename: string }}
 */
export const getApplicationResume = async (applicationId, user) => {
  const application = await Application.findOne({ _id: applicationId, isDeleted: false })
    .populate('job', 'createdBy department')
    .populate('candidate', 'name');

  if (!application) throwNotFound();

  if (user.role === 'recruiter' && application.job.createdBy.toString() !== user.id) {
    throwForbidden('You can only access resumes for applications on your jobs');
  }

  if (user.role === 'hiring_manager') {
    const hm = await User.findById(user.id).select('department');
    if (!hm?.department || hm.department !== application.job?.department) {
      throwForbidden('You can only access resumes for jobs in your department');
    }
  }

  return {
    resumeUrl: application.resumeUrl,
    filename:  `${application.candidate?.name ?? 'resume'}-resume`,
  };
};
