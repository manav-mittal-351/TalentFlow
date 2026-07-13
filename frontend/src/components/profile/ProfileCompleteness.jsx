// ─── components/profile/ProfileCompleteness.jsx ──────────────────────────────
// Displays profile completeness progress based on backend criteria:
// requires: resumeUrl, headline, phone, location (matches user.service.js checkCompleteness).

import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const CRITERIA = [
  { key: 'headline',   label: 'Professional headline' },
  { key: 'phone',      label: 'Phone number' },
  { key: 'location',   label: 'Location' },
  { key: 'resumeUrl',  label: 'Resume uploaded' },
];

export function ProfileCompleteness({ profile }) {
  const completed = CRITERIA.filter((c) => !!profile?.[c.key]);
  const percent = Math.round((completed.length / CRITERIA.length) * 100);

  const color =
    percent === 100
      ? 'text-emerald-600 dark:text-emerald-400'
      : percent >= 50
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-rose-600 dark:text-rose-400';

  const barColor =
    percent === 100
      ? 'bg-emerald-500'
      : percent >= 50
      ? 'bg-amber-500'
      : 'bg-rose-500';

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-5 space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          Profile Completeness
        </h3>
        <span className={cn('text-sm font-extrabold tabular-nums', color)}>
          {percent}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', barColor)}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Criteria checklist */}
      <ul className="space-y-2">
        {CRITERIA.map((c) => {
          const done = !!profile?.[c.key];
          return (
            <li key={c.key} className="flex items-center gap-2.5 text-xs">
              {done ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-300 dark:text-slate-700 shrink-0" />
              )}
              <span
                className={cn(
                  'font-medium',
                  done
                    ? 'text-slate-700 dark:text-slate-300'
                    : 'text-slate-400 dark:text-slate-600'
                )}
              >
                {c.label}
              </span>
            </li>
          );
        })}
      </ul>

      {percent === 100 && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl px-3 py-2">
          🎉 Your profile is complete! Recruiters can see all your details.
        </p>
      )}
    </div>
  );
}
