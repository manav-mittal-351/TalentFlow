// ─── pages/recruiter/CreateJobPage.jsx ───────────────────────────────────────
// Recruiter interface to register new job positions. Integrates react-hook-form,
// Zod client validations, and handles live POST /api/v1/jobs submissions.
// Document reference: Document 8 — UI Pages § Page 14 Create / Edit Job

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { jobSchema } from '../../utils/validators.js';
import { ROUTES } from '../../constants/routes.js';
import { DEPARTMENTS, JOB_TYPES, EXPERIENCE_LEVELS, JOB_STATUSES } from '../../constants/statuses.js';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { Loader2, ArrowLeft, Save, XCircle } from 'lucide-react';

export default function CreateJobPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Setup useForm hook mapped to jobSchema validator
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      department: 'Engineering',
      location: '',
      jobType: 'full-time',
      isRemote: false,
      experienceLevel: 'mid',
      description: '',
      salaryMin: '',
      salaryMax: '',
      applicationDeadline: '',
      status: 'draft',
    },
  });

  // Setup mutation targeting POST /api/v1/jobs
  const createJobMutation = useMutation({
    mutationFn: async (formData) => {
      // Normalize empty numbers to null
      const payload = {
        ...formData,
        salaryMin: formData.salaryMin === '' ? null : Number(formData.salaryMin),
        salaryMax: formData.salaryMax === '' ? null : Number(formData.salaryMax),
        applicationDeadline: formData.applicationDeadline || null,
      };
      const response = await api.post('/jobs', payload);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Job vacancy created successfully');
      // Invalidate recruiter queries cache
      queryClient.invalidateQueries({ queryKey: ['recruiterJobs'] });
      // Redirect back to job management list
      navigate(ROUTES.RECRUITER.JOBS);
    },
    onError: (err) => {
      const responseErr = err.response?.data;
      // Handle structured backend error payloads
      if (responseErr?.errorCode === 'VALIDATION_ERROR' && responseErr?.errors) {
        responseErr.errors.forEach((fieldError) => {
          // Map backend field validations to correct form input targets
          setError(fieldError.path, {
            type: 'server',
            message: fieldError.msg || fieldError.message,
          });
        });
        toast.error('Please correct the validation errors below.');
      } else if (responseErr?.errorCode === 'SALARY_RANGE_INVALID') {
        setError('salaryMax', {
          type: 'server',
          message: responseErr.message || 'Maximum salary must be greater than or equal to minimum salary',
        });
        toast.error(responseErr.message || 'Invalid salary range.');
      } else if (responseErr?.errorCode === 'DEADLINE_IN_PAST') {
        setError('applicationDeadline', {
          type: 'server',
          message: responseErr.message || 'Application deadline must be a future date',
        });
        toast.error(responseErr.message || 'Invalid deadline date.');
      } else {
        toast.error(responseErr?.message || 'Failed to publish job vacancy. Please try again.');
      }
    },
  });

  const onSubmit = (data) => {
    createJobMutation.mutate(data);
  };

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Post New Job Opening"
        description="Fill out the fields below to register a new role in the careers listing board."
        actions={
          <Link
            to={ROUTES.RECRUITER.JOBS}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors py-2 px-3 rounded-lg focus-ring"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Cancel</span>
          </Link>
        }
      />

      {/* Main Form Box */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-4xl border border-slate-250 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-6 md:p-8 space-y-6 shadow-sm transition-colors"
        noValidate
      >
        {/* Section 1: General Info */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            1. Role Definition
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Job Title */}
            <div className="space-y-1.5 col-span-1 md:col-span-2">
              <label htmlFor="title" className="text-xs font-bold text-slate-700 dark:text-slate-350">
                Job Title *
              </label>
              <input
                id="title"
                type="text"
                {...register('title')}
                placeholder="e.g. Lead Frontend Engineer"
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus-ring ${
                  errors.title ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800'
                }`}
                aria-invalid={!!errors.title}
                aria-describedby={errors.title ? 'title-error' : undefined}
              />
              {errors.title && (
                <p id="title-error" className="text-[11px] font-semibold text-rose-550 flex items-center gap-1 animate-in slide-in-from-top-1 duration-100">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{errors.title.message}</span>
                </p>
              )}
            </div>

            {/* Department */}
            <div className="space-y-1.5">
              <label htmlFor="department" className="text-xs font-bold text-slate-700 dark:text-slate-350">
                Department *
              </label>
              <select
                id="department"
                {...register('department')}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-150 focus-ring ${
                  errors.department ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {errors.department && (
                <p className="text-[11px] font-semibold text-rose-550 flex items-center gap-1 mt-1">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{errors.department.message}</span>
                </p>
              )}
            </div>

            {/* Experience Level */}
            <div className="space-y-1.5">
              <label htmlFor="experienceLevel" className="text-xs font-bold text-slate-700 dark:text-slate-350">
                Experience Level *
              </label>
              <select
                id="experienceLevel"
                {...register('experienceLevel')}
                className="w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-150 focus-ring border-slate-200 dark:border-slate-800"
              >
                {EXPERIENCE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Location & Type */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            2. Location & Placement
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location */}
            <div className="space-y-1.5">
              <label htmlFor="location" className="text-xs font-bold text-slate-700 dark:text-slate-350">
                Location *
              </label>
              <input
                id="location"
                type="text"
                {...register('location')}
                placeholder="e.g. San Francisco, CA"
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

            {/* Employment Type */}
            <div className="space-y-1.5">
              <label htmlFor="jobType" className="text-xs font-bold text-slate-700 dark:text-slate-350">
                Employment Type *
              </label>
              <select
                id="jobType"
                {...register('jobType')}
                className="w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-150 focus-ring border-slate-200 dark:border-slate-800"
              >
                {JOB_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Remote Checkbox */}
            <div className="flex items-center gap-2 pt-2 col-span-1 md:col-span-2">
              <input
                id="isRemote"
                type="checkbox"
                {...register('isRemote')}
                className="w-4 h-4 rounded text-indigo-600 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 focus:ring-indigo-500/20 shrink-0 cursor-pointer focus-ring"
              />
              <label htmlFor="isRemote" className="text-xs font-bold text-slate-700 dark:text-slate-350 cursor-pointer">
                This role is Remote / Hybrid friendly
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Compensation & Deadlines */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            3. Compensation & Deadlines
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* salaryMin */}
            <div className="space-y-1.5">
              <label htmlFor="salaryMin" className="text-xs font-bold text-slate-700 dark:text-slate-350">
                Minimum Annual Salary ($)
              </label>
              <input
                id="salaryMin"
                type="number"
                {...register('salaryMin')}
                placeholder="e.g. 80000"
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus-ring ${
                  errors.salaryMin ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                }`}
                aria-invalid={!!errors.salaryMin}
              />
              {errors.salaryMin && (
                <p className="text-[11px] font-semibold text-rose-550 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{errors.salaryMin.message}</span>
                </p>
              )}
            </div>

            {/* salaryMax */}
            <div className="space-y-1.5">
              <label htmlFor="salaryMax" className="text-xs font-bold text-slate-700 dark:text-slate-350">
                Maximum Annual Salary ($)
              </label>
              <input
                id="salaryMax"
                type="number"
                {...register('salaryMax')}
                placeholder="e.g. 120000"
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus-ring ${
                  errors.salaryMax ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                }`}
                aria-invalid={!!errors.salaryMax}
              />
              {errors.salaryMax && (
                <p className="text-[11px] font-semibold text-rose-550 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{errors.salaryMax.message}</span>
                </p>
              )}
            </div>

            {/* applicationDeadline */}
            <div className="space-y-1.5">
              <label htmlFor="applicationDeadline" className="text-xs font-bold text-slate-700 dark:text-slate-350">
                Application Deadline
              </label>
              <input
                id="applicationDeadline"
                type="date"
                {...register('applicationDeadline')}
                className={`w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-150 focus-ring ${
                  errors.applicationDeadline ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'
                }`}
                aria-invalid={!!errors.applicationDeadline}
              />
              {errors.applicationDeadline && (
                <p className="text-[11px] font-semibold text-rose-550 flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{errors.applicationDeadline.message}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 4: Description */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            4. Details & Description
          </h3>
          <div className="space-y-1.5">
            <label htmlFor="description" className="text-xs font-bold text-slate-700 dark:text-slate-350">
              Role Description & Requirements *
            </label>
            <textarea
              id="description"
              rows={8}
              {...register('description')}
              placeholder="Detail the key responsibilities, qualifications, and core technical skills required for this role..."
              className={`w-full px-4 py-3 text-xs rounded-xl border bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus-ring ${
                errors.description ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 dark:border-slate-800'
              }`}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p className="text-[11px] font-semibold text-rose-550 flex items-center gap-1">
                <XCircle className="w-3.5 h-3.5" />
                <span>{errors.description.message}</span>
              </p>
            )}
          </div>
        </div>

        {/* Section 5: Status Control */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
          <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            5. Publication Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* status */}
            <div className="space-y-1.5">
              <label htmlFor="status" className="text-xs font-bold text-slate-700 dark:text-slate-350">
                Initial Posting Status
              </label>
              <select
                id="status"
                {...register('status')}
                className="w-full px-3 py-2 text-xs rounded-xl border bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-150 focus-ring border-slate-200 dark:border-slate-800"
              >
                {JOB_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800/80 mt-8">
          <Link
            to={ROUTES.RECRUITER.JOBS}
            className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-250 font-semibold text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800 focus-ring"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-transform hover:scale-[1.01] focus-ring disabled:opacity-50"
            disabled={createJobMutation.isPending}
          >
            {createJobMutation.isPending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Role...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Role</span>
              </>
            )}
          </button>
        </div>

      </form>
    </PageContainer>
  );
}
