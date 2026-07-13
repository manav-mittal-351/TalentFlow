// ─── components/common/StatCard.jsx ──────────────────────────────────────────
// Reusable metric card dashboard widget. Supports light/dark mode,
// dynamic styling themes, and loading states.

import React from 'react';
import { cn } from '../../utils/cn.js';

export const StatCard = React.memo(function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'indigo',
}) {
  const colorClasses = {
    indigo: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400',
      badge: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    },
    cyan: {
      bg: 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-100 dark:border-cyan-900/30 text-cyan-600 dark:text-cyan-400',
      badge: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/30 text-amber-600 dark:text-amber-450',
      badge: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-450',
    },
    green: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-450',
      badge: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-450',
    },
  };

  const activeColors = colorClasses[color] || colorClasses.indigo;

  return (
    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 hover:shadow-md hover:-translate-y-[2px] flex items-center justify-between gap-4">
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
          {title}
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            {value !== undefined ? value : 0}
          </span>
          {trend && (
            <span
              className={cn(
                'inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded',
                activeColors.badge
              )}
            >
              {trend}
            </span>
          )}
        </div>
      </div>

      {Icon && (
        <div
          className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center border shrink-0',
            activeColors.bg
          )}
          aria-hidden="true"
        >
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
});
