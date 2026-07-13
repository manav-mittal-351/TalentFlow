// ─── components/interviews/FeedbackForm.jsx ───────────────────────────────────
// Form interface allowing Hiring Managers to submit and edit candidate scorecard evaluations.
// Supports overall, technical, communication, and cultureFit ratings.

import React, { useState } from 'react';
import { Star, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn.js';

const CATEGORIES = [
  { key: 'overall', label: 'Overall Evaluation', desc: 'General hire suitability' },
  { key: 'technical', label: 'Technical Ability', desc: 'Role specific skill evaluation' },
  { key: 'communication', label: 'Communication skills', desc: 'Clarity, listening and presentation' },
  { key: 'cultureFit', label: 'Culture Alignment', desc: 'Values alignment and collaboration' },
];

const RECOMMENDATION_OPTIONS = [
  { value: 'hire', label: 'Recommend Hire', color: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/35 hover:bg-emerald-100/50' },
  { value: 'hold', label: 'Hold / Next Step', color: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/35 hover:bg-amber-100/50' },
  { value: 'reject', label: 'Recommend Reject', color: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 border-rose-200 dark:border-rose-900/35 hover:bg-rose-100/50' },
];

export const FeedbackForm = React.memo(function FeedbackForm({
  interviewId,
  applicationId,
  initialFeedback = null,
  onSuccess,
  onCancel,
}) {
  const isEditMode = !!initialFeedback;
  const [ratings, setRatings] = useState({
    overall: initialFeedback?.ratings?.overall || 0,
    technical: initialFeedback?.ratings?.technical || 0,
    communication: initialFeedback?.ratings?.communication || 0,
    cultureFit: initialFeedback?.ratings?.cultureFit || 0,
  });
  const [recommendation, setRecommendation] = useState(initialFeedback?.recommendation || '');
  const [comments, setComments] = useState(initialFeedback?.comments || '');
  const [decisionReason, setDecisionReason] = useState(initialFeedback?.decisionReason || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleStarClick = (category, val) => {
    setRatings((prev) => ({
      ...prev,
      [category]: val,
    }));
  };

  const validateForm = () => {
    if (!ratings.overall || !ratings.technical || !ratings.communication || !ratings.cultureFit) {
      setFormError('Please provide star ratings for all categories.');
      return false;
    }
    if (!recommendation) {
      setFormError('Please select a candidate recommendation.');
      return false;
    }
    setFormError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (isEditMode) {
        // PATCH /api/v1/feedback/:id
        const response = await api.patch(`/feedback/${initialFeedback._id}`, {
          ratings,
          recommendation,
          comments,
          decisionReason,
        });
        toast.success(response.data?.message || 'Scorecard updated successfully');
        onSuccess(response.data?.data || response.data);
      } else {
        // POST /api/v1/feedback
        const response = await api.post('/feedback', {
          interviewId,
          applicationId,
          ratings,
          recommendation,
          comments,
          decisionReason,
        });
        toast.success(response.data?.message || 'Scorecard submitted successfully');
        onSuccess(response.data?.data || response.data);
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to submit feedback. Check all fields.';
      toast.error(errMsg);
      setFormError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border border-slate-205 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
          <h3 className="text-sm font-bold text-slate-850 dark:text-slate-100 uppercase tracking-wide">
            {isEditMode ? 'Edit Candidate Scorecard' : 'Submit Scorecard Evaluation'}
          </h3>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-semibold text-slate-400 hover:text-slate-650 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>

      {formError && (
        <div className="flex items-start gap-2.5 p-3.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/35 rounded-xl text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <span>{formError}</span>
        </div>
      )}

      {/* Ratings Categories */}
      <div className="space-y-4">
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 py-1">
            <div className="min-w-0">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-250 block">
                {cat.label}
              </label>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {cat.desc}
              </span>
            </div>
            {/* Stars Row */}
            <div className="flex items-center gap-1.5" role="radiogroup" aria-label={cat.label}>
              {[1, 2, 3, 4, 5].map((val) => {
                const isActive = ratings[cat.key] >= val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleStarClick(cat.key, val)}
                    className="p-1 rounded transition-transform active:scale-95 text-slate-250 dark:text-slate-700 hover:scale-110"
                    aria-label={`Rate ${val} stars out of 5`}
                    aria-checked={ratings[cat.key] === val}
                    role="radio"
                  >
                    <Star
                      className={cn(
                        'w-5 h-5 transition-colors',
                        isActive
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-250 dark:text-slate-750'
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Recommendation Options */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          Candidate Recommendation
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {RECOMMENDATION_OPTIONS.map((opt) => {
            const isSelected = recommendation === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRecommendation(opt.value)}
                className={cn(
                  'flex items-center justify-center px-4 py-2.5 text-xs font-bold border rounded-xl transition-all active:scale-98',
                  isSelected
                    ? cn(opt.color, 'ring-2 ring-indigo-500/25 border-indigo-400 scale-[1.02] shadow-sm')
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Written Comments */}
      <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Written Feedback / Comments
          </label>
          <div className="relative">
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Provide a comprehensive evaluation of candidate performance, strengths, and areas for improvement..."
              maxLength={3000}
              rows={4}
              className="w-full rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-3 text-xs text-slate-805 dark:text-slate-200 placeholder-slate-400 focus-ring outline-none transition-colors"
            />
            <span className="absolute bottom-2.5 right-3 text-[9px] font-bold text-slate-400">
              {comments.length}/3000
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Decision Reason / Key Factors
          </label>
          <div className="relative">
            <input
              type="text"
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              placeholder="Summarize the key deciding factor (e.g. strong system design skills)"
              maxLength={1000}
              className="w-full rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-xs text-slate-805 dark:text-slate-200 placeholder-slate-400 focus-ring outline-none transition-colors"
            />
            <span className="absolute right-3.5 top-3.5 text-[9px] font-bold text-slate-400">
              {decisionReason.length}/1000
            </span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm hover:shadow transition-all disabled:opacity-50 active:scale-98"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Submitting Scorecard...</span>
          </>
        ) : (
          <span>{isEditMode ? 'Save Scorecard Changes' : 'Submit Evaluation Scorecard'}</span>
        )}
      </button>
    </form>
  );
});
