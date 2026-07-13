// ─── pages/candidate/ApplicationDetailPage.jsx ──────────────────────────────
// Detailed tracking view of a candidate's single application progress.
// API: GET /api/v1/applications/my/:applicationId
// Doc reference: Document 8 — UI Pages § Page 8 Application Details & Status

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { StatusTimeline } from '../../components/candidate/StatusTimeline.jsx';
import { getStatusBadgeClass, getStatusLabel } from '../../utils/statusBadge.js';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Building,
  MapPin,
  Briefcase,
  DollarSign,
  AlertTriangle,
  RotateCw,
  Trash2,
  FileText,
  Clock,
  Video,
  Phone,
} from 'lucide-react';
import { cn } from '../../utils/cn.js';

function SkeletonDetail() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-40 rounded-2xl bg-slate-100 dark:bg-slate-800" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-72 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-72 rounded-2xl bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}

function InterviewFormatIcon({ fmt }) {
  if (fmt === 'video') return <Video className="w-4 h-4 text-indigo-500" />;
  if (fmt === 'phone') return <Phone className="w-4 h-4 text-cyan-500" />;
  return <MapPin className="w-4 h-4 text-amber-500" />;
}

export default function ApplicationDetailPage() {
  const { applicationId } = useParams();
  const queryClient = useQueryClient();

  // 1. Fetch Application Details
  const {
    data: application,
    isLoading: isAppLoading,
    isError: isAppError,
    refetch: refetchApp,
  } = useQuery({
    queryKey: ['myApplicationDetail', applicationId],
    queryFn: async () => {
      const response = await api.get(`/applications/my/${applicationId}`);
      return response.data?.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // 2. Fetch Candidate Dashboard to inspect the single upcoming interview session
  const {
    data: dashboardData,
    isLoading: isDashLoading,
  } = useQuery({
    queryKey: ['candidateDashboardCheck'],
    queryFn: async () => {
      const response = await api.get('/dashboard/candidate');
      return response.data?.data;
    },
    staleTime: 1000 * 60 * 2,
  });

  // 3. Mutation: Withdraw Application
  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const response = await api.patch(`/applications/${applicationId}/withdraw`);
      return response.data;
    },
    onSuccess: (res) => {
      toast.success(res?.message || 'Application withdrawn successfully');
      queryClient.invalidateQueries({ queryKey: ['myApplicationDetail', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      queryClient.invalidateQueries({ queryKey: ['candidateDashboard'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to withdraw application');
    },
  });

  const handleWithdraw = () => {
    const isConfirmed = window.confirm(
      'Are you sure you want to withdraw your application? This action is permanent and cannot be undone.'
    );
    if (isConfirmed) {
      withdrawMutation.mutate();
    }
  };

  // Match upcoming interview to this application by job title
  const matchingInterview = useMemo(() => {
    if (!dashboardData?.upcomingInterview || !application?.job) return null;
    const interviewJobTitle = dashboardData.upcomingInterview.job?.title;
    const appJobTitle = application.job?.title;
    if (interviewJobTitle && appJobTitle && interviewJobTitle === appJobTitle) {
      return dashboardData.upcomingInterview;
    }
    return null;
  }, [dashboardData, application]);

  if (isAppLoading || isDashLoading) {
    return <PageContainer><SkeletonDetail /></PageContainer>;
  }

  if (isAppError || !application) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[60vh]">
        <div className="p-8 rounded-2xl border border-rose-250 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/10 flex flex-col items-center justify-center text-center gap-4 max-w-sm shadow-sm">
          <AlertTriangle className="w-10 h-10 text-rose-500 animate-bounce" />
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Application not found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              This application may have been archived, deleted, or does not belong to your account.
            </p>
          </div>
          <button
            onClick={refetchApp}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl transition-all shadow focus-ring"
            type="button"
          >
            <RotateCw className="w-4 h-4" />
            <span>Retry connection</span>
          </button>
        </div>
      </PageContainer>
    );
  }

  const { job, status, coverNote, statusHistory, appliedAt } = application;
  const isInactive = ['hired', 'rejected', 'withdrawn'].includes(status);
  const isWithdrawn = status === 'withdrawn';

  const formatSalary = () => {
    if (job?.salaryMin !== undefined && job?.salaryMax !== undefined) {
      return `$${job.salaryMin.toLocaleString()} – $${job.salaryMax.toLocaleString()}`;
    }
    return 'Salary not disclosed';
  };

  return (
    <PageContainer>
      
      {/* Return link */}
      <div className="mb-4">
        <Link
          to="/candidate/applications"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Applications</span>
        </Link>
      </div>

      {/* Main Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left main information column (job description + cover letter) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Job summary header */}
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl p-6 md:p-8 space-y-5 shadow-sm">
            <div>
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">
                {job?.department || 'Department'}
              </span>
              <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-slate-50 leading-tight">
                {job?.title || 'Position'}
              </h1>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-350 mt-1.5 flex items-center gap-1.5">
                <Building className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{job?.company?.name || 'TalentFlow'}</span>
              </p>
            </div>

            {/* Parameters list grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400 dark:text-slate-500 block">Workplace</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{job?.location || 'Office'}</span>
                </span>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 dark:text-slate-500 block">Job Type</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="capitalize">{job?.jobType?.replace('-', ' ')}</span>
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
          </div>

          {/* Cover note card */}
          {coverNote && coverNote.trim() && (
            <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl p-6 md:p-8 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-450 dark:text-slate-555 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                <span>My Cover Letter / Message</span>
              </h3>
              <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed whitespace-pre-wrap bg-slate-50/50 dark:bg-slate-950/20 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
                {coverNote}
              </p>
            </div>
          )}

          {/* Application Status Timeline */}
          <StatusTimeline statusHistory={statusHistory} currentStatus={status} />

        </div>

        {/* Right column sidebar */}
        <div className="space-y-6">
          
          {/* Status Panel summary */}
          <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Application Status
              </h4>
              <div className="flex items-center gap-2 pt-1.5">
                <span className={cn('text-xs py-1 px-3', getStatusBadgeClass(status))}>
                  {getStatusLabel(status)}
                </span>
                {appliedAt && (
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold block mt-0.5">
                    Applied {format(new Date(appliedAt), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
            </div>

            {/* Withdraw trigger */}
            {!isInactive ? (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  onClick={handleWithdraw}
                  disabled={withdrawMutation.isPending}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/10 hover:bg-rose-50/30 text-rose-600 dark:text-rose-450 font-bold transition-all hover:scale-[1.01] focus-ring disabled:opacity-40"
                  type="button"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Withdraw Application</span>
                </button>
              </div>
            ) : isWithdrawn ? (
              <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-150 dark:border-slate-850 rounded-xl text-center leading-relaxed">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  This application was withdrawn and is no longer being reviewed.
                </span>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-950 p-4 border border-slate-150 dark:border-slate-850 rounded-xl text-center leading-relaxed">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  This application has concluded. No further changes can be made.
                </span>
              </div>
            )}
          </div>

          {/* Upcoming scheduled interview panel card */}
          {matchingInterview && (
            <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Interview Scheduled</span>
              </h4>
              
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center shrink-0">
                    <InterviewFormatIcon fmt={matchingInterview.format} />
                  </div>
                  <div>
                    <span className="font-bold text-slate-850 dark:text-slate-100 capitalize block">
                      {matchingInterview.format?.replace('-', ' ')} Interview
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                      {format(new Date(matchingInterview.scheduledAt), 'EEEE, MMM d · h:mm a')}
                    </span>
                  </div>
                </div>

                {matchingInterview.candidateInstructions && (
                  <div className="bg-slate-50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 leading-relaxed text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5 uppercase tracking-wider text-[9px]">
                      Preparations Required:
                    </span>
                    <p className="whitespace-pre-wrap">{matchingInterview.candidateInstructions}</p>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

      </div>

    </PageContainer>
  );
}
