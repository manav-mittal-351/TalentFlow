// ─── components/interviews/FeedbackCard.jsx ───────────────────────────────────
// Display component rendering a submitted scorecard candidate evaluation.

import React from 'react';
import { Star, Edit2, MessageSquare, Heart, Terminal, MessageCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../utils/cn.js';
import { useAuth } from '../../contexts/AuthContext.jsx';

const RECOMMENDATION_STYLES = {
  hire: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border-emerald-100 dark:border-emerald-900/25',
  hold: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/25',
  reject: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border-rose-100 dark:border-rose-900/25',
};

const RECOMMENDATION_LABELS = {
  hire: 'Recommend Hire',
  hold: 'Recommend Hold',
  reject: 'Recommend Reject',
};

const RATING_ICONS = {
  overall: Heart,
  technical: Terminal,
  communication: MessageCircle,
  cultureFit: FileText,
};

const RATING_LABELS = {
  overall: 'Overall',
  technical: 'Technical',
  communication: 'Communication',
  cultureFit: 'Culture Fit',
};

export const FeedbackCard = React.memo(function FeedbackCard({ feedback, onEditClick }) {
  const { user } = useAuth();
  const { ratings = {}, recommendation, comments, decisionReason, submittedBy, createdAt } = feedback;

  const isOwnFeedback = submittedBy?._id === user?._id || submittedBy === user?._id;
  const name = submittedBy?.name || 'Hiring Manager';
  const department = submittedBy?.department || 'Engineering';

  const getInitials = () => {
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getFormattedDate = () => {
    if (!createdAt) return '';
    try {
      return format(new Date(createdAt), 'MMM d, yyyy');
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-5 space-y-4 shadow-sm relative overflow-hidden">
      
      {/* Top row: HM Profile and Edit Action */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs shrink-0">
            {getInitials()}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-850 dark:text-slate-100">
              {name}
            </h4>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mt-0.5">
              Hiring Manager · {department}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-semibold">
            {getFormattedDate()}
          </span>
          {isOwnFeedback && onEditClick && (
            <button
              onClick={() => onEditClick(feedback)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors focus-ring"
              aria-label="Edit scorecard evaluation"
              type="button"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Ratings Categories Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/55 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-850">
        {Object.entries(RATING_LABELS).map(([key, label]) => {
          const score = ratings[key] || 0;
          const Icon = RATING_ICONS[key] || Star;
          return (
            <div key={key} className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                <Icon className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{label}</span>
              </span>
              <div className="flex items-center gap-0.5 pt-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={cn(
                      'w-3 h-3 shrink-0',
                      s <= score
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-slate-200 dark:text-slate-750'
                    )}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommendation pill */}
      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Evaluation Result
        </span>
        <span className={cn('text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 border rounded-full shrink-0', RECOMMENDATION_STYLES[recommendation])}>
          {RECOMMENDATION_LABELS[recommendation] || recommendation}
        </span>
      </div>

      {/* Written Comments Section */}
      {comments && (
        <div className="space-y-1.5 text-xs text-slate-650 dark:text-slate-350 leading-relaxed pt-1.5 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Scorecard Remarks</span>
          </span>
          <p className="whitespace-pre-wrap pl-5 bg-slate-50/20 dark:bg-slate-950/10 p-2.5 rounded-xl border border-slate-100/50 dark:border-slate-850">
            {comments}
          </p>
        </div>
      )}

      {/* Decision Reason */}
      {decisionReason && (
        <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-5 font-semibold">
          <span className="text-[9px] font-bold text-slate-405 uppercase tracking-wider block">
            Primary Factor
          </span>
          <p className="italic">&ldquo;{decisionReason}&rdquo;</p>
        </div>
      )}

    </div>
  );
});
