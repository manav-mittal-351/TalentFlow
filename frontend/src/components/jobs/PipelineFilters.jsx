// ─── components/jobs/PipelineFilters.jsx ──────────────────────────────────────
// Modular search, status dropdown selectors, and sorting options for recruiter pipelines.

import React from 'react';
import { Search, X } from 'lucide-react';

const PIPELINE_STAGES = [
  { value: '', label: 'All Stages' },
  { value: 'applied', label: 'Applied' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview', label: 'Interviewing' },
  { value: 'offer', label: 'Offered' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'status', label: 'Status Hierarchy' },
];

export const PipelineFilters = React.memo(function PipelineFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sortBy,
  onSortChange,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 w-full" role="search" aria-label="Pipeline Filters">
      {/* Search Input Box */}
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search candidates by name or email..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus-ring"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650"
            aria-label="Clear search"
            type="button"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Stage Dropdown Selector */}
      <div className="w-full sm:w-44 shrink-0">
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-150 focus-ring font-semibold"
          aria-label="Filter by stage status"
        >
          {PIPELINE_STAGES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Sort Selection Dropdown */}
      <div className="w-full sm:w-40 shrink-0">
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-150 focus-ring font-semibold"
          aria-label="Sort order"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
});
