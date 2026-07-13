// ─── pages/hiring-manager/HMCandidateDetailPage.jsx ────────────────────────────
// Detailed candidate evaluation interface for Hiring Managers. Displays profile info,
// resumes, timeline activity, and manages scorecard evaluation submissions.

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { CandidateProfileCard } from '../../components/candidate/CandidateProfileCard.jsx';
import { ResumeViewer } from '../../components/candidate/ResumeViewer.jsx';
import { StatusTimeline } from '../../components/candidate/StatusTimeline.jsx';
import { FeedbackForm } from '../../components/interviews/FeedbackForm.jsx';
import { FeedbackCard } from '../../components/interviews/FeedbackCard.jsx';
import api from '../../services/api.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import {
  ArrowLeft,
  AlertTriangle,
  RotateCw,
  FileText,
  Clock,
  HelpCircle,
} from 'lucide-react';

export default function HMCandidateDetailPage() {
  const { candidateId } = useParams(); // candidateId route param maps to application ID
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [isCoverNoteOpen, setIsCoverNoteOpen] = useState(false);

  // 1. Fetch Candidate Application Details
  const {
    data: application,
    isLoading: isAppLoading,
    isError: isAppError,
    refetch: refetchApp,
  } = useQuery({
    queryKey: ['applicationDetails', candidateId],
    queryFn: async () => {
      const response = await api.get(`/applications/${candidateId}`);
      return response.data?.data;
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  // 2. Fetch Feedback Scorecards for this application
  const {
    data: feedbacks,
    isLoading: isFeedbacksLoading,
    isError: isFeedbacksError,
    refetch: refetchFeedbacks,
  } = useQuery({
    queryKey: ['applicationFeedbacks', candidateId],
    queryFn: async () => {
      const response = await api.get(`/feedback/application/${candidateId}`);
      return response.data?.data || [];
    },
    staleTime: 1000 * 60 * 2,
  });

  // 3. Fetch Interviews conducted by this HM (to discover completed interviews)
  const {
    data: interviewsData,
    isLoading: isInterviewsLoading,
    isError: isInterviewsError,
    refetch: refetchInterviews,
  } = useQuery({
    queryKey: ['hmInterviews'],
    queryFn: async () => {
      const response = await api.get('/interviews');
      return response.data?.data || [];
    },
    staleTime: 1000 * 60 * 2,
  });

  const interviewsList = useMemo(() => interviewsData || [], [interviewsData]);

  // Scoped interviews for this specific candidate application
  const myCompletedInterview = useMemo(() => {
    return interviewsList.find((int) => {
      const intAppId = int.application?._id || int.application;
      const isThisApp = String(intAppId) === String(candidateId);
      const isAssignedToMe = int.interviewer?._id === user?._id || int.interviewer === user?._id;
      return isThisApp && isAssignedToMe && int.status === 'completed';
    });
  }, [interviewsList, candidateId, user?._id]);

  // Find if current HM has already submitted feedback
  const myFeedback = useMemo(() => {
    if (!feedbacks) return null;
    return feedbacks.find(
      (f) => f.submittedBy?._id === user?._id || f.submittedBy === user?._id
    );
  }, [feedbacks, user?._id]);

  // Feedbacks from OTHER hiring managers
  const otherFeedbacks = useMemo(() => {
    if (!feedbacks) return [];
    return feedbacks.filter(
      (f) => f.submittedBy?._id !== user?._id && f.submittedBy !== user?._id
    );
  }, [feedbacks, user?._id]);

  const handleFeedbackSuccess = () => {
    setIsEditing(false);
    queryClient.invalidateQueries(['applicationFeedbacks', candidateId]);
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleTryAgainAll = () => {
    refetchApp();
    refetchFeedbacks();
    refetchInterviews();
  };

  const isLoading = isAppLoading || isFeedbacksLoading || isInterviewsLoading;
  const isError = isAppError || isFeedbacksError || isInterviewsError;

  if (isLoading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton variant="text" width="140px" height="20px" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton variant="card" height="240px" />
              <Skeleton variant="card" height="120px" />
            </div>
            <div className="space-y-6">
              <Skeleton variant="card" height="200px" />
              <Skeleton variant="card" height="180px" />
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isError || !application) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
          <AlertTriangle className="w-12 h-12 text-rose-500 animate-bounce" />
          <h3 className="text-base font-bold text-slate-805 dark:text-slate-100">
            Could Not Find Candidate Application
          </h3>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            The candidate record does not exist or you do not have permission to view jobs in their department.
          </p>
          <button
            onClick={handleTryAgainAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-650 text-white hover:bg-indigo-700 active:scale-98 transition-all shadow-sm"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      </PageContainer>
    );
  }

  const candidate = application.candidate;
  const job = application.job;

  return (
    <PageContainer>
      <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-400">
        <Link
          to={`/hiring-manager/jobs/${job?._id}`}
          className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Job Pipeline</span>
        </Link>
      </div>

      <PageHeader
        title={candidate?.name}
        description={`Applying for: ${job?.title} · Status History`}
        badge={
          <Badge
            label={application.status === 'interview' ? 'Interviewing' : 'Shortlisted'}
            variant={application.status === 'interview' ? 'warning' : 'purple'}
          />
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Left Column: Candidate Info and History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Candidate Profile Details */}
          <CandidateProfileCard candidate={candidate} />

          {/* Resume Download Viewer */}
          <ResumeViewer applicationId={candidateId} resumeUrl={application.resumeUrl} />

          {/* Cover Note Section */}
          {application.coverNote && (
            <div className="border border-slate-205 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-5 space-y-3 shadow-sm">
              <button
                onClick={() => setIsCoverNoteOpen((p) => !p)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-805 dark:text-slate-200 focus-ring"
                type="button"
              >
                <div className="flex items-center gap-1.5 uppercase tracking-wide">
                  <FileText className="w-4 h-4 text-slate-405 shrink-0" />
                  <span>Candidate Cover Note</span>
                </div>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline">
                  {isCoverNoteOpen ? 'Collapse' : 'Expand'}
                </span>
              </button>

              {isCoverNoteOpen && (
                <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/20 p-3 rounded-xl border border-slate-100 dark:border-slate-850 whitespace-pre-wrap leading-relaxed">
                  {application.coverNote}
                </p>
              )}
            </div>
          )}

          {/* Scoped Application Status Log */}
          <StatusTimeline
            statusHistory={application.statusHistory}
            currentStatus={application.status}
          />
        </div>

        {/* Right Column: Scorecard Evaluations */}
        <div className="space-y-6">
          
          {/* Section A: Current Status Badge */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-5 space-y-3 shadow-sm">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Application Stage
            </h4>
            <div className="flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {application.status === 'interview' ? 'In Active Interviews' : 'Shortlisted for Review'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed font-semibold">
              Recruiters manage stage transitions. You provide evaluations for candidate interviews.
            </p>
          </div>

          {/* Section B: Scorecard Submission / View Card */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
              Your Evaluation Scorecard
            </h4>

            {myFeedback && !isEditing ? (
              <FeedbackCard feedback={myFeedback} onEditClick={handleEditClick} />
            ) : isEditing || (!myFeedback && myCompletedInterview) ? (
              <FeedbackForm
                interviewId={myCompletedInterview?._id || myFeedback?.interview?._id}
                applicationId={candidateId}
                initialFeedback={myFeedback}
                onSuccess={handleFeedbackSuccess}
                onCancel={myFeedback ? handleCancelEdit : null}
              />
            ) : (
              <div className="border border-dashed border-slate-205 dark:border-slate-800 rounded-2xl p-6 text-center space-y-2 bg-slate-50/20 dark:bg-slate-950/5">
                <HelpCircle className="w-8 h-8 text-slate-350 mx-auto" />
                <h5 className="text-xs font-bold text-slate-805 dark:text-slate-200">
                  No Active Scorecard Request
                </h5>
                <p className="text-[10px] text-slate-400 dark:text-slate-505 max-w-[200px] mx-auto leading-relaxed">
                  Evaluations require a completed interview. Ensure recruiters have logged the completion of your interview panel.
                </p>
              </div>
            )}
          </div>

          {/* Section C: Scorecards by Other Managers */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">
              Colleague Scorecards ({otherFeedbacks.length})
            </h4>

            {otherFeedbacks.length === 0 ? (
              <div className="border border-dashed border-slate-205 dark:border-slate-800 rounded-2xl p-6 text-center text-[10px] text-slate-400 italic bg-slate-50/10 dark:bg-slate-950/5">
                No evaluations submitted by other managers for this application round.
              </div>
            ) : (
              <div className="space-y-4">
                {otherFeedbacks.map((f) => (
                  <FeedbackCard key={f._id} feedback={f} />
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </PageContainer>
  );
}
