// ─── components/layout/PageHeader.jsx ─────────────────────────────────────────
// Layout block rendering page title headings and dashboard operation actions.

import { cn } from '../../utils/cn.js';

export function PageHeader({ title, description, actions, className, ...props }) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-200/60 dark:border-slate-800/60',
        className
      )}
      {...props}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-3 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
