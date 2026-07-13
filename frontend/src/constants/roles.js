// ─── constants/roles.js ───────────────────────────────────────────────────────
// System user role names. Matches backend roles and verifyToken checks.

export const ROLES = {
  RECRUITER:      'recruiter',
  HIRING_MANAGER: 'hiring_manager',
  CANDIDATE:      'candidate',
};

Object.freeze(ROLES);
