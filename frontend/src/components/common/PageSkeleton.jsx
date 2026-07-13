// ─── components/common/PageSkeleton.jsx ──────────────────────────────────────
// Reusable skeleton mockup representing a loading dashboard screen template.
// Document reference: Document 10 — Route Structure §5

import { Skeleton } from './Skeleton.jsx';

export function PageSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" aria-hidden="true">
      {/* 1. Header Row */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant="text" width="180px" height="24px" />
          <Skeleton variant="text" width="280px" height="16px" />
        </div>
        <Skeleton width="110px" height="38px" className="rounded-lg" />
      </div>

      {/* 2. Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="stat" />
        ))}
      </div>

      {/* 3. Table/List Rows */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-900 space-y-4">
        <Skeleton variant="text" width="120px" height="18px" />
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="py-3 first:pt-0 last:pb-0">
              <Skeleton variant="table-row" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
