// ─── pages/recruiter/CreateJobPage.jsx ───────────────────────────────────────
// Recruiter interface to register new job positions. Reuses the shared JobForm layout.
// Document reference: Document 8 — UI Pages § Page 14 Create / Edit Job

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { JobForm } from '../../components/jobs/JobForm.jsx';
import { ROUTES } from '../../constants/routes.js';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

export default function CreateJobPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Initial form values
  const defaultValues = {
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
  };

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
  });

  const onSubmit = (data, setError) => {
    createJobMutation.mutate(data, {
      onError: (err) => {
        const responseErr = err.response?.data;
        // Handle structured backend error payloads
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
          toast.error(responseErr?.message || 'Failed to publish job vacancy. Please try again.');
        }
      },
    });
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

      {/* Render Reusable Form */}
      <JobForm
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        isPending={createJobMutation.isPending}
        submitButtonText="Save Role"
      />
    </PageContainer>
  );
}
