// ─── utils/statusBadge.js ──────────────────────────────────────────────────────
// Centralised application status badge helpers shared across all dashboard,
// pipeline, and application list views.
// Eliminates duplicate switch/case blocks in CandidateDashboard, ApplicationsPage,
// JobPipelinePage, and CandidateDetailPage.

/**
 * Returns Tailwind CSS class string for an application status badge pill.
 * @param {string} status - Application status key
 * @returns {string} Tailwind class string
 */
export function getStatusBadgeClass(status) {
  const base = 'inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded';
  switch (status) {
    case 'applied':
      return `${base} bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400`;
    case 'under_review':
      return `${base} bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400`;
    case 'shortlisted':
      return `${base} bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400`;
    case 'interviewing':
    case 'interview':
      return `${base} bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-450`;
    case 'offered':
    case 'offer':
      return `${base} bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400`;
    case 'hired':
      return `${base} bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450`;
    case 'rejected':
      return `${base} bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400`;
    case 'withdrawn':
      return `${base} bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400`;
    case 'scheduled':
      return `${base} bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400`;
    case 'completed':
      return `${base} bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450`;
    case 'cancelled':
      return `${base} bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400`;
    default:
      return `${base} bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400`;
  }
}

/**
 * Returns a human-readable label for a status key.
 * @param {string} status
 * @returns {string}
 */
export function getStatusLabel(status) {
  const labels = {
    applied:      'Applied',
    under_review: 'Under Review',
    shortlisted:  'Shortlisted',
    interviewing: 'Interviewing',
    interview:    'Interviewing',
    offered:      'Offer Received',
    offer:        'Offer Received',
    hired:        'Hired',
    rejected:     'Rejected',
    withdrawn:    'Withdrawn',
    scheduled:    'Scheduled',
    completed:    'Completed',
    cancelled:    'Cancelled',
  };
  return labels[status] || status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Returns a hex color code for a status key (used in charts/pies).
 * @param {string} status
 * @returns {string} hex color
 */
export function getStatusColor(status) {
  const colors = {
    applied:      '#6366f1',
    under_review: '#a855f7',
    shortlisted:  '#06b6d4',
    interviewing: '#f59e0b',
    interview:    '#f59e0b',
    offered:      '#ec4899',
    offer:        '#ec4899',
    hired:        '#10b981',
    rejected:     '#ef4444',
    withdrawn:    '#64748b',
  };
  return colors[status] || '#94a3b8';
}
