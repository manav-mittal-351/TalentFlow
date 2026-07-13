// ─── components/jobs/JobFilters.jsx ──────────────────────────────────────────
// Sidebar job search and criteria filtering controls.
// Connects to GET /api/v1/jobs parameters.

import React from 'react';
import { DEPARTMENTS, JOB_TYPES } from '../../constants/statuses.js';
import { Search, MapPin, Briefcase, RefreshCw, Layers } from 'lucide-react';

export const JobFilters = React.memo(function JobFilters({
  filters,
  onChange,
  onReset,
}) {
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onChange({ [name]: value });
  };

  const handleRemoteChange = (e) => {
    const val = e.target.value;
    onChange({ isRemote: val });
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5 shadow-sm sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Filter Openings
        </h3>
        <button
          onClick={onReset}
          className="text-[11px] font-semibold text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 flex items-center gap-1 transition-colors"
          type="button"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Keywords Search */}
      <div className="space-y-1.5">
        <label htmlFor="search" className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <span>Keywords</span>
        </label>
        <input
          id="search"
          name="search"
          type="text"
          value={filters.search || ''}
          onChange={handleInputChange}
          placeholder="e.g. Engineer, Designer..."
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus-ring"
        />
      </div>

      {/* Location Search */}
      <div className="space-y-1.5">
        <label htmlFor="location" className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-slate-400" />
          <span>Location</span>
        </label>
        <input
          id="location"
          name="location"
          type="text"
          value={filters.location || ''}
          onChange={handleInputChange}
          placeholder="e.g. San Francisco, London..."
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus-ring"
        />
      </div>

      {/* Department Dropdown */}
      <div className="space-y-1.5">
        <label htmlFor="department" className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1">
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>Department</span>
        </label>
        <select
          id="department"
          name="department"
          value={filters.department || ''}
          onChange={handleInputChange}
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus-ring"
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      {/* Job Type Dropdown */}
      <div className="space-y-1.5">
        <label htmlFor="jobType" className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1">
          <Briefcase className="w-3.5 h-3.5 text-slate-400" />
          <span>Job Type</span>
        </label>
        <select
          id="jobType"
          name="jobType"
          value={filters.jobType || ''}
          onChange={handleInputChange}
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus-ring"
        >
          <option value="">All Types</option>
          {JOB_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </option>
          ))}
        </select>
      </div>

      {/* Workplace format (Remote vs In-Office) */}
      <div className="space-y-1.5 pt-1">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-350 block">
          Workplace Format
        </span>
        <div className="space-y-2 text-xs font-medium text-slate-650 dark:text-slate-300">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="isRemote"
              value=""
              checked={filters.isRemote === '' || filters.isRemote === undefined}
              onChange={handleRemoteChange}
              className="w-3.5 h-3.5 text-indigo-650 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-indigo-500/20"
            />
            <span>All Formats</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="isRemote"
              value="true"
              checked={filters.isRemote === 'true'}
              onChange={handleRemoteChange}
              className="w-3.5 h-3.5 text-indigo-650 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-indigo-500/20"
            />
            <span>Remote Only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="isRemote"
              value="false"
              checked={filters.isRemote === 'false'}
              onChange={handleRemoteChange}
              className="w-3.5 h-3.5 text-indigo-650 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 focus:ring-indigo-500/20"
            />
            <span>In-office / On-site Only</span>
          </label>
        </div>
      </div>

      {/* Sort By Dropdown */}
      <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/80">
        <label htmlFor="sortBy" className="text-xs font-bold text-slate-700 dark:text-slate-350">
          Sort Results
        </label>
        <select
          id="sortBy"
          name="sortBy"
          value={filters.sortBy || 'newest'}
          onChange={handleInputChange}
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus-ring"
        >
          <option value="newest">Newest First</option>
          <option value="salary">Highest Salary</option>
          <option value="location">Location Alphabetical</option>
        </select>
      </div>
    </div>
  );
});
