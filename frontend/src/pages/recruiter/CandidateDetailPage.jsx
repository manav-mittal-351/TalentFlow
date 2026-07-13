// ─── pages/recruiter/CandidateDetailPage.jsx ──────────────────────────────────
// Recruiter interface reviewing candidate profile details, timeline logs, notes,
// and scheduled interviews.
// Document reference: Document 8 — UI Pages § Page 16 Candidate Detail

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { CandidateProfileCard } from '../../components/candidate/CandidateProfileCard.jsx';
import { ResumeViewer } from '../../components/candidate/ResumeViewer.jsx';
import { StatusTimeline } from '../../components/candidate/StatusTimeline.jsx';
import { RecruiterNotes } from '../../components/candidate/RecruiterNotes.jsx';
import { InterviewCard } from '../../components/candidate/InterviewCard.jsx';
import { InterviewForm } from '../../components/candidate/InterviewForm.jsx';
import { APPLICATION_STATUSES } from '../../constants/statuses.js';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn.js';
import {
  ArrowLeft,
  Calendar,
  ChevronDown,
  AlertTriangle,
  RotateCw,
  Clock,
} from 'lucide-react';

export default function CandidateDetailPage() {
  const { applicationId } = useParams();
  const queryClient = useQueryClient();

  // Modal open controllers
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState(null);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // 1. Fetch Candidate Application Details
  const {
    data: application,
    isLoading: isAppLoading,
    isError: isAppError,
    refetch: refetchApp,
  } = useQuery({
    queryKey: ['applicationDetails', applicationId],
    queryFn: async () => {
      const response = await api.get(`/applications/${applicationId}`);
      return response.data?.data;
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  // 2. Fetch Recruiter Interviews List (filtered on client-side)
  const {
    data: interviewsResponse,
    isLoading: isInterviewsLoading,
    isError: isInterviewsError,
    refetch: refetchInterviews,
  } = useQuery({
    queryKey: ['recruiterInterviews'],
    queryFn: async () => {
      const response = await api.get('/interviews');
      return response.data?.data;
    },
    staleTime: 1000 * 60 * 2, // 2 min cache
  });

  const interviewsList = useMemo(() => interviewsResponse || [], [interviewsResponse]);

  // Filter interviews to only include those for this application
  const filteredInterviews = useMemo(() => {
    return interviewsList.filter((i) => {
      const interviewAppId = i.application?._id || i.application;
      return String(interviewAppId) === String(applicationId);
    });
  }, [interviewsList, applicationId]);

  // 3. Mutation: Update Recruiter Private Notes
  const notesMutation = useMutation({
    mutationFn: async (recruiterNotes) => {
      const response = await api.patch(`/applications/${applicationId}/notes`, { recruiterNotes });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Recruiter notes saved');
      queryClient.invalidateQueries({ queryKey: ['applicationDetails', applicationId] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save notes');
    },
  });

  // 4. Mutation: Update Application pipeline status
  const statusMutation = useMutation({
    mutationFn: async (nextStatus) => {
      const response = await api.patch(`/applications/${applicationId}/status`, { status: nextStatus });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Application status updated');
      queryClient.invalidateQueries({ queryKey: ['applicationDetails', applicationId] });
      queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
      setIsStatusDropdownOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update application status');
    },
  });

  // 5. Mutation: Schedule new interview session
  const scheduleMutation = useMutation({
    mutationFn: async (formData) => {
      const payload = {
        applicationId,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        format: formData.format,
        location: formData.location || '',
        candidateInstructions: formData.candidateInstructions || '',
        interviewerId: formData.interviewerId || null,
      };
      const response = await api.post('/interviews', payload);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Interview scheduled successfully');
      queryClient.invalidateQueries({ queryKey: ['recruiterInterviews'] });
      queryClient.invalidateQueries({ queryKey: ['applicationDetails', applicationId] });
      setIsScheduleOpen(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to schedule interview');
    },
  });

  // 6. Mutation: Reschedule / Edit existing interview details
  const editInterviewMutation = useMutation({
    mutationFn: async ({ interviewId, formData }) => {
      const payload = {
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        format: formData.format,
        location: formData.location || '',
        candidateInstructions: formData.candidateInstructions || '',
        interviewerId: formData.interviewerId || null,
      };
      const response = await api.patch(`/interviews/${interviewId}`, payload);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Interview details modified successfully');
      queryClient.invalidateQueries({ queryKey: ['recruiterInterviews'] });
      setEditingInterview(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update interview details');
    },
  });

  // 7. Mutation: Invalidate / Complete scheduled interview
  const interviewStatusMutation = useMutation({
    mutationFn: async ({ interviewId, nextStatus }) => {
      const response = await api.patch(`/interviews/${interviewId}/status`, { status: nextStatus });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Interview status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['recruiterInterviews'] });
      queryClient.invalidateQueries({ queryKey: ['applicationDetails', applicationId] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update interview status');
    },
  });

  // Action callbacks
  const handleSaveNotes = useCallback((text) => {
    notesMutation.mutate(text);
  }, [notesMutation]);

  const handleStatusChange = useCallback((st) => {
    statusMutation.mutate(st);
  }, [statusMutation]);

  const handleScheduleSubmit = useCallback((data) => {
    scheduleMutation.mutate(data);
  }, [scheduleMutation]);

  const handleEditSubmit = useCallback((data) => {
    if (editingInterview?._id) {
      editInterviewMutation.mutate({ interviewId: editingInterview._id, formData: data });
    }
  }, [editInterviewMutation, editingInterview]);

  const handleInterviewStatus = useCallback((interviewId, nextStatus) => {
    interviewStatusMutation.mutate({ interviewId, nextStatus });
  }, [interviewStatusMutation]);

  const handleEditClick = useCallback((interview) => {
    // Format date for datetime-local picker
    const localDate = interview.scheduledAt ? interview.scheduledAt.substring(0, 16) : '';
    setEditingInterview({
      ...interview,
      scheduledAt: localDate,
      interviewerId: interview.interviewer?._id || interview.interviewer || '',
    });
  }, []);

  // Format stages label
  const formatStage = (st) => {
    return st.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Main view logic
  if (isAppLoading || isInterviewsLoading) {
    return (
      <PageContainer className="animate-pulse">
        <div className="flex items-center justify-between pb-5 border-b border-slate-205 dark:border-slate-800">
          <div className="space-y-2">
            <Skeleton variant="text" width="220px" height="28px" />
            <Skeleton variant="text" width="160px" height="16px" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton variant="text" width="100%" height="200px" />
            <Skeleton variant="text" width="100%" height="150px" />
          </div>
          <div className="space-y-6">
            <Skeleton variant="text" width="100%" height="180px" />
            <Skeleton variant="text" width="100%" height="180px" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isAppError || isInterviewsError) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[70vh]">
        <div className="p-6 rounded-2xl border border-rose-250 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/10 flex flex-col items-center justify-center text-center gap-4 max-w-md shadow-sm">
          <AlertTriangle className="w-10 h-10 text-rose-500 animate-bounce" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Failed to load Candidate details
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Encountered API failures or the selected application details do not exist.
            </p>
          </div>
          <button
            onClick={() => {
              refetchApp();
              refetchInterviews();
            }}
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

  const { candidate, job, status, recruiterNotes, statusHistory } = application;
  const isSchedulable = status === 'shortlisted' || status === 'interview';

  return (
    <PageContainer>
      {/* Action Header */}
      <PageHeader
        title={candidate?.name || 'Candidate profile'}
        description={
          <div className="flex items-center gap-1 flex-wrap">
            <span>Applying for</span>
            <span className="font-bold text-slate-850 dark:text-slate-200">
              {job?.title || 'Job vacancy'}
            </span>
            <span>in</span>
            <span className="font-semibold text-slate-550 dark:text-slate-400">
              {job?.department}
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            {job?._id && (
              <Link
                to={`/recruiter/jobs/${job._id}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold shadow-sm transition-all focus-ring"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span>Back to Pipeline</span>
              </Link>
            )}

            {/* Status updates selector dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsStatusDropdownOpen((prev) => !prev)}
                className="inline-flex items-center gap-1 px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-755 dark:text-slate-150 rounded-xl text-xs font-semibold transition-all focus-ring hover:bg-slate-50 dark:hover:bg-slate-850"
                type="button"
                aria-expanded={isStatusDropdownOpen}
              >
                <span>Stage: {formatStage(status)}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {isStatusDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsStatusDropdownOpen(false)} />
                  <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg z-50 py-1 flex flex-col text-left">
                    {APPLICATION_STATUSES.map((stKey) => (
                      <button
                        key={stKey}
                        onClick={() => handleStatusChange(stKey)}
                        disabled={statusMutation.isPending}
                        className={cn(
                          'px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-800 text-left',
                          status === stKey && 'text-indigo-650 dark:text-indigo-400 bg-indigo-50/10'
                        )}
                        type="button"
                      >
                        {formatStage(stKey)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Schedule Interview Trigger */}
            <button
              onClick={() => {
                if (!isSchedulable) {
                  toast.error('Candidate must be shortlisted or in interviewing stage to schedule an interview');
                  return;
                }
                setIsScheduleOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow transition-all focus-ring hover:scale-[1.01] disabled:opacity-50"
              type="button"
              disabled={!isSchedulable}
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule Interview</span>
            </button>
          </div>
        }
      />

      {/* Grid columns layout: Left (Profile info + Resume + Timeline) & Right (Notes + Interviews schedules) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Left Columns (Col Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <CandidateProfileCard candidate={candidate} />

          {/* Timeline and History logs */}
          <StatusTimeline statusHistory={statusHistory} currentStatus={status} />
        </div>

        {/* Right Sidebar Columns */}
        <div className="space-y-6">
          {/* Resume Viewer */}
          <ResumeViewer applicationId={applicationId} resumeUrl={candidate?.profile?.resumeUrl} />

          {/* Notes Panel */}
          <RecruiterNotes
            notes={recruiterNotes}
            onSave={handleSaveNotes}
            isPending={notesMutation.isPending}
          />

          {/* Interviews section */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Interviews Scheduled ({filteredInterviews.length})</span>
            </h3>

            {filteredInterviews.length === 0 ? (
              <div className="border border-slate-205 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-5 text-center text-xs text-slate-450 dark:text-slate-500 font-semibold space-y-1.5 shadow-sm">
                <p>No interviews scheduled yet.</p>
                {isSchedulable && (
                  <button
                    onClick={() => setIsScheduleOpen(true)}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline"
                    type="button"
                  >
                    Schedule first interview
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInterviews.map((iv) => (
                  <InterviewCard
                    key={iv._id}
                    interview={iv}
                    onStatusChange={handleInterviewStatus}
                    onEditClick={handleEditClick}
                    isPending={interviewStatusMutation.isPending}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Interview Modal overlay */}
      {isScheduleOpen && (
        <InterviewForm
          onClose={() => setIsScheduleOpen(false)}
          onSubmit={handleScheduleSubmit}
          isPending={scheduleMutation.isPending}
          title="Schedule Interview Session"
          submitButtonText="Schedule Session"
        />
      )}

      {/* Edit/Reschedule Interview Modal overlay */}
      {editingInterview && (
        <InterviewForm
          defaultValues={editingInterview}
          onClose={() => setEditingInterview(null)}
          onSubmit={handleEditSubmit}
          isPending={editInterviewMutation.isPending}
          title="Reschedule Interview Session"
          submitButtonText="Update Schedule"
        />
      )}

    </PageContainer>
  );
}
