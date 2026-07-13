// ─── services/job.service.js ──────────────────────────────────────────────────
// Business logic for all job operations.
// Doc reference: Document 5 — API Design §11 (Job Routes)
//                Document 4 — Database Schema §3 (jobs)
//
// All service functions throw { message, statusCode, errorCode } on failure.
// Controllers catch and forward to next(err) → errorHandler.

import mongoose from 'mongoose';
import Job from '../models/Job.model.js';
import Company from '../models/Company.model.js';
import { paginate, buildPagination } from '../utils/paginate.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const throwNotFound = () => {
  const err = new Error('Job not found');
  err.statusCode = 404;
  err.errorCode  = 'JOB_NOT_FOUND';
  throw err;
};

const throwForbidden = (message = 'You are not authorized to perform this action') => {
  const err = new Error(message);
  err.statusCode = 403;
  err.errorCode  = 'FORBIDDEN_ROLE';
  throw err;
};

/**
 * Build a Mongoose filter object from GET /jobs query params.
 * Always scoped to { status: 'published', isDeleted: false } for public access.
 */
const buildPublicFilter = (query) => {
  const filter = { status: 'published', isDeleted: false };

  if (query.department) filter.department = query.department;
  if (query.jobType)    filter.jobType    = query.jobType;
  if (query.location)   filter.location   = { $regex: query.location, $options: 'i' };
  if (query.isRemote === 'true')  filter.isRemote = true;
  if (query.isRemote === 'false') filter.isRemote = false;

  // Full-text search on title + description
  if (query.search) {
    const pattern = { $regex: query.search, $options: 'i' };
    filter.$or = [{ title: pattern }, { description: pattern }];
  }

  return filter;
};

/**
 * Build sort object from sortBy query param.
 * Doc: sortBy = 'newest' | 'salary' | 'location'
 */
const buildSort = (sortBy) => {
  switch (sortBy) {
    case 'salary':   return { salaryMin: -1, createdAt: -1 };
    case 'location': return { location: 1,  createdAt: -1 };
    default:         return { createdAt: -1 }; // newest (default)
  }
};

// ─── GET /jobs — Public (paginated, filtered, sorted) ─────────────────────────
/**
 * @param {object} query - req.query
 * @returns {{ jobs: Array, pagination: object }}
 */
export const getJobs = async (query) => {
  const { page, limit, skip } = paginate(query);
  const filter = buildPublicFilter(query);
  const sort   = buildSort(query.sortBy);

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate('company', 'name logoUrl location')
      .populate('createdBy', 'name')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Job.countDocuments(filter),
  ]);

  return { jobs, pagination: buildPagination(total, page, limit) };
};

// ─── GET /jobs/:jobId — Public ────────────────────────────────────────────────
/**
 * @param {string} jobId - MongoDB ObjectId string
 * @returns {object} Job document
 * @throws 404 JOB_NOT_FOUND
 */
export const getJobById = async (jobId) => {
  const job = await Job.findOne({ _id: jobId, isDeleted: false })
    .populate('company', 'name logoUrl website location industry')
    .populate('createdBy', 'name');

  if (!job) throwNotFound();
  return job;
};

// ─── POST /jobs — Recruiter ───────────────────────────────────────────────────
/**
 * @param {object} payload  - Validated job fields from req.body
 * @param {string} userId   - Recruiter's _id from req.user.id
 * @returns {object} Created job document
 * @throws 400 SALARY_RANGE_INVALID (from pre-save hook)
 * @throws 400 DEADLINE_IN_PAST
 */
export const createJob = async (payload, userId) => {
  // V1 design: jobs are always linked to the single platform company
  const company = await Company.findOne({ isDeleted: false });
  if (!company) {
    const err = new Error('No company profile exists. Create a company before posting jobs.');
    err.statusCode = 400;
    err.errorCode  = 'COMPANY_NOT_FOUND';
    throw err;
  }

  // Validate applicationDeadline is a future date (Doc 04 §8)
  if (payload.applicationDeadline) {
    const deadline = new Date(payload.applicationDeadline);
    if (deadline <= new Date()) {
      const err = new Error('Application deadline must be a future date');
      err.statusCode = 400;
      err.errorCode  = 'DEADLINE_IN_PAST';
      throw err;
    }
  }

  // Pre-save hook handles salaryMax >= salaryMin check
  const job = await Job.create({
    ...payload,
    company:   company._id,
    createdBy: userId,
  });

  return job;
};

