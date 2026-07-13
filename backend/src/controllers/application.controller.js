// ─── controllers/application.controller.js ────────────────────────────────────
// Thin controller layer for all application endpoints.
// No business logic here — all delegated to application.service.js.
// Doc reference: Document 5 — API Design §12 (Application Routes)

import path from 'path';
import fs   from 'fs';
import { fileURLToPath } from 'url';

import * as appService from '../services/application.service.js';
import { success, paginatedSuccess } from '../utils/apiResponse.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── POST /api/v1/applications/:jobId — Candidate apply ───────────────────────
export const applyToJob = async (req, res, next) => {
  try {
    // req.file is set by handleResumeUpload middleware (if file was uploaded)
    // Store relative path for portability (not absolute system path)
    const uploadedResumeUrl = req.file
      ? `uploads/resumes/${req.file.filename}`
      : null;

    const application = await appService.applyToJob(
      req.params.jobId,
      req.user.id,
      req.body.coverNote ?? '',
      uploadedResumeUrl
    );

    return success(res, 'Application submitted successfully', application, 201);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/v1/applications/my — Candidate (paginated) ──────────────────────
export const getMyApplications = async (req, res, next) => {
  try {
    const { applications, pagination } = await appService.getMyApplications(
      req.user.id,
      req.query
    );
    return paginatedSuccess(res, 'Your applications fetched successfully', applications, pagination);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/v1/applications/my/:applicationId — Candidate ───────────────────
export const getMyApplicationById = async (req, res, next) => {
  try {
    const application = await appService.getMyApplicationById(
      req.params.applicationId,
      req.user.id
    );
    return success(res, 'Application fetched successfully', application);
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/v1/applications/:id/withdraw — Candidate ──────────────────────
export const withdrawApplication = async (req, res, next) => {
  try {
    const application = await appService.withdrawApplication(req.params.id, req.user.id);
    return success(res, 'Application withdrawn successfully', application);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/v1/applications/job/:jobId — Recruiter (paginated) ──────────────
export const getJobApplications = async (req, res, next) => {
  try {
    const { applications, pagination } = await appService.getJobApplications(
      req.params.jobId,
      req.user.id,
      req.query
    );
    return paginatedSuccess(res, 'Job applications fetched successfully', applications, pagination);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/v1/applications/job/:jobId/hm — Hiring Manager (paginated) ──────
export const getJobApplicationsHM = async (req, res, next) => {
  try {
    const { applications, pagination } = await appService.getJobApplicationsHM(
      req.params.jobId,
      req.user.id,
      req.query
    );
    return paginatedSuccess(
      res,
      'Applications fetched successfully (shortlisted + interview)',
      applications,
      pagination
    );
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/v1/applications/:id — Recruiter / HM ───────────────────────────
export const getApplicationById = async (req, res, next) => {
  try {
    const application = await appService.getApplicationById(req.params.id, req.user);
    return success(res, 'Application fetched successfully', application);
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/v1/applications/:id/status — Recruiter ────────────────────────
export const updateApplicationStatus = async (req, res, next) => {
  try {
    const application = await appService.updateApplicationStatus(
      req.params.id,
      req.body.status,
      req.user.id
    );
    return success(res, `Application status updated to '${application.status}'`, application);
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/v1/applications/:id/notes — Recruiter ─────────────────────────
export const updateRecruiterNotes = async (req, res, next) => {
  try {
    const application = await appService.updateRecruiterNotes(
      req.params.id,
      req.body.recruiterNotes,
      req.user.id
    );
    return success(res, 'Recruiter notes updated successfully', application);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/v1/applications/:id/resume — Recruiter / HM ────────────────────
// Streams the resume file as an attachment download.
export const downloadResume = async (req, res, next) => {
  try {
    const { resumeUrl, filename } = await appService.getApplicationResume(
      req.params.id,
      req.user
    );

    // Resolve absolute path from stored relative path
    const absolutePath = path.resolve(__dirname, '../../', resumeUrl);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({
        success:   false,
        message:   'Resume file not found on server',
        errorCode: 'APPLICATION_NOT_FOUND',
      });
    }

    const ext = path.extname(resumeUrl).toLowerCase();
    res.setHeader('Content-Disposition', `attachment; filename="${filename}${ext}"`);
    res.setHeader('Content-Type', ext === '.pdf' ? 'application/pdf' :
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    return res.sendFile(absolutePath);
  } catch (err) {
    next(err);
  }
};
