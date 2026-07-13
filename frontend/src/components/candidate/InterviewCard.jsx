// ─── components/candidate/InterviewCard.jsx ───────────────────────────────────
// Reusable candidate scheduled interview detail card containing cancel and completion triggers.

import React from 'react';
import { format } from 'date-fns';
import { Video, Phone, MapPin, Calendar, CheckCircle2, AlertTriangle, Edit } from 'lucide-react';
import { cn } from '../../utils/cn.js';

const STATUS_STYLING = {
  scheduled: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-650 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30',
  completed: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border-emerald-100 dark:border-emerald-900/20',
  cancelled: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/25',
};

const FORMAT_ICONS = {
  video: Video,
  phone: Phone,
  'in-person': MapPin,
};

export const InterviewCard = React.memo(function InterviewCard({
  interview,
  onStatusChange,
  onEditClick,
  isPending = false,
}) {
  const { _id, scheduledAt, format: fmt, location, candidateInstructions, status, interviewer } = interview;

  const FormatIcon = FORMAT_ICONS[fmt] || Calendar;

  const getFormattedDate = () => {
    if (!scheduledAt) return 'Time Unspecified';
    try {
      return format(new Date(scheduledAt), 'EEEE, MMMM d, yyyy · h:mm a');
    } catch (e) {
      return 'Recent';
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-5 space-y-4 shadow-sm relative overflow-hidden">
      
      {/* Top row: Format icon, formatted date and status badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center shrink-0">
            <FormatIcon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100">
              {fmt.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Interview
            </h4>
            <span className="text-[11px] text-slate-405 dark:text-slate-500 font-semibold block mt-0.5">
              {getFormattedDate()}
            </span>
          </div>
        </div>

        <span className={cn('text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 border rounded-full shrink-0', STATUS_STYLING[status])}>
          {status}
        </span>
      </div>

      {/* Details (Location / instructions / interviewer) */}
      <div className="space-y-2 text-xs pt-1">
        {location && (
          <div className="flex items-start gap-1.5 text-slate-650 dark:text-slate-350">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span className="break-all font-semibold">
              Location/Link: <a href={location.startsWith('http') ? location : '#'} target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">{location}</a>
            </span>
          </div>
        )}

        {interviewer && (
          <div className="flex items-start gap-1.5 text-slate-650 dark:text-slate-350 font-semibold">
            <span className="text-slate-400">Interviewer ID:</span>
            <span className="font-mono text-[10px] bg-slate-50 dark:bg-slate-950 px-1.5 py-0.5 rounded border border-slate-100 dark:border-slate-850">
              {interviewer.name || interviewer._id || interviewer}
            </span>
          </div>
        )}

        {candidateInstructions && (
          <div className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
            <span className="font-bold text-slate-505 dark:text-slate-400 block mb-0.5 uppercase tracking-wider text-[9px]">
              Candidate Instructions:
            </span>
            <p className="whitespace-pre-wrap">{candidateInstructions}</p>
          </div>
        )}
      </div>

      {/* Recruiter update action buttons */}
      {status === 'scheduled' && onEditClick && onStatusChange && (
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-[11px]">
          <button
            onClick={() => onEditClick(interview)}
            disabled={isPending}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-205 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-250 font-semibold transition-colors focus-ring disabled:opacity-50"
            type="button"
          >
            <Edit className="w-3.5 h-3.5 text-slate-400" />
            <span>Reschedule</span>
          </button>
          
          <button
            onClick={() => onStatusChange(_id, 'cancelled')}
            disabled={isPending}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50/10 hover:bg-rose-50/40 text-rose-600 dark:text-rose-450 font-semibold transition-colors focus-ring disabled:opacity-50"
            type="button"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>

          <button
            onClick={() => onStatusChange(_id, 'completed')}
            disabled={isPending}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors focus-ring disabled:opacity-50 shadow-sm"
            type="button"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Complete</span>
          </button>
        </div>
      )}

    </div>
  );
});