// ─── PATCH /jobs/:jobId — Recruiter (partial update) ──────────────────────────
/**
 * Only the recruiter who created the job can update it (ownership check).
 *
 * @param {string} jobId   - MongoDB ObjectId string
 * @param {object} payload - Partial fields to update
 * @param {string} userId  - Recruiter's _id
 * @returns {object} Updated job document
 * @throws 404 JOB_NOT_FOUND | 403 FORBIDDEN_ROLE | 400 SALARY_RANGE_INVALID
 */
export const updateJob = async (jobId, payload, userId) => {
  const job = await Job.findOne({ _id: jobId, isDeleted: false });
  if (!job) throwNotFound();

  // Ownership check — only the creating recruiter can edit
  if (job.createdBy.toString() !== userId) {
    throwForbidden('You can only edit jobs that you created.');
  }

  // Validate future deadline if being updated
  if (payload.applicationDeadline) {
    const deadline = new Date(payload.applicationDeadline);
    if (deadline <= new Date()) {
      const err = new Error('Application deadline must be a future date');
      err.statusCode = 400;
      err.errorCode  = 'DEADLINE_IN_PAST';
      throw err;
    }
  }

  // Apply only provided fields (PATCH semantics)
  const allowedFields = [
    'title', 'department', 'location', 'jobType', 'isRemote',
    'experienceLevel', 'description', 'salaryMin', 'salaryMax',
    'applicationDeadline', 'status',
  ];

  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) {
      job[field] = payload[field];
    }
  });

  // pre('save') will re-validate salaryMax >= salaryMin
  await job.save();
  return job;
};

// ─── PATCH /jobs/:jobId/status — Recruiter ────────────────────────────────────
/**
 * Update only the status field. Ownership required.
 *
 * @param {string} jobId   - MongoDB ObjectId string
 * @param {string} status  - New status value
 * @param {string} userId  - Recruiter's _id
 * @returns {object} Updated job document
 * @throws 404 JOB_NOT_FOUND | 403 FORBIDDEN_ROLE
 */
export const updateJobStatus = async (jobId, status, userId) => {
  const job = await Job.findOne({ _id: jobId, isDeleted: false });
  if (!job) throwNotFound();

  if (job.createdBy.toString() !== userId) {
    throwForbidden('You can only change the status of jobs that you created.');
  }

  job.status = status;
  await job.save();
  return job;
};

// ─── DELETE /jobs/:jobId — Recruiter (soft-delete) ────────────────────────────
/**
 * Sets isDeleted = true. Document is never physically removed.
 * Ownership required.
 *
 * @param {string} jobId  - MongoDB ObjectId string
 * @param {string} userId - Recruiter's _id
 * @throws 404 JOB_NOT_FOUND | 403 FORBIDDEN_ROLE
 */
export const deleteJob = async (jobId, userId) => {
  const job = await Job.findOne({ _id: jobId, isDeleted: false });
  if (!job) throwNotFound();

  if (job.createdBy.toString() !== userId) {
    throwForbidden('You can only delete jobs that you created.');
  }

  job.isDeleted = true;
  await job.save();
  // Returns nothing — controller sends 200 with a message
};

// ─── GET /jobs/recruiter/all — Recruiter (paginated, all statuses) ────────────
/**
 * Returns all non-deleted jobs created by the authenticated recruiter.
 * Shows all statuses (draft, published, closed, archived).
 *
 * @param {string} userId - Recruiter's _id
 * @param {object} query  - req.query (pagination + optional filters)
 * @returns {{ jobs: Array, pagination: object }}
 */
export const getRecruiterJobs = async (userId, query) => {
  const { page, limit, skip } = paginate(query);
  const sort = buildSort(query.sortBy);

  const filter = { createdBy: userId, isDeleted: false };
  if (query.status) filter.status = query.status;

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate('company', 'name logoUrl')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Job.countDocuments(filter),
  ]);

  return { jobs, pagination: buildPagination(total, page, limit) };
};

// ─── GET /jobs/hiring-manager/assigned — Hiring Manager (dept-scoped) ─────────
/**
 * Returns published jobs in the HM's department (from User.department field).
 * Only shows published + non-deleted jobs.
 *
 * @param {string} department - Authenticated HM's department from User doc
 * @param {object} query      - req.query (pagination)
 * @returns {{ jobs: Array, pagination: object }}
 */
export const getHMJobs = async (department, query) => {
  const { page, limit, skip } = paginate(query);

  // HM sees published jobs in their department
  const filter = {
    department,
    status:    'published',
    isDeleted: false,
  };

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate('company', 'name logoUrl')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Job.countDocuments(filter),
  ]);

  return { jobs, pagination: buildPagination(total, page, limit) };
};
