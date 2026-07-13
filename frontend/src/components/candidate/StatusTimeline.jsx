// ─── components/candidate/StatusTimeline.jsx ───────────────────────────────────
// Reusable status history log timeline tracking candidate stage transitions.

import React from 'react';
import { format } from 'date-fns';
import { Calendar, RefreshCw } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const STAGE_LABELS = {
  applied: 'Applied',
  under_review: 'Under Review',
  shortlisted: 'Shortlisted',
  interview: 'Interviewing',
  offer: 'Offer Extended',
  hired: 'Officially Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

const STAGE_COLORS = {
  applied: 'bg-indigo-500',
  under_review: 'bg-purple-500',
  shortlisted: 'bg-cyan-500',
  interview: 'bg-amber-500',
  offer: 'bg-pink-500',
  hired: 'bg-emerald-500',
  rejected: 'bg-rose-500',
  withdrawn: 'bg-slate-400',
};

export const StatusTimeline = React.memo(function StatusTimeline({ statusHistory = [], currentStatus = '' }) {
  // Sort history newest first so the latest transition is shown at the top of the timeline
  const sortedHistory = [...statusHistory].sort(
    (a, b) => new Date(b.changedAt || 0) - new Date(a.changedAt || 0)
  );

  const getFormattedTime = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      return format(new Date(dateStr), 'MMM d, yyyy · h:mm a');
    } catch (e) {
      return 'Recent';
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800/80">
        <RefreshCw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>Application Activity Log</span>
      </div>

      {sortedHistory.length === 0 ? (
        <div className="flex items-center gap-2 pl-2 py-1.5">
          <div className={cn('w-2 h-2 rounded-full shrink-0', STAGE_COLORS[currentStatus] || 'bg-slate-400')} />
          <div className="text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {STAGE_LABELS[currentStatus] || currentStatus}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
              Current stage status
            </span>
          </div>
        </div>
      ) : (
        <div className="relative pl-4 space-y-5 border-l border-slate-150 dark:border-slate-800 ml-1.5 py-1">
          {sortedHistory.map((item, index) => {
            const isLatest = index === 0;
            const stageKey = item.status;
            
            return (
              <div key={index} className="relative space-y-1">
                {/* Timeline node circle */}
                <div
                  className={cn(
                    'absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 shrink-0 transition-all',
                    STAGE_COLORS[stageKey] || 'bg-slate-400',
                    isLatest && 'ring-4 ring-indigo-500/10 scale-110'
                  )}
                />
                
                <div className="text-xs">
                  <span className={cn('font-bold', isLatest ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-450')}>
                    {STAGE_LABELS[stageKey] || stageKey}
                  </span>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{getFormattedTime(item.changedAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
