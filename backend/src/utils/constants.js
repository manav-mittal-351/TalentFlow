// ─── utils/constants.js ───────────────────────────────────────────────────────
// Single source of truth for all enum values used across models, validators,
// and business logic. Prevents typo-driven bugs and keeps enums in sync
// with Document 4 — Database Schema.

// ─── User roles ───────────────────────────────────────────────────────────────
export const ROLES = Object.freeze({
  RECRUITER:       'recruiter',
  HIRING_MANAGER:  'hiring_manager',
  CANDIDATE:       'candidate',
});

export const ROLE_VALUES = Object.values(ROLES);

// ─── Departments (shared: User.department, Job.department) ────────────────────
export const DEPARTMENTS = Object.freeze([
  'Engineering',
  'Design',
  'Marketing',
  'Sales',
  'HR',
  'Finance',
]);

// ─── Job enums ────────────────────────────────────────────────────────────────
export const JOB_STATUSES = Object.freeze(['draft', 'published', 'closed', 'archived']);

export const JOB_TYPES = Object.freeze(['full-time', 'part-time', 'contract', 'remote']);

export const EXPERIENCE_LEVELS = Object.freeze(['entry', 'mid', 'senior', 'lead']);

// ─── Application pipeline ─────────────────────────────────────────────────────
export const APPLICATION_STATUSES = Object.freeze([
  'applied',
  'under_review',
  'shortlisted',
  'interview',
  'offer',
  'hired',
  'rejected',
  'withdrawn',
]);

// ─── Interview ────────────────────────────────────────────────────────────────
export const INTERVIEW_FORMATS  = Object.freeze(['in-person', 'video', 'phone']);
export const INTERVIEW_STATUSES = Object.freeze(['scheduled', 'completed', 'cancelled']);

// ─── Feedback ─────────────────────────────────────────────────────────────────
export const FEEDBACK_RECOMMENDATIONS = Object.freeze(['hire', 'reject', 'hold']);

// ─── Notifications ────────────────────────────────────────────────────────────
export const NOTIFICATION_TYPES = Object.freeze([
  'application_received',
  'status_updated',
  'interview_scheduled',
  'interview_completed',
  'interview_cancelled',
  'feedback_submitted',
  'application_withdrawn',
  'hired',
  'rejected',
]);

export const NOTIFICATION_ICONS = Object.freeze(['success', 'info', 'warning', 'error']);
