// ─── components/jobs/PipelineStats.jsx ────────────────────────────────────────
// Modular component displaying high-level stats for the job candidate pipeline.

import React from 'react';
import { Users, UserCheck, Clock } from 'lucide-react';

export const PipelineStats = React.memo(function PipelineStats({
  totalCount = 0,
  activeCount = 0,
  hiredCount = 0,
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" role="region" aria-label="Pipeline Statistics">
      
      {/* Total Candidates */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Candidates
          </span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-slate-50">
            {totalCount}
          </span>
        </div>
      </div>

      {/* Active Pipeline */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Active in Funnel
          </span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-slate-50">
            {activeCount}
          </span>
        </div>
      </div>

      {/* Hired Candidates */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450 flex items-center justify-center shrink-0">
          <UserCheck className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Hired Candidates
          </span>
          <span className="text-xl font-extrabold text-slate-900 dark:text-slate-50">
            {hiredCount}
          </span>
        </div>
      </div>

    </div>
  );
});
