// ─── constants/statuses.js ────────────────────────────────────────────────────
// Enum list constraints for jobs, application pipelines, and interviews.
// Matches backend schemas.

export const JOB_STATUSES = ['draft', 'published', 'closed', 'archived'];

export const APPLICATION_STATUSES = [
  'applied',
  'shortlisted',
  'interviewing',
  'offered',
  'hired',
  'rejected',
  'withdrawn',
];

export const INTERVIEW_STATUSES = ['scheduled', 'completed', 'cancelled'];
export const INTERVIEW_FORMATS  = ['video', 'phone', 'in-person'];

export const DEPARTMENTS = [
  'Engineering',
  'Design',
  'Marketing',
  'Sales',
  'HR',
  'Finance',
];

export const RECOMMENDATIONS = ['strong_hire', 'hire', 'no_hire', 'strong_no_hire'];
