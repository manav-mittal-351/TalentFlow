// ─── pages/recruiter/EditJobPage.jsx ─────────────────────────────────────────
// Recruiter interface to modify details of an existing job opening.
// Fetches data via GET /api/v1/jobs/:jobId and updates via PATCH /api/v1/jobs/:jobId.
// Document reference: Document 8 — UI Pages § Page 14 Create / Edit Job

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { JobForm } from '../../components/jobs/JobForm.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { ROUTES } from '../../constants/routes.js';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { ArrowLeft, AlertTriangle, RotateCw } from 'lucide-react';

export default function EditJobPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Fetch current job detail details using TanStack Query
  const {
    data: jobData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['jobDetails', jobId],
    queryFn: async () => {
      const response = await api.get(`/jobs/${jobId}`);
      return response.data?.data;
    },
    staleTime: 1000 * 60 * 5, // Cache detail parameters for 5 minutes
  });

  // 2. Setup mutation for PATCH /api/v1/jobs/:jobId updates
  const updateJobMutation = useMutation({
    mutationFn: async (formData) => {
      // Normalize empty fields and numbers
      const payload = {
        ...formData,
        salaryMin: formData.salaryMin === '' ? null : Number(formData.salaryMin),
        salaryMax: formData.salaryMax === '' ? null : Number(formData.salaryMax),
        applicationDeadline: formData.applicationDeadline || null,
      };
      const response = await api.patch(`/jobs/${jobId}`, payload);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Job vacancy updated successfully');
      // Invalidate relevant query caches
      queryClient.invalidateQueries({ queryKey: ['recruiterJobs'] });
      queryClient.invalidateQueries({ queryKey: ['jobDetails', jobId] });
      // Redirect back to job listings
      navigate(ROUTES.RECRUITER.JOBS);
    },
  });

  const onSubmit = (data, setError) => {
    updateJobMutation.mutate(data, {
      onError: (err) => {
        const responseErr = err.response?.data;
        if (responseErr?.errorCode === 'VALIDATION_ERROR' && responseErr?.errors) {
          responseErr.errors.forEach((fieldError) => {
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
          toast.error(responseErr?.message || 'Failed to update job details. Please try again.');
        }
      },
    });
  };

  // Format existing values to match form expectations (specifically formatted dates for HTML input picker)
  const defaultValues = jobData
    ? {
        title: jobData.title || '',
        department: jobData.department || 'Engineering',
        location: jobData.location || '',
        jobType: jobData.jobType || 'full-time',
        isRemote: !!jobData.isRemote,
        experienceLevel: jobData.experienceLevel || 'mid',
        description: jobData.description || '',
        salaryMin: jobData.salaryMin !== null && jobData.salaryMin !== undefined ? String(jobData.salaryMin) : '',
        salaryMax: jobData.salaryMax !== null && jobData.salaryMax !== undefined ? String(jobData.salaryMax) : '',
        applicationDeadline: jobData.applicationDeadline ? jobData.applicationDeadline.split('T')[0] : '',
        status: jobData.status || 'draft',
      }
    : null;

  if (isLoading) {
    return (
      <PageContainer className="animate-pulse">
        <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-2">
            <Skeleton variant="text" width="220px" height="28px" />
            <Skeleton variant="text" width="160px" height="16px" />
          </div>
        </div>
        <div className="mt-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-8 space-y-6">
          <Skeleton variant="text" width="100%" height="45px" />
          <Skeleton variant="text" width="100%" height="45px" />
          <Skeleton variant="text" width="100%" height="180px" />
        </div>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[70vh]">
        <div className="p-6 rounded-2xl border border-rose-250 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/10 flex flex-col items-center justify-center text-center gap-4 max-w-md shadow-sm">
          <AlertTriangle className="w-10 h-10 text-rose-500 animate-bounce" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Failed to load Job details
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Encountered API failures or the selected job post does not exist. Check parameters.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl transition-all shadow focus-ring hover:scale-[1.01]"
            type="button"
          >
            <RotateCw className="w-4 h-4" />
            <span>Retry connection</span>
          </button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Edit Job Details"
        description={`Modify the posting details for ${jobData?.title || 'Job Opening'}`}
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

      {/* Render Shared Form */}
      {defaultValues && (
        <JobForm
          defaultValues={defaultValues}
          onSubmit={onSubmit}
          isPending={updateJobMutation.isPending}
          submitButtonText="Update Role"
        />
      )}
    </PageContainer>
  );
}
