// ─── components/candidate/InterviewForm.jsx ───────────────────────────────────
// Reusable interview scheduler form modal. Used for both scheduling and editing interviews.

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { XCircle, Loader2, Calendar, MapPin, AlignLeft, UserPlus } from 'lucide-react';
import { INTERVIEW_FORMATS } from '../../constants/statuses.js';
import api from '../../services/api.js';

// Local Zod validation schema for scheduling interviews
const interviewSchema = z.object({
  scheduledAt: z.string().min(1, { message: 'Interview date and time is required' }).refine(
    (val) => new Date(val) > new Date(),
    { message: 'Date and time must be scheduled in the future' }
  ),
  format: z.enum(['in-person', 'video', 'phone'], {
    errorMap: () => ({ message: 'Please select a valid interview format' }),
  }),
  location: z.string().max(300, { message: 'Location cannot exceed 300 characters' }).optional(),
  candidateInstructions: z.string().max(1000, { message: 'Instructions cannot exceed 1000 characters' }).optional(),
  interviewerId: z.string().optional().transform((val) => (val ? val.trim() : '')).refine(
    (val) => !val || /^[0-9a-fA-F]{24}$/.test(val),
    { message: 'Interviewer ID must be a valid 24-character hexadecimal MongoDB ObjectId' }
  ),
});

export const InterviewForm = React.memo(function InterviewForm({
  defaultValues,
  onSubmit,
  onClose,
  isPending = false,
  title = 'Schedule Interview Session',
  submitButtonText = 'Schedule Session',
}) {
  const [useCustomIdInput, setUseCustomIdInput] = useState(false);

  // Fetch active hiring managers to populate dropdown
  const { data: hiringManagers = [] } = useQuery({
    queryKey: ['hiringManagersList'],
    queryFn: async () => {
      const response = await api.get('/interviews/hiring-managers');
      return response.data?.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(interviewSchema),
    defaultValues: defaultValues || {
      scheduledAt: '',
      format: 'video',
      location: '',
      candidateInstructions: '',
      interviewerId: '',
    },
  });

  const selectedInterviewerId = watch('interviewerId');

  useEffect(() => {
    if (defaultValues) {
      const rawId = defaultValues.interviewerId?._id || defaultValues.interviewerId || '';
      reset({
        ...defaultValues,
        interviewerId: rawId,
      });
    }
  }, [defaultValues, reset]);

  const handleFormSubmit = (data) => {
    const cleanData = {
      ...data,
      interviewerId: data.interviewerId && data.interviewerId.trim() ? data.interviewerId.trim() : undefined,
    };
    onSubmit(cleanData);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity" onClick={onClose} />

      {/* Modal Container */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative w-full max-w-lg rounded-2xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 md:p-8 space-y-5 shadow-xl animate-in scale-in duration-150">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <h3 id="modal-title" className="text-sm font-bold uppercase tracking-wider text-indigo-650 dark:text-indigo-400">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1 rounded-lg focus-ring"
              aria-label="Close modal"
              type="button"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 text-xs" noValidate>
            
            {/* Scheduled At Date/Time picker */}
            <div className="space-y-1.5">
              <label htmlFor="scheduledAt" className="font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Date & Time *</span>
              </label>
              <input
                id="scheduledAt"
                type="datetime-local"
                {...register('scheduledAt')}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-150 focus-ring ${
                  errors.scheduledAt ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                }`}
                aria-invalid={!!errors.scheduledAt}
              />
              {errors.scheduledAt && (
                <p className="text-[11px] font-semibold text-rose-550 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{errors.scheduledAt.message}</span>
                </p>
              )}
            </div>

            {/* Format Selection Dropdown */}
            <div className="space-y-1.5">
              <label htmlFor="format" className="font-bold text-slate-700 dark:text-slate-350">
                Format *
              </label>
              <select
                id="format"
                {...register('format')}
                className="w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-950 text-slate-850 dark:text-slate-150 focus-ring border-slate-200 dark:border-slate-800"
              >
                {INTERVIEW_FORMATS.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {fmt.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Location (optional) */}
            <div className="space-y-1.5">
              <label htmlFor="location" className="font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Location Link or Address</span>
              </label>
              <input
                id="location"
                type="text"
                {...register('location')}
                placeholder="e.g. Google Meet link or Conference Room A"
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus-ring ${
                  errors.location ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                }`}
                aria-invalid={!!errors.location}
              />
              {errors.location && (
                <p className="text-[11px] font-semibold text-rose-550 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{errors.location.message}</span>
                </p>
              )}
            </div>

            {/* Assigned Interviewer / Hiring Manager (Optional Dropdown + Custom ID) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="interviewerSelect" className="font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1">
                  <UserPlus className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Assigned Interviewer / Hiring Manager (Optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setUseCustomIdInput(!useCustomIdInput)}
                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {useCustomIdInput ? 'Use Dropdown' : 'Enter Custom ID'}
                </button>
              </div>

              {!useCustomIdInput ? (
                <select
                  id="interviewerSelect"
                  value={selectedInterviewerId || ''}
                  onChange={(e) => setValue('interviewerId', e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus-ring border-slate-200 dark:border-slate-800"
                >
                  <option value="">-- No Assigned Interviewer (Unassigned / Self-conducted) --</option>
                  {hiringManagers.map((hm) => (
                    <option key={hm._id} value={hm._id}>
                      {hm.name} {hm.department ? `(${hm.department})` : ''} — {hm.email}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="interviewerId"
                  type="text"
                  {...register('interviewerId')}
                  placeholder="Paste 24-character MongoDB User ObjectId"
                  className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus-ring ${
                    errors.interviewerId ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                  }`}
                  aria-invalid={!!errors.interviewerId}
                />
              )}

              {errors.interviewerId && (
                <p className="text-[11px] font-semibold text-rose-550 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{errors.interviewerId.message}</span>
                </p>
              )}
            </div>

            {/* Candidate Instructions (optional) */}
            <div className="space-y-1.5">
              <label htmlFor="candidateInstructions" className="font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1">
                <AlignLeft className="w-3.5 h-3.5" />
                <span>Candidate Instructions</span>
              </label>
              <textarea
                id="candidateInstructions"
                rows={4}
                {...register('candidateInstructions')}
                placeholder="Details candidate needs to prepare, e.g. system setup requirements, coding environments..."
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus-ring ${
                  errors.candidateInstructions ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                }`}
                aria-invalid={!!errors.candidateInstructions}
              />
              {errors.candidateInstructions && (
                <p className="text-[11px] font-semibold text-rose-550 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{errors.candidateInstructions.message}</span>
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-250 font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors focus-ring"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition-transform hover:scale-[1.01] focus-ring disabled:opacity-50"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>{submitButtonText}</span>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
});
