// ─── components/jobs/CandidateRow.jsx ────────────────────────────────────────
// Semantic table row component rendering single candidate pipeline details.

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Star, Eye } from 'lucide-react';
import { cn } from '../../utils/cn.js';

// Status badge classes
const STAGE_BADGES = {
  applied: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
  under_review: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
  shortlisted: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
  interview: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-450',
  offer: 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400',
  hired: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450',
  rejected: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400',
  withdrawn: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
};

const formatStage = (st) => {
  return st.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

export const CandidateRow = React.memo(function CandidateRow({
  application,
  onViewProfile,
  onStatusUpdateClick,
}) {
  const { _id, candidate, status, appliedAt, averageScore } = application;
  const name = candidate?.name || 'Unknown Candidate';
  const email = candidate?.email || '';
  const headline = candidate?.profile?.headline || 'No headline';

  const getInitials = () => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getDaysAgo = () => {
    if (!appliedAt) return 'Recent';
    try {
      return formatDistanceToNow(new Date(appliedAt), { addSuffix: true });
    } catch (e) {
      return 'Recent';
    }
  };

  return (
    <tr className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/40 border-b border-slate-150/70 dark:border-slate-850 transition-colors">
      {/* 1. Candidate Bio */}
      <td className="py-4 pl-4 pr-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400 shrink-0 select-none">
          {getInitials()}
        </div>
        <div className="min-w-0">
          <button
            onClick={() => onViewProfile(_id)}
            className="font-bold text-slate-900 dark:text-slate-50 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left focus:outline-none"
          >
            {name}
          </button>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 block truncate max-w-xs mt-0.5">
            {headline} · {email}
          </span>
        </div>
      </td>

      {/* 2. Pipeline Stage Badge */}
      <td className="py-4 px-3">
        <span className={cn('inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full', STAGE_BADGES[status] || 'bg-slate-100 dark:bg-slate-800 text-slate-500')}>
          {formatStage(status)}
        </span>
      </td>

      {/* 3. Applied Timestamp */}
      <td className="py-4 px-3 text-slate-400 text-xs font-semibold">
        {getDaysAgo()}
      </td>

      {/* 4. Average Review Score */}
      <td className="py-4 px-3">
        {averageScore !== undefined && averageScore !== null ? (
          <div className="flex items-center gap-1 text-slate-700 dark:text-slate-350 text-xs font-bold">
            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
            <span>{averageScore.toFixed(1)}</span>
          </div>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">—</span>
        )}
      </td>

      {/* 5. Row Actions */}
      <td className="py-4 pl-3 pr-4 text-right">
        <div className="inline-flex items-center gap-2 justify-end">
          <button
            onClick={() => onViewProfile(_id)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold flex items-center gap-1.5 shadow-xs focus-ring transition-colors"
            type="button"
            title="View candidate profile"
          >
            <Eye className="w-3.5 h-3.5 text-slate-400" />
            <span>View</span>
          </button>

          <select
            value={status}
            onChange={(e) => onStatusUpdateClick(_id, e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-xs font-bold focus-ring cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
            aria-label="Update candidate stage status"
          >
            <option value="applied">Applied</option>
            <option value="under_review">Under Review</option>
            <option value="shortlisted">Shortlisted</option>
            <option value="interview">Interviewing</option>
            <option value="offer">Offered</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
        </div>
      </td>
    </tr>
  );
});
