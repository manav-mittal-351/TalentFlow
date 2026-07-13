// ─── components/application/ApplicationFilters.jsx ───────────────────────────
// Criteria searching and filtering panel for candidate applications lists.

import React from 'react';
import { Search, RotateCw } from 'lucide-react';
import { APPLICATION_STATUSES } from '../../constants/statuses.js';
import { getStatusLabel } from '../../utils/statusBadge.js';

export const ApplicationFilters = React.memo(function ApplicationFilters({
  filters,
  onChange,
  onReset,
}) {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 gap-4 flex flex-col md:flex-row md:items-center justify-between shadow-sm">
      
      {/* Search keywords */}
      <div className="relative flex-1">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="w-4 h-4 text-slate-400" />
        </span>
        <input
          name="search"
          type="text"
          value={filters.search || ''}
          onChange={handleInputChange}
          placeholder="Search by job title or company name..."
          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus-ring"
        />
      </div>

      {/* Dropdown filters group */}
      <div className="flex flex-wrap items-center gap-3 shrink-0">
        
        {/* Status Dropdown */}
        <select
          name="status"
          value={filters.status || ''}
          onChange={handleInputChange}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus-ring"
        >
          <option value="">All Stages</option>
          {APPLICATION_STATUSES.map((st) => (
            <option key={st} value={st}>
              {getStatusLabel(st)}
            </option>
          ))}
        </select>

        {/* Sort Order Dropdown */}
        <select
          name="sortBy"
          value={filters.sortBy || 'latest'}
          onChange={handleInputChange}
          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus-ring"
        >
          <option value="latest">Newest Applied</option>
          <option value="oldest">Oldest Applied</option>
        </select>

        {/* Reset */}
        <button
          onClick={onReset}
          className="p-2 border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 text-slate-500 hover:text-indigo-650 rounded-xl transition-colors focus-ring flex items-center justify-center shrink-0"
          title="Reset Filters"
          type="button"
        >
          <RotateCw className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
});
