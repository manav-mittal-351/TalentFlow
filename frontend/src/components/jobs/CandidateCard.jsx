// ─── components/jobs/CandidateCard.jsx ────────────────────────────────────────
// Responsive card component layout displaying candidate status statistics for mobiles/tablets.

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Star, Eye, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn.js';

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

export const CandidateCard = React.memo(function CandidateCard({
  application,
  onViewProfile,
  onStatusUpdateClick,
  activeMenuId,
  onToggleMenu,
}) {
  const { _id, candidate, status, appliedAt, averageScore } = application;
  const name = candidate?.name || 'Unknown Candidate';
  const email = candidate?.email || '';
  const headline = candidate?.profile?.headline || 'No headline';
  const isMenuOpen = activeMenuId === _id;

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
    <div className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex flex-col gap-4">
      {/* Top row: Avatar + Name and bookmark actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center font-bold text-xs text-indigo-600 dark:text-indigo-400 shrink-0">
            {getInitials()}
          </div>
          <div className="min-w-0">
            <button
              onClick={() => onViewProfile(_id)}
              className="font-bold text-slate-900 dark:text-slate-50 hover:underline text-left text-sm"
            >
              {name}
            </button>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block truncate max-w-[180px]">
              {headline} · {getDaysAgo()}
            </span>
          </div>
        </div>

        {averageScore !== undefined && averageScore !== null && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-950 text-slate-755 dark:text-slate-250 border border-slate-100 dark:border-slate-800 text-[10px] font-bold">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            <span>{averageScore.toFixed(1)}</span>
          </div>
        )}
      </div>

      <span className="text-[11px] text-slate-400 block truncate">
        {email}
      </span>

      {/* Action panel triggers */}
      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
        <span className={cn('inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full', STAGE_BADGES[status] || 'bg-slate-100 dark:bg-slate-800 text-slate-500')}>
          {formatStage(status)}
        </span>

        <div className="flex items-center gap-1.5 relative">
          <button
            onClick={() => onViewProfile(_id)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold"
            type="button"
            aria-label="View profile"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => onToggleMenu(_id)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold flex items-center gap-1"
            aria-expanded={isMenuOpen}
            type="button"
          >
            <span>Status</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => onToggleMenu(null)} />
              <div className="absolute right-0 bottom-8 mt-1 w-44 rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg z-50 py-1 flex flex-col text-left">
                {Object.keys(STAGE_BADGES).map((stageKey) => (
                  <button
                    key={stageKey}
                    onClick={() => onStatusUpdateClick(_id, stageKey)}
                    className={cn(
                      'px-3 py-1.5 text-xs text-slate-700 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-800 text-left w-full',
                      status === stageKey && 'text-indigo-650 dark:text-indigo-400 bg-indigo-50/10'
                    )}
                    type="button"
                  >
                    {formatStage(stageKey)}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
});
