// ─── components/common/Skeleton.jsx ──────────────────────────────────────────
// Reusable atomic layout loaders with pulsating animation states.

import { cn } from '../../utils/cn.js';

export function Skeleton({ variant = 'rect', width, height, className, ...props }) {
  return (
    <div
      className={cn(
        'animate-pulse bg-slate-200 dark:bg-slate-800',
        variant === 'text' && 'rounded h-4 w-3/4',
        variant === 'circular' && 'rounded-full',
        variant === 'rect' && 'rounded-md',
        variant === 'stat' && 'p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 h-28',
        variant === 'table-row' && 'flex items-center gap-4 h-12 w-full',
        className
      )}
      style={{ width, height }}
      {...props}
    >
      {variant === 'stat' && (
        <>
          <div className="h-4 bg-slate-300 dark:bg-slate-700 w-1/3 rounded" />
          <div className="h-7 bg-slate-300 dark:bg-slate-700 w-1/2 rounded" />
        </>
      )}
      {variant === 'table-row' && (
        <>
          <div className="h-8 w-8 bg-slate-300 dark:bg-slate-700 rounded-full shrink-0" />
          <div className="h-4 bg-slate-300 dark:bg-slate-700 w-1/4 rounded" />
          <div className="h-4 bg-slate-300 dark:bg-slate-700 w-1/2 rounded" />
          <div className="h-4 bg-slate-300 dark:bg-slate-700 w-1/12 rounded ml-auto" />
        </>
      )}
    </div>
  );
}
