// ─── controllers/user.controller.js ──────────────────────────────────────────
// Thin controller layer for candidate profile editing, resume upload, and saved jobs.
// No business logic here — all delegated to user.service.js.
// Doc reference: Document 5 — API Design §9 (User / Profile Routes)

import * as userService from '../services/user.service.js';
import { success, paginatedSuccess } from '../utils/apiResponse.js';

// ─── PUT /api/v1/users/profile ───────────────────────────────────────────────
export const updateProfile = async (req, res, next) => {
  try {
    const user = await userService.updateProfile(req.user.id, req.body);
    return success(res, 'Profile updated successfully', user);
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/v1/users/resume ───────────────────────────────────────────────
export const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('No resume file uploaded');
      err.statusCode = 400;
      err.errorCode  = 'VALIDATION_ERROR';
      throw err;
    }

    const user = await userService.uploadResume(req.user.id, req.file.filename);
    return success(res, 'Resume uploaded successfully', {
      resumeUrl: user.profile.resumeUrl,
      profile:   user.profile,
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/v1/users/saved-jobs/:jobId ────────────────────────────────────
export const saveJob = async (req, res, next) => {
  try {
    const savedJobs = await userService.saveJob(req.user.id, req.params.jobId);
    return success(res, 'Job saved successfully', savedJobs);
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/v1/users/saved-jobs/:jobId ──────────────────────────────────
export const unsaveJob = async (req, res, next) => {
  try {
    const savedJobs = await userService.unsaveJob(req.user.id, req.params.jobId);
    return success(res, 'Job unsaved successfully', savedJobs);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/v1/users/saved-jobs ────────────────────────────────────────────
export const getSavedJobs = async (req, res, next) => {
  try {
    const { jobs, pagination } = await userService.getSavedJobs(req.user.id, req.query);
    return paginatedSuccess(res, 'Saved jobs fetched successfully', jobs, pagination);
  } catch (err) {
    next(err);
  }
};
