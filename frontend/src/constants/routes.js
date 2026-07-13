// ─── constants/routes.js ──────────────────────────────────────────────────────
// Route path constants matching client-side React Router routing structure.
// Document reference: Document 10 — Route Structure §2

export const ROUTES = {
  // Public
  HOME:           '/',
  JOBS:           '/jobs',
  JOB_DETAIL:     '/jobs/:jobId',
  LOGIN:          '/login',
  REGISTER:       '/register',
  SEARCH:         '/search',

  // Candidate
  CANDIDATE: {
    DASHBOARD:          '/candidate/dashboard',
    APPLICATIONS:       '/candidate/applications',
    APPLICATION_DETAIL: '/candidate/applications/:applicationId',
    SAVED_JOBS:         '/candidate/saved-jobs',
    PROFILE:            '/candidate/profile',
    NOTIFICATIONS:      '/candidate/notifications',
  },

  // Recruiter
  RECRUITER: {
    DASHBOARD:          '/recruiter/dashboard',
    JOBS:               '/recruiter/jobs',
    JOB_NEW:            '/recruiter/jobs/new',
    JOB_EDIT:           '/recruiter/jobs/:jobId/edit',
    JOB_PIPELINE:       '/recruiter/jobs/:jobId',
    CANDIDATE_DETAIL:   '/recruiter/candidates/:candidateId',
    INTERVIEWS:         '/recruiter/interviews',
    COMPANY:            '/recruiter/company',
    NOTIFICATIONS:      '/recruiter/notifications',
  },

  // Hiring Manager
  HM: {
    DASHBOARD:          '/hiring-manager/dashboard',
    JOBS:               '/hiring-manager/jobs',
    JOB_PIPELINE:       '/hiring-manager/jobs/:jobId',
    CANDIDATE_DETAIL:   '/hiring-manager/candidates/:candidateId',
    NOTIFICATIONS:      '/hiring-manager/notifications',
  },

  // Utility
  UNAUTHORIZED:   '/unauthorized',
  NOT_FOUND:      '*',
};

Object.freeze(ROUTES);
