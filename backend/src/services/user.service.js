// ─── services/user.service.js ────────────────────────────────────────────────
// Business logic for candidate profile editing, resume upload, and saved jobs.
// Doc reference: Document 5 — API Design §9 (User / Profile Routes)
//                Document 4 — Database Schema §1 (users fields & constraints)

import User from '../models/User.model.js';
import Job  from '../models/Job.model.js';
import { paginate, buildPagination } from '../utils/paginate.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const throwNotFound = (message = 'User not found', code = 'USER_NOT_FOUND') => {
  const err = new Error(message);
  err.statusCode = 404;
  err.errorCode  = code;
  throw err;
};

/**
 * Recalculates candidate profile completeness automatically based on schema criteria:
 * requires: resumeUrl, headline, phone, location.
 *
 * @param {object} profile - candidate's profile sub-document
 * @returns {boolean}
 */
const checkCompleteness = (profile) => {
  return !!(
    profile.resumeUrl &&
    profile.headline &&
    profile.phone &&
    profile.location
  );
};

// ─── PUT /users/profile ───────────────────────────────────────────────────────
/**
 * Updates candidate profile fields (partial update).
 * Re-evaluates profile completeness automatically.
 *
 * @param {string} candidateId
 * @param {object} updates - key-value pairs of candidate profile fields
 * @returns {Promise<object>} Updated User document
 */
export const updateProfile = async (candidateId, updates) => {
  const user = await User.findById(candidateId);
  if (!user) throwNotFound();

  // Allowed profile fields
  const ALLOWED = ['headline', 'bio', 'phone', 'location', 'portfolioUrl', 'githubUrl', 'linkedinUrl'];

  for (const field of ALLOWED) {
    if (updates[field] !== undefined) {
      user.profile[field] = updates[field];
    }
  }

  // Update isProfileComplete flag
  user.profile.isProfileComplete = checkCompleteness(user.profile);

  await user.save();
  return user;
};

// ─── POST /users/resume ───────────────────────────────────────────────────────
/**
 * Saves explicit uploaded resume filename as resumeUrl.
 * Re-evaluates profile completeness automatically.
 *
 * @param {string} candidateId
 * @param {string} filename - relative uploaded file name
 * @returns {Promise<object>} Updated User document
 */
export const uploadResume = async (candidateId, filename) => {
  const user = await User.findById(candidateId);
  if (!user) throwNotFound();

  user.profile.resumeUrl = `uploads/resumes/${filename}`;
  user.profile.isProfileComplete = checkCompleteness(user.profile);

  await user.save();
  return user;
};

// ─── POST /users/saved-jobs/:jobId ────────────────────────────────────────────
/**
 * Adds job to candidate's savedJobs array using Mongoose $addToSet to avoid duplicates.
 *
 * @param {string} candidateId
 * @param {string} jobId
 * @returns {Promise<Array>} Updated list of savedJobs IDs
 */
export const saveJob = async (candidateId, jobId) => {
  // Confirm job exists and is active
  const job = await Job.findOne({ _id: jobId, status: 'published', isDeleted: false });
  if (!job) {
    const err = new Error('Job not found or unavailable');
    err.statusCode = 404;
    err.errorCode  = 'JOB_NOT_FOUND';
    throw err;
  }

  const user = await User.findByIdAndUpdate(
    candidateId,
    { $addToSet: { savedJobs: jobId } },
    { new: true }
  ).select('savedJobs');

  if (!user) throwNotFound();

  return user.savedJobs;
};

// ─── DELETE /users/saved-jobs/:jobId ──────────────────────────────────────────
/**
 * Removes job from candidate's savedJobs array using Mongoose $pull.
 *
 * @param {string} candidateId
 * @param {string} jobId
 * @returns {Promise<Array>} Updated list of savedJobs IDs
 */
export const unsaveJob = async (candidateId, jobId) => {
  const user = await User.findByIdAndUpdate(
    candidateId,
    { $pull: { savedJobs: jobId } },
    { new: true }
  ).select('savedJobs');

  if (!user) throwNotFound();

  return user.savedJobs;
};

// ─── GET /users/saved-jobs ───────────────────────────────────────────────────
/**
 * Retrieves paginated list of saved jobs.
 * Excludes deleted or unpublished jobs automatically.
 *
 * @param {string} candidateId
 * @param {object} query - req.query
 * @returns {Promise<{ jobs: Array, pagination: object }>}
 */
export const getSavedJobs = async (candidateId, query) => {
  const user = await User.findById(candidateId).select('savedJobs');
  if (!user) throwNotFound();

  const savedJobIds = user.savedJobs || [];

  const { page, limit, skip } = paginate(query);
  const filter = {
    _id:       { $in: savedJobIds },
    status:    'published',
    isDeleted: false,
  };

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate('company', 'name logoUrl location')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Job.countDocuments(filter),
  ]);

  return {
    jobs,
    pagination: buildPagination(total, page, limit),
  };
};
