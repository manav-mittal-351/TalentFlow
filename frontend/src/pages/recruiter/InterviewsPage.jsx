// ─── pages/recruiter/InterviewsPage.jsx ───────────────────────────────────────
// Recruiter interviews schedule directory.
// Displays upcoming and past interview rounds, status filters, and action controls.

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import api from '../../services/api.js';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  Video,
  Phone,
  MapPin,
  AlertTriangle,
  RotateCw,
  Search,
  X,
  ChevronRight,
  User,
  Building,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const STATUS_FILTERS = [
  { value: '', label: 'All Interviews' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function InterviewsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelModalId, setCancelModalId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  // 1. Fetch Interviews from GET /api/v1/interviews
  const {
    data: interviewsData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['interviews', statusFilter],
    queryFn: async () => {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const response = await api.get('/interviews', { params });
      return response.data;
    },
  });

  const interviewsList = interviewsData?.data || [];

  // 2. Status Mutation: Calls PATCH /api/v1/interviews/:id/status
  const statusMutation = useMutation({
    mutationFn: async ({ interviewId, nextStatus }) => {
      const response = await api.patch(`/interviews/${interviewId}/status`, { status: nextStatus });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Interview status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update interview status');
    },
  });

  // 3. Cancel Mutation: Calls PATCH /api/v1/interviews/:id/cancel
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const response = await api.patch(`/interviews/${cancelModalId}/cancel`, {
        reason: cancelReason || 'Cancelled by recruiter',
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Interview cancelled');
      queryClient.invalidateQueries({ queryKey: ['interviews'] });
      setCancelModalId(null);
      setCancelReason('');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to cancel interview');
    },
  });

  // Filter client search queries
  const filteredInterviews = interviewsList.filter((int) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const candName = int.application?.candidate?.name?.toLowerCase() || '';
    const jobTitle = int.job?.title?.toLowerCase() || '';
    const roundName = int.roundName?.toLowerCase() || '';
    return candName.includes(q) || jobTitle.includes(q) || roundName.includes(q);
  });

  const getFormatIcon = (fmt) => {
    switch (fmt) {
      case 'video':
        return <Video className="w-4 h-4 text-indigo-500" />;
      case 'phone':
        return <Phone className="w-4 h-4 text-cyan-500" />;
      default:
        return <MapPin className="w-4 h-4 text-emerald-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const base = 'inline-flex items-center text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full';
    switch (status) {
      case 'scheduled':
        return <span className={`${base} bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800`}>Scheduled</span>;
      case 'completed':
        return <span className={`${base} bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800`}>Completed</span>;
      case 'cancelled':
        return <span className={`${base} bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800`}>Cancelled</span>;
      default:
        return <span className={`${base} bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400`}>{status}</span>;
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Interviews Directory"
        description="Schedule, track, and manage technical interview rounds with active candidates."
      />

      {/* Control filters bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 my-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate, job title, or round name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus-ring"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              type="button"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex overflow-x-auto gap-2 scrollbar-none w-full sm:w-auto">
          {STATUS_FILTERS.map((opt) => {
            const isActive = statusFilter === opt.value;
            return (
              <button
                key={opt.label}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all focus-ring ${
                  isActive
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
                type="button"
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main List View */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <Skeleton variant="text" width="180px" height="20px" />
              <Skeleton variant="text" width="140px" height="14px" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/10 flex flex-col items-center justify-center text-center gap-3 max-w-md mx-auto">
          <AlertTriangle className="w-8 h-8 text-rose-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Failed to load interview schedule
          </h3>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl shadow-sm focus-ring"
            type="button"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Retry connection</span>
          </button>
        </div>
      ) : filteredInterviews.length === 0 ? (
        <div className="p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3 bg-white dark:bg-slate-900 max-w-lg mx-auto shadow-sm">
          <Calendar className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            No Interviews Scheduled
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {searchQuery || statusFilter
              ? 'Try modifying your search filter selections.'
              : 'Schedule interview rounds directly from active candidate profiles in your job pipelines.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInterviews.map((int) => {
            const candName = int.application?.candidate?.name || 'Applicant Candidate';
            const jobTitle = int.job?.title || 'Job Opening';
            const formattedDate = int.scheduledAt ? format(new Date(int.scheduledAt), 'PPP p') : 'TBD';

            return (
              <div
                key={int._id}
                className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                <div className="space-y-2 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-base">
                      {int.roundName || 'Interview Round'}
                    </span>
                    {getStatusBadge(int.status)}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 flex-wrap">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{candName}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      <span>{jobTitle}</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>{formattedDate}</span>
                    </div>
                  </div>

                  {int.meetingLink && (
                    <a
                      href={int.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-1"
                    >
                      {getFormatIcon(int.format)}
                      <span>Join Meeting Link</span>
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                  {int.application?._id && (
                    <Link
                      to={`/recruiter/candidates/${int.application._id}`}
                      className="px-3.5 py-2 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl transition-colors inline-flex items-center gap-1"
                    >
                      <span>View Application</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </Link>
                  )}

                  {int.status === 'scheduled' && (
                    <>
                      <button
                        onClick={() => statusMutation.mutate({ interviewId: int._id, nextStatus: 'completed' })}
                        className="px-3 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-transform hover:scale-[1.01]"
                        type="button"
                      >
                        Mark Completed
                      </button>
                      <button
                        onClick={() => setCancelModalId(int._id)}
                        className="px-3 py-2 text-xs font-bold border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                        type="button"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Cancel Interview Round
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please provide a reason for cancelling this scheduled interview. The candidate will be notified.
            </p>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Schedule conflict or candidate requested postponement..."
              className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus-ring"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setCancelModalId(null);
                  setCancelReason('');
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                type="button"
              >
                Back
              </button>
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={cancelMutation.isPending}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm"
                type="button"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
