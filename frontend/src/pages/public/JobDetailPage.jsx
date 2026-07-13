// ─── pages/public/JobDetailPage.jsx ──────────────────────────────────────────
// Detailed job description and candidate application entry view.
// API: GET /api/v1/jobs/:jobId
// Doc reference: Document 8 — UI Pages § Page 2 Job Specification

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { ApplyModal } from '../../components/jobs/ApplyModal.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  ArrowLeft,
  DollarSign,
  MapPin,
  Briefcase,
  Bookmark,
  CheckCircle,
  AlertTriangle,
  RotateCw,
  Building,
  GraduationCap,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { cn } from '../../utils/cn.js';

// Visual placeholder for load times
function SkeletonDetail() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-44 rounded-2xl bg-slate-100 dark:bg-slate-800" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="h-6 rounded-md bg-slate-100 dark:bg-slate-800 w-1/3" />
          <div className="h-4 rounded-md bg-slate-100 dark:bg-slate-800 w-full" />
          <div className="h-4 rounded-md bg-slate-100 dark:bg-slate-800 w-full" />
          <div className="h-4 rounded-md bg-slate-100 dark:bg-slate-800 w-3/4" />
        </div>
        <div className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}

export default function JobDetailPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();
  const [isApplyOpen, setIsApplyOpen] = useState(false);

  // 1. Fetch Job details (public)
  const {
    data: job,
    isLoading: isJobLoading,
    isError: isJobError,
    refetch: refetchJob,
  } = useQuery({
    queryKey: ['jobDetail', jobId],
    queryFn: async () => {
      const response = await api.get(`/jobs/${jobId}`);
      return response.data?.data;
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  // 2. Fetch User Profile Details to obtain the permanent resumeUrl
  const { data: userProfile } = useQuery({
    queryKey: ['myProfileDetails'],
    queryFn: async () => {
      const response = await api.get('/users/profile');
      return response.data?.data;
    },
    enabled: isAuthenticated && user?.role === 'candidate',
    staleTime: 1000 * 60 * 5,
  });

  // 3. Fetch candidate applications (query check for already applied check)
  const {
    data: myApplicationsRes,
    isLoading: isAppsLoading,
  } = useQuery({
    queryKey: ['myApplicationsCheck'],
    queryFn: async () => {
      // Use existing paginated endpoint to inspect application history
      const response = await api.get('/applications/my', { params: { limit: 100 } });
      return response.data?.data || [];
    },
    enabled: isAuthenticated && user?.role === 'candidate',
    staleTime: 1000 * 60 * 2,
  });

  // 4. Fetch candidate saved jobs to identify bookmarks
  const {
    data: savedJobsRes,
  } = useQuery({
    queryKey: ['mySavedJobsDetails'],
    queryFn: async () => {
      const response = await api.get('/users/saved-jobs');
      return response.data?.data || [];
    },
    enabled: isAuthenticated && user?.role === 'candidate',
    staleTime: 1000 * 60 * 5,
  });

  const savedJobIds = useMemo(() => {
    return savedJobsRes ? savedJobsRes.map((j) => j._id) : [];
  }, [savedJobsRes]);

  const isSaved = savedJobIds.includes(jobId);

  // Identify if candidate has already submitted an application
  const hasApplied = useMemo(() => {
    const apps = myApplicationsRes || [];
    return apps.some((app) => {
      const appId = app.job?._id || app.job;
      return String(appId) === String(jobId);
    });
  }, [myApplicationsRes, jobId]);

  // 5. Mutation: Toggle Bookmark (Save/Unsave Job)
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await api.delete(`/users/saved-jobs/${jobId}`);
      } else {
        await api.post(`/users/saved-jobs/${jobId}`);
      }
    },
    onSuccess: () => {
      toast.success(isSaved ? 'Job removed from saved bookmarks' : 'Job saved to bookmarks successfully');
      queryClient.invalidateQueries({ queryKey: ['mySavedJobsDetails'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save job position');
    },
  });

  // 6. Mutation: Submit application
  const applyMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await api.post(`/applications/${jobId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: (res) => {
      toast.success(res?.message || 'Application submitted successfully');
      setIsApplyOpen(false);
      queryClient.invalidateQueries({ queryKey: ['myApplicationsCheck'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit application');
    },
  });

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      toast.error('Please log in as a candidate to apply.');
      navigate(`/login?returnUrl=/jobs/${jobId}`);
      return;
    }

    if (user?.role !== 'candidate') {
      toast.error('Only candidate user profiles can submit applications.');
      return;
    }

    setIsApplyOpen(true);
  };

  const handleBookmarkToggle = () => {
    if (!isAuthenticated) {
      toast.error('Please log in as a candidate to save job openings.');
      navigate(`/login?returnUrl=/jobs/${jobId}`);
      return;
    }

    if (user?.role !== 'candidate') {
      toast.error('Only candidate user profiles can save job positions.');
      return;
    }

    bookmarkMutation.mutate();
  };

  // Date parsing safety
  const formatDeadline = (dl) => {
    if (!dl) return 'No deadline specified';
    try {
      return format(new Date(dl), 'MMMM d, yyyy');
    } catch (e) {
      return 'Recent';
    }
  };

  const formatSalary = () => {
    if (job?.salaryMin !== undefined && job?.salaryMax !== undefined) {
      return `$${job.salaryMin.toLocaleString()} – $${job.salaryMax.toLocaleString()}`;
    }
    return 'Salary not disclosed';
  };

  const isDeadlinePassed = useMemo(() => {
    if (!job?.applicationDeadline) return false;
    return new Date() > new Date(job.applicationDeadline);
  }, [job]);

  if (isJobLoading || (isAuthenticated && user?.role === 'candidate' && isAppsLoading)) {
    return <PageContainer><SkeletonDetail /></PageContainer>;
  }

  if (isJobError || !job) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[60vh]">
        <div className="p-8 rounded-2xl border border-rose-250 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/10 flex flex-col items-center justify-center text-center gap-4 max-w-sm shadow-sm">
          <AlertTriangle className="w-10 h-10 text-rose-500 animate-bounce" />
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Failed to load job profile
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              This job posting may have been archived, soft-deleted, or the link has expired.
            </p>
          </div>
          <button
            onClick={refetchJob}
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

  const {
    title,
    department,
    location,
    jobType,
    isRemote,
    experienceLevel,
    description,
    requirements,
    responsibilities,
    applicationDeadline,
    status: jobStatus,
    company,
  } = job;

  const isAcceptingApps = jobStatus === 'published' && !isDeadlinePassed;

  return (
    <PageContainer>
      
      {/* Return link */}
      <div className="mb-4">
        <Link
          to="/jobs"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Job Listings</span>
        </Link>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left main content panels */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Job Banner info */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 space-y-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                  {department}
                </span>
                <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-50 leading-tight">
                  {title}
                </h1>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-350 mt-1.5 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{company?.name || 'TalentFlow'}</span>
                </p>
              </div>

              {/* Bookmark buttons */}
              <button
                onClick={handleBookmarkToggle}
                className={cn(
                  'p-2.5 rounded-xl border transition-colors shrink-0 focus-ring',
                  isSaved
                    ? 'border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/20 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                )}
                aria-label={isSaved ? 'Remove bookmark' : 'Bookmark job'}
                type="button"
              >
                <Bookmark className={cn('w-4 h-4', isSaved && 'fill-indigo-650')} />
              </button>
            </div>

            {/* Quick specifications row info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400 dark:text-slate-500 block">Workplace</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{location}</span>
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 dark:text-slate-500 block">Job Type</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="capitalize">{jobType?.replace('-', ' ')}</span>
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 dark:text-slate-500 block">Experience</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="capitalize">{experienceLevel} Level</span>
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 dark:text-slate-500 block">Salary Range</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{formatSalary()}</span>
                </span>
              </div>
            </div>

            {/* Workplace detail badges */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {isRemote && (
                <span className="inline-flex items-center text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/20">
                  Remote Eligible
                </span>
              )}
              {isDeadlinePassed && (
                <span className="inline-flex items-center text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 animate-pulse">
                  Deadline Passed
                </span>
              )}
            </div>
          </div>

          {/* Job Description details section */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                Job Overview
              </h3>
              <p className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                {description}
              </p>
            </div>

            {responsibilities && responsibilities.trim() && (
              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                  Core Responsibilities
                </h3>
                <p className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {responsibilities}
                </p>
              </div>
            )}

            {requirements && requirements.trim() && (
              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                  Position Requirements
                </h3>
                <p className="text-xs text-slate-650 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {requirements}
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Right column sidebar */}
        <div className="space-y-6">
          
          {/* Apply actions panel card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            
            {/* Header info */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Apply for this role
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Submit your profile and cover notes directly to the hiring managers.
              </p>
            </div>

            {/* Deadline status marker */}
            <div className="flex items-start gap-2 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 rounded-xl p-3 text-[11px] font-semibold text-slate-600 dark:text-slate-350">
              <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span>Application Deadline:</span>
                <span className="block text-slate-800 dark:text-slate-200 font-bold mt-0.5">
                  {formatDeadline(applicationDeadline)}
                </span>
              </div>
            </div>

            {/* Conditional Button Actions */}
            {hasApplied ? (
              <button
                disabled
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30 text-xs font-bold rounded-xl disabled:opacity-80"
                type="button"
              >
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Already Applied</span>
              </button>
            ) : !isAcceptingApps ? (
              <button
                disabled
                className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold rounded-xl disabled:opacity-50 cursor-not-allowed"
                type="button"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Applications Closed</span>
              </button>
            ) : isAuthenticated && user?.role !== 'candidate' ? (
              <div className="space-y-2">
                <button
                  disabled
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 text-xs font-bold rounded-xl disabled:opacity-50 cursor-not-allowed"
                  type="button"
                >
                  Apply Now
                </button>
                <p className="text-[10px] text-center text-rose-500 font-semibold leading-relaxed">
                  Only candidate profiles can apply for job openings. Currently logged in as a {user.role?.replace('_', ' ')}.
                </p>
              </div>
            ) : (
              <button
                onClick={handleApplyClick}
                disabled={applyMutation.isPending}
                className="w-full inline-flex items-center justify-center gap-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-[1.01] focus-ring"
                type="button"
              >
                <span>Apply Now</span>
              </button>
            )}
          </div>

          {/* Company details preview card */}
          {company && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                About the Company
              </h4>
              <div className="space-y-3 text-xs">
                <div>
                  <h5 className="font-bold text-slate-800 dark:text-slate-100">
                    {company.name}
                  </h5>
                  {company.industry && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider block mt-0.5">
                      {company.industry}
                    </span>
                  )}
                </div>
                
                {company.location && (
                  <p className="text-slate-600 dark:text-slate-350 font-semibold flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Headquarters: {company.location}</span>
                  </p>
                )}

                {company.website && (
                  <a
                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-650 dark:text-indigo-400 hover:underline"
                  >
                    <span>Visit Company Site</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Apply Modal popup */}
      {isApplyOpen && (
        <ApplyModal
          job={job}
          user={userProfile || user}
          onClose={() => setIsApplyOpen(false)}
          onSubmit={(fd) => applyMutation.mutate(fd)}
          isPending={applyMutation.isPending}
        />
      )}

    </PageContainer>
  );
}
