// ─── controllers/job.controller.js ────────────────────────────────────────────
// Thin controller layer for all job endpoints.
// No business logic here — all delegated to job.service.js.
// Doc reference: Document 5 — API Design §11 (Job Routes)

import * as jobService from '../services/job.service.js';
import User from '../models/User.model.js';
import { success, paginatedSuccess } from '../utils/apiResponse.js';

// ─── GET /api/v1/jobs — Public (paginated, filtered, sorted) ──────────────────
export const getJobs = async (req, res, next) => {
  try {
    const { jobs, pagination } = await jobService.getJobs(req.query);
    return paginatedSuccess(res, 'Jobs fetched successfully', jobs, pagination);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/v1/jobs/:jobId — Public ─────────────────────────────────────────
export const getJobById = async (req, res, next) => {
  try {
    const job = await jobService.getJobById(req.params.jobId);
    return success(res, 'Job fetched successfully', job);
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/v1/jobs — Recruiter ────────────────────────────────────────────
export const createJob = async (req, res, next) => {
  try {
    const job = await jobService.createJob(req.body, req.user.id);
    return success(res, 'Job created successfully', job, 201);
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/v1/jobs/:jobId — Recruiter (partial update) ───────────────────
export const updateJob = async (req, res, next) => {
  try {
    const job = await jobService.updateJob(req.params.jobId, req.body, req.user.id);
    return success(res, 'Job updated successfully', job);
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/v1/jobs/:jobId/status — Recruiter ─────────────────────────────
export const updateJobStatus = async (req, res, next) => {
  try {
    const job = await jobService.updateJobStatus(req.params.jobId, req.body.status, req.user.id);
    return success(res, `Job status updated to '${job.status}'`, job);
  } catch (err) {
    next(err);
  }
};

// ─── DELETE /api/v1/jobs/:jobId — Recruiter (soft-delete) ─────────────────────
export const deleteJob = async (req, res, next) => {
  try {
    await jobService.deleteJob(req.params.jobId, req.user.id);
    return success(res, 'Job deleted successfully', null);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/v1/jobs/recruiter/all — Recruiter (paginated, all statuses) ──────
export const getRecruiterJobs = async (req, res, next) => {
  try {
    const { jobs, pagination } = await jobService.getRecruiterJobs(req.user.id, req.query);
    return paginatedSuccess(res, "Recruiter's jobs fetched successfully", jobs, pagination);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/v1/jobs/hiring-manager/assigned — Hiring Manager ────────────────
// Needs HM's department — fetched from the User document.
// req.user only carries { id, role } from JWT — we must DB-fetch for department.
export const getHMJobs = async (req, res, next) => {
  try {
    const hmUser = await User.findById(req.user.id).select('department');

    if (!hmUser || !hmUser.department) {
      const err = new Error('Hiring manager department not set. Please update your profile.');
      err.statusCode = 400;
      err.errorCode  = 'DEPARTMENT_NOT_SET';
      throw err;
    }

    const { jobs, pagination } = await jobService.getHMJobs(hmUser.department, req.query);
    return paginatedSuccess(res, 'Assigned jobs fetched successfully', jobs, pagination);
  } catch (err) {
    next(err);
  }
};
