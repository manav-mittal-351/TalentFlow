// ─── pages/recruiter/JobPipelinePage.jsx ──────────────────────────────────────
// Recruiter applicants pipeline manager for a specific job opening.
// Fetches list of candidates via GET /api/v1/applications/job/:jobId.
// Document reference: Document 8 — UI Pages § Page 15 Job Pipeline

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { PipelineStats } from '../../components/jobs/PipelineStats.jsx';
import { PipelineFilters } from '../../components/jobs/PipelineFilters.jsx';
import { CandidateRow } from '../../components/jobs/CandidateRow.jsx';
import { CandidateCard } from '../../components/jobs/CandidateCard.jsx';
import { ROUTES } from '../../constants/routes.js';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Edit2,
  Users,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';

export default function JobPipelinePage() {
  const { jobId } = useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Component filter and pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Active dropdown action ID
  const [activeMenuId, setActiveMenuId] = useState(null);

  // 1. Fetch Job detail headers using TanStack Query
  const {
    data: jobData,
    isLoading: isJobLoading,
    isError: isJobError,
  } = useQuery({
    queryKey: ['jobDetails', jobId],
    queryFn: async () => {
      const response = await api.get(`/jobs/${jobId}`);
      return response.data?.data;
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  // 2. Fetch Candidate Applications list using TanStack Query
  const {
    data: appsResponse,
    isLoading: isAppsLoading,
    isError: isAppsError,
    refetch: refetchApps,
  } = useQuery({
    queryKey: ['jobApplications', jobId, searchQuery, statusFilter, sortBy, page],
    queryFn: async () => {
      const params = {
        page,
        limit,
        sortBy,
      };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter) params.status = statusFilter;

      const response = await api.get(`/applications/job/${jobId}`, { params });
      return response.data;
    },
    staleTime: 1000 * 60 * 2, // 2 min cache
  });

  const appsList = useMemo(() => appsResponse?.data || [], [appsResponse]);
  const pagination = appsResponse?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  // 3. Status Mutation: Calls PATCH /api/v1/applications/:id/status
  const statusMutation = useMutation({
    mutationFn: async ({ appId, nextStatus }) => {
      const response = await api.patch(`/applications/${appId}/status`, { status: nextStatus });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Candidate stage status updated successfully');
      // Invalidate relevant query list
      queryClient.invalidateQueries({ queryKey: ['jobApplications', jobId] });
      setActiveMenuId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update candidate status');
    },
  });

  // Toggle Dropdown actions
  const toggleMenu = useCallback((appId) => {
    setActiveMenuId((prev) => (prev === appId ? null : appId));
  }, []);

  // Update Status callback
  const handleStatusUpdate = useCallback((appId, nextStatus) => {
    statusMutation.mutate({ appId, nextStatus });
  }, [statusMutation]);

  // Route candidate review callback
  const handleViewProfile = useCallback((appId) => {
    const app = appsList.find((a) => a._id === appId);
    const candidateId = app?.candidate?._id;
    if (candidateId) {
      navigate(`/recruiter/candidates/${candidateId}`);
    } else {
      toast.error('Candidate details not found');
    }
  }, [appsList, navigate]);

  // Compute live pipeline breakdown counts from local fetched response data
  const pipelineStats = useMemo(() => {
    let total = pagination.total || 0;
    let active = 0;
    let hired = 0;

    // Iterate over visible lists to get dynamic visual stats markers
    appsList.forEach((app) => {
      if (app.status === 'hired') hired++;
      if (app.status !== 'hired' && app.status !== 'rejected' && app.status !== 'withdrawn') {
        active++;
      }
    });

    return { total, active, hired };
  }, [appsList, pagination.total]);

  // Main UI Resolution
  if (isJobLoading || isAppsLoading) {
    return (
      <PageContainer className="animate-pulse">
        <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-2">
            <Skeleton variant="text" width="220px" height="28px" />
            <Skeleton variant="text" width="160px" height="16px" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
          <Skeleton variant="stat" />
          <Skeleton variant="stat" />
          <Skeleton variant="stat" />
        </div>
        <div className="mt-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-8">
          <Skeleton variant="text" width="100%" height="240px" />
        </div>
      </PageContainer>
    );
  }

  if (isJobError || isAppsError) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[70vh]">
        <div className="p-6 rounded-2xl border border-rose-250 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/10 flex flex-col items-center justify-center text-center gap-4 max-w-md shadow-sm">
          <AlertTriangle className="w-10 h-10 text-rose-500 animate-bounce" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Failed to load Candidate Pipeline
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Encountered API retrieval issues or the selected job posting does not exist.
            </p>
          </div>
          <button
            onClick={() => refetchApps()}
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

  // Create Job status display tag
  const getJobStatusBadge = () => {
    const base = 'inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ml-2';
    switch (jobData?.status) {
      case 'published':
        return <span className={`${base} bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400`}>Published</span>;
      case 'draft':
        return <span className={`${base} bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400`}>Draft</span>;
      default:
        return <span className={`${base} bg-rose-50 dark:bg-rose-950/30 text-rose-650 dark:text-rose-400`}>{jobData?.status}</span>;
    }
  };

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title={
          <div className="flex items-center flex-wrap">
            <span>{jobData?.title || 'Job Pipeline'}</span>
            {getJobStatusBadge()}
          </div>
        }
        description={`Department: ${jobData?.department || 'N/A'} · Active applications catalog.`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to={ROUTES.RECRUITER.JOBS}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold shadow-sm transition-all focus-ring"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>Back to Jobs</span>
            </Link>
            <Link
              to={`/recruiter/jobs/${jobId}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all hover:scale-[1.01] focus-ring"
            >
              <Edit2 className="w-4 h-4 shrink-0" />
              <span>Edit Job</span>
            </Link>
          </div>
        }
      />

      {/* 1. Pipeline Summary stats indicators */}
      <PipelineStats
        totalCount={pipelineStats.total}
        activeCount={pipelineStats.active}
        hiredCount={pipelineStats.hired}
      />

      {/* 2. Control Row: Search parameters & sorting selectors */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
        <PipelineFilters
          searchQuery={searchQuery}
          onSearchChange={(val) => {
            setSearchQuery(val);
            setPage(1);
          }}
          statusFilter={statusFilter}
          onStatusChange={(val) => {
            setStatusFilter(val);
            setPage(1);
          }}
          sortBy={sortBy}
          onSortChange={(val) => {
            setSortBy(val);
            setPage(1);
          }}
        />
      </div>

      {/* Results details text indicator */}
      <div className="text-xs text-slate-450 dark:text-slate-400 font-semibold">
        Showing {appsList.length} of {pagination.total} candidates matching filters
      </div>

      {/* 3. Applicants pipeline directory list */}
      {appsList.length === 0 ? (
        /* Empty pipeline state */
        <div className="p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 bg-white dark:bg-slate-900 max-w-lg mx-auto shadow-sm">
          <Users className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            No Applications Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
            {searchQuery || statusFilter
              ? 'Try adjusting your search terms or clearing active stage filter selections.'
              : 'Share the careers posting URL link on public boards to start receiving applicant resumes.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table Layout */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left text-sm border-collapse" role="table">
              <thead className="text-xs font-bold text-slate-450 bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800 uppercase">
                <tr>
                  <th className="py-3 px-4 font-semibold" scope="col">Candidate</th>
                  <th className="py-3 px-3 font-semibold" scope="col">Stage</th>
                  <th className="py-3 px-3 font-semibold" scope="col">Applied</th>
                  <th className="py-3 px-3 font-semibold" scope="col">Review Score</th>
                  <th className="py-3 px-4 font-semibold text-right" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {appsList.map((app) => (
                  <CandidateRow
                    key={app._id}
                    application={app}
                    onViewProfile={handleViewProfile}
                    onStatusUpdateClick={handleStatusUpdate}
                    activeMenuId={activeMenuId}
                    onToggleMenu={toggleMenu}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Card Layout */}
          <div className="md:hidden flex flex-col gap-3">
            {appsList.map((app) => (
              <CandidateCard
                key={app._id}
                application={app}
                onViewProfile={handleViewProfile}
                onStatusUpdateClick={handleStatusUpdate}
                activeMenuId={activeMenuId}
                onToggleMenu={toggleMenu}
              />
            ))}
          </div>

          {/* Pagination bottom bar */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-150/70 dark:border-slate-800/80 pt-4 mt-6">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1 || statusMutation.isPending}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-350 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus-ring"
                  aria-label="Previous page"
                  type="button"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages || statusMutation.isPending}
                  onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-350 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus-ring"
                  aria-label="Next page"
                  type="button"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </PageContainer>
  );
}
