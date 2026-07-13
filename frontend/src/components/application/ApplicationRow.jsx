// ─── components/application/ApplicationRow.jsx ──────────────────────────────
// Reusable component representing a single candidate application.
// Supports status badges, formatting relative dates, and withdraw action handlers.

import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, Calendar, Trash2, ArrowRight } from 'lucide-react';
import { getStatusBadgeClass, getStatusLabel } from '../../utils/statusBadge.js';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../utils/cn.js';

export const ApplicationRow = React.memo(function ApplicationRow({
  application,
  onWithdraw,
  isPending = false,
}) {
  const { _id, job, status, appliedAt } = application;
  const jobTitle = job?.title || 'Position';
  const companyName = job?.company?.name || 'TalentFlow';
  const location = job?.location || 'Office';
  const jobType = job?.jobType || 'full-time';

  const isWithdrawn = status === 'withdrawn';
  const isInactive = ['rejected', 'hired', 'withdrawn'].includes(status);

  const getAppliedDate = () => {
    if (!appliedAt) return 'Recent';
    try {
      return formatDistanceToNow(new Date(appliedAt), { addSuffix: true });
    } catch (e) {
      return 'Recent';
    }
  };

  return (
    <div
      className={cn(
        'group bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl p-5 hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden',
        isWithdrawn && 'opacity-60 bg-slate-50/50 dark:bg-slate-900/30'
      )}
    >
      {/* Job Title and Metadata */}
      <div className="space-y-2 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/candidate/applications/${_id}`}
            className="text-sm font-bold text-slate-850 dark:text-slate-100 hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors focus:outline-none"
          >
            {jobTitle}
          </Link>
          <span className="text-slate-400 dark:text-slate-500 font-semibold text-xs">at</span>
          <span className="text-xs font-bold text-slate-750 dark:text-slate-250">
            {companyName}
          </span>
        </div>

        {/* Info badges */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-450 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{location}</span>
          </span>
          <span className="flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5 text-slate-400" />
            <span className="capitalize">{jobType.replace('-', ' ')}</span>
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Applied {getAppliedDate()}</span>
          </span>
        </div>
      </div>

      {/* Status & Actions Section */}
      <div className="flex items-center justify-between sm:justify-end gap-3.5 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-850 shrink-0">
        
        {/* Status Badge */}
        <span className={cn('shrink-0', getStatusBadgeClass(status))}>
          {getStatusLabel(status)}
        </span>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Detailed view link */}
          <Link
            to={`/candidate/applications/${_id}`}
            className="p-2 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-indigo-600 rounded-xl transition-colors focus-ring flex items-center justify-center shrink-0"
            title="View Application Progress"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>

          {/* Withdraw Shortcut */}
          {!isInactive && onWithdraw && (
            <button
              onClick={() => onWithdraw(_id, jobTitle)}
              disabled={isPending}
              className="p-2 border border-rose-100 dark:border-rose-900/30 hover:bg-rose-50/10 text-rose-500 hover:text-rose-600 rounded-xl transition-colors focus-ring flex items-center justify-center shrink-0 disabled:opacity-40"
              title="Withdraw Application"
              type="button"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
