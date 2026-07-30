// ─── utils/notificationRoute.js ─────────────────────────────────────────────
// Centralized notification router helper. Maps notification documents and
// role contexts to valid client-side React Router paths.
// Fixes 404 errors caused by legacy backend route links.

/**
 * Resolves a valid client-side route path for a notification object.
 *
 * @param {object} notif - Notification document
 * @param {string} userRole - 'candidate' | 'recruiter' | 'hiring_manager'
 * @returns {string} Target client-side URL path
 */
export function getNotificationTargetUrl(notif, userRole = 'candidate') {
  if (!notif) return '/';

  const link = typeof notif.link === 'string' ? notif.link : '';

  // Valid client-side route prefixes
  const VALID_PREFIXES = ['/candidate/', '/recruiter/', '/hiring-manager/', '/jobs/'];
  const isValidClientRoute = VALID_PREFIXES.some((prefix) => link.startsWith(prefix));

  if (isValidClientRoute) {
    return link;
  }

  // Extract entity IDs (handles populated objects or plain string ObjectIds)
  const appId = notif.relatedApp?._id || (typeof notif.relatedApp === 'string' ? notif.relatedApp : null);
  const jobId = notif.relatedJob?._id || (typeof notif.relatedJob === 'string' ? notif.relatedJob : null);

  if (userRole === 'candidate') {
    if (appId) return `/candidate/applications/${appId}`;
    if (jobId) return `/jobs/${jobId}`;
    return '/candidate/dashboard';
  }

  if (userRole === 'recruiter') {
    if (appId) return `/recruiter/candidates/${appId}`;
    if (jobId) return `/recruiter/jobs/${jobId}`;
    return '/recruiter/dashboard';
  }

  if (userRole === 'hiring_manager') {
    if (appId) return `/hiring-manager/candidates/${appId}`;
    if (jobId) return `/hiring-manager/jobs/${jobId}`;
    return '/hiring-manager/dashboard';
  }

  return '/';
}
