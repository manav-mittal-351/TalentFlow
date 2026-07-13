// ─── components/jobs/JobCard.jsx ──────────────────────────────────────────────
// Reusable premium card rendering single job posting details.
// Document reference: Document 8 — UI Pages § Page 2 JobCard

import { Link } from 'react-router-dom';
import { MapPin, DollarSign, Calendar, Bookmark, Briefcase } from 'lucide-react';
import { cn } from '../../utils/cn.js';
import { formatDistanceToNow } from 'date-fns';

export function JobCard({ job, isBookmarked = false, onBookmarkToggle, className }) {
  if (!job) return null;

  const {
    _id,
    title,
    department,
    location,
    jobType,
    salaryMin,
    salaryMax,
    isRemote,
    createdAt,
  } = job;

  // Format salary output: e.g. "$80,000 – $120,000"
  const formatSalary = () => {
    if (
      salaryMin !== undefined &&
      salaryMin !== null &&
      salaryMax !== undefined &&
      salaryMax !== null
    ) {
      return `$${salaryMin.toLocaleString()} – $${salaryMax.toLocaleString()}`;
    }
    return 'Salary not disclosed';
  };

  const getDaysAgo = () => {
    if (!createdAt) return 'Recent';
    try {
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
    } catch (e) {
      return 'Recent';
    }
  };

  const getInitials = () => {
    return (department || 'TF').substring(0, 2).toUpperCase();
  };

  return (
    <div
      className={cn(
        'group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-lg dark:hover:shadow-indigo-950/20 transition-all duration-300 hover:-translate-y-1 focus-within:ring-2 focus-within:ring-indigo-500/40 focus-within:ring-offset-2 dark:focus-within:ring-offset-slate-950 flex flex-col justify-between min-h-[220px]',
        className
      )}
    >
      <div>
        {/* Header: Department Initial Logo + Title & Bookmark */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0 border border-indigo-100 dark:border-indigo-900/30">
              {getInitials()}
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {department}
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                <Link to={`/jobs/${_id}`} className="focus:outline-none">
                  {title}
                </Link>
              </h3>
            </div>
          </div>

          {onBookmarkToggle && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onBookmarkToggle(_id);
              }}
              className="p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-colors focus-ring"
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark job'}
              type="button"
            >
              <Bookmark
                className={cn('w-4 h-4', isBookmarked && 'fill-indigo-600 text-indigo-600')}
              />
            </button>
          )}
        </div>

        {/* Chips section */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>{location}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400">
            <Briefcase className="w-3 h-3" />
            <span className="capitalize">{jobType?.replace('-', ' ')}</span>
          </span>
          {isRemote && (
            <span className="inline-flex items-center text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
              Remote
            </span>
          )}
        </div>
      </div>

      {/* Footer: Salary + Time Stamp */}
      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-4 mt-4 text-xs font-semibold">
        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
          <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{formatSalary()}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>{getDaysAgo()}</span>
        </div>
      </div>
    </div>
  );
}
