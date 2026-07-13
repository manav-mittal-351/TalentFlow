// ─── pages/hiring-manager/HMJobPipelinePage.jsx ───────────────────────────────
// Department candidate review pipeline for Hiring Managers. Scopes candidate views
// to shortlisted and interviewing stages with local search filtering.

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import api from '../../services/api.js';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Search,
  Star,
  ChevronLeft,
  ChevronRight,
  Inbox,
  AlertTriangle,
  RotateCw,
  Eye,
} from 'lucide-react';

function AverageRatingCell({ applicationId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['applicationFeedbacks', applicationId],
    queryFn: async () => {
      const response = await api.get(`/feedback/application/${applicationId}`);
      return response.data?.data || [];
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  if (isLoading) {
    return <span className="w-8 h-4 bg-slate-100 dark:bg-slate-800 animate-pulse rounded block" />;
  }

  const feedbacks = data || [];
  if (feedbacks.length === 0) {
    return <span className="text-slate-400 dark:text-slate-550 italic">—</span>;
  }

  const totalScore = feedbacks.reduce((acc, f) => acc + (f.ratings?.overall || 0), 0);
  const avg = (totalScore / feedbacks.length).toFixed(1);

  return (
    <div className="flex items-center gap-1">
      <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
      <span className="font-bold text-slate-800 dark:text-slate-200">{avg}</span>
      <span className="text-[10px] text-slate-400">({feedbacks.length})</span>
    </div>
  );
}

export default function HMJobPipelinePage() {
  const { jobId } = useParams();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // 1. Fetch single job details
  const { data: job, isLoading: isJobLoading } = useQuery({
    queryKey: ['jobDetails', jobId],
    queryFn: async () => {
      const response = await api.get(`/jobs/${jobId}`);
      return response.data?.data;
    },
    staleTime: 1000 * 60 * 5,
  });

  // 2. Fetch scoped applications for the job (shortlisted/interview only)
  const {
    data: appData,
    isLoading: isAppsLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['hmJobApplications', jobId, page, sortBy],
    queryFn: async () => {
      const response = await api.get(`/applications/job/${jobId}/hm`, {
        params: { page, limit: 10, sortBy },
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 2,
    keepPreviousData: true,
  });

  const applications = appData?.data;
  const pagination = appData?.pagination || { currentPage: 1, totalPages: 1, total: 0 };

  // 3. Local Search Filtering over populated candidate names
  const filteredApplications = useMemo(() => {
    const list = applications || [];
    if (!searchTerm.trim()) return list;
    return list.filter((app) =>
      app.candidate?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [applications, searchTerm]);

  if (isError) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
          <AlertTriangle className="w-12 h-12 text-rose-500 animate-bounce" />
          <h3 className="text-base font-bold text-slate-805 dark:text-slate-100">
            Failed to Load Pipeline
          </h3>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            Could not fetch pipeline candidates. Ensure you have proper permissions to view this job department.
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-indigo-650 text-white hover:bg-indigo-700 active:scale-98 transition-all shadow-sm"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </div>
      </PageContainer>
    );
  }

  const formattedDeadline = job?.applicationDeadline
    ? format(new Date(job.applicationDeadline), 'MMM d, yyyy')
    : 'No Deadline';

  return (
    <PageContainer>
      <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-400">
        <Link
          to="/hiring-manager/jobs"
          className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Jobs</span>
        </Link>
      </div>

      <PageHeader
        title={isJobLoading ? 'Loading Job...' : job?.title}
        description={isJobLoading ? '' : `Scope: ${job?.department} · Location: ${job?.location} · Deadline: ${formattedDeadline}`}
        badge={
          job?.status === 'published' ? (
            <Badge label="Active Posting" variant="success" />
          ) : (
            <Badge label={job?.status || 'Draft'} variant="neutral" />
          )
        }
      />

      {/* Toolbar Search / Sort */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
        {/* Search Field */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by candidate name..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950 placeholder-slate-400 text-slate-800 dark:text-slate-200 focus-ring outline-none transition-colors"
          />
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Sort By</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-semibold focus-ring outline-none transition-colors"
          >
            <option value="latest">Newest Applied</option>
            <option value="oldest">Oldest Applied</option>
          </select>
        </div>
      </div>

      {isAppsLoading ? (
        <div className="space-y-4 mt-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="border border-dashed border-slate-205 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3 bg-slate-50/20 dark:bg-slate-950/5 mt-6">
          <Inbox className="w-10 h-10 text-slate-350 mx-auto" />
          <h4 className="text-sm font-bold text-slate-805 dark:text-slate-200">No Candidates Found</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
            {searchTerm ? 'No pipeline candidates match your keyword criteria.' : 'No candidates are currently shortlisted or interviewing for this job.'}
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/20">
                    <th className="py-3.5 px-4">Candidate Name</th>
                    <th className="py-3.5 px-4">Current Stage</th>
                    <th className="py-3.5 px-4">Applied Date</th>
                    <th className="py-3.5 px-4">Average Rating</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredApplications.map((app) => {
                    const appliedDate = app.appliedAt ? format(new Date(app.appliedAt), 'MMM d, yyyy') : 'N/A';
                    return (
                      <tr
                        key={app._id}
                        className="hover:bg-slate-50/40 dark:hover:bg-slate-850/30 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="min-w-0">
                            <span className="font-bold text-slate-850 dark:text-slate-100 block truncate">
                              {app.candidate?.name || 'Unknown Candidate'}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate block mt-0.5 max-w-[220px]">
                              {app.candidate?.profile?.headline || 'No professional headline'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <Badge
                            label={app.status === 'interview' ? 'Interviewing' : 'Shortlisted'}
                            variant={app.status === 'interview' ? 'warning' : 'purple'}
                          />
                        </td>
                        <td className="py-4 px-4 text-slate-500 dark:text-slate-400 font-semibold">
                          {appliedDate}
                        </td>
                        <td className="py-4 px-4">
                          <AverageRatingCell applicationId={app._id} />
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Link
                            to={`/hiring-manager/candidates/${app._id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-805 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-250 font-bold hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-[11px]"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Evaluate</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                Page {pagination.currentPage} of {pagination.totalPages} · {pagination.total} candidates
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 transition-opacity hover:bg-slate-50 dark:hover:bg-slate-850"
                  type="button"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, pagination.totalPages))}
                  disabled={page === pagination.totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 disabled:opacity-40 transition-opacity hover:bg-slate-50 dark:hover:bg-slate-850"
                  type="button"
                >
                  <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
