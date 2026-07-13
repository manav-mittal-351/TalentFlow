// ─── pages/recruiter/RecruiterJobsPage.jsx ───────────────────────────────────
// Recruiter job postings management directory. Integrates status tabs, pagination
// parameters, status edit triggers, and soft-delete prompts.
// Document reference: Document 8 — UI Pages § Page 13 Jobs Management

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { ROUTES } from '../../constants/routes.js';
import api from '../../services/api.js';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  Search,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Archive,
  AlertTriangle,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Inbox,
  X,
  Lock,
  Globe,
  FileText,
  FileMinus,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
];

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt', label: 'Oldest First' },
  { value: 'title', label: 'Job Title (A-Z)' },
];

// Memoized status badge component
const JobStatusBadge = React.memo(function JobStatusBadge({ status }) {
  const base = 'inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full';
  switch (status) {
    case 'published':
      return <span className={`${base} bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450`}><Globe className="w-2.5 h-2.5 mr-1" /> Published</span>;
    case 'draft':
      return <span className={`${base} bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400`}><FileText className="w-2.5 h-2.5 mr-1" /> Draft</span>;
    case 'closed':
      return <span className={`${base} bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450`}><Lock className="w-2.5 h-2.5 mr-1" /> Closed</span>;
    case 'archived':
      return <span className={`${base} bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-450`}><Archive className="w-2.5 h-2.5 mr-1" /> Archived</span>;
    default:
      return <span className={`${base} bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400`}>{status}</span>;
  }
});

export default function RecruiterJobsPage() {
  const queryClient = useQueryClient();

  // Filter and pagination state parameters matching backend specs
  const [statusTab, setStatusTab] = useState('');
  const [sortBy, setSortBy] = useState('-createdAt');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  // Dropdown menu state
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Delete modal confirmation states
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // 1. Setup React Query fetch hooks for GET /api/v1/jobs/recruiter/all
  const {
    data: jobsResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['recruiterJobs', statusTab, sortBy, page],
    queryFn: async () => {
      const params = {
        page,
        limit,
        sortBy,
      };
      if (statusTab) {
        params.status = statusTab;
      }
      const response = await api.get('/jobs/recruiter/all', { params });
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache lifetime
  });

  const jobsList = jobsResponse?.data;
  const pagination = jobsResponse?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };

  // 2. Status Mutation: Calls PATCH /api/v1/jobs/:jobId/status
  const statusMutation = useMutation({
    mutationFn: async ({ jobId, nextStatus }) => {
      const response = await api.patch(`/jobs/${jobId}/status`, { status: nextStatus });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Job status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['recruiterJobs'] });
      setActiveMenuId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update job status');
    },
  });

  // 3. Soft Delete Mutation: Calls DELETE /api/v1/jobs/:jobId
  const deleteMutation = useMutation({
    mutationFn: async (jobId) => {
      const response = await api.delete(`/jobs/${jobId}`);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || 'Job soft-deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['recruiterJobs'] });
      setDeleteTargetId(null);
      setActiveMenuId(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete job');
      setDeleteTargetId(null);
    },
  });

  // Toggle Dropdown menu
  const toggleMenu = useCallback((jobId) => {
    setActiveMenuId((prev) => (prev === jobId ? null : jobId));
  }, []);

  // Handle status toggle trigger
  const handleStatusChange = useCallback((jobId, currentStatus) => {
    let nextStatus = 'published';
    if (currentStatus === 'published') {
      nextStatus = 'closed';
    } else if (currentStatus === 'closed') {
      nextStatus = 'archived';
    } else if (currentStatus === 'archived') {
      nextStatus = 'draft';
    }
    statusMutation.mutate({ jobId, nextStatus });
  }, [statusMutation]);

  // Client-side text query filters (filters locally matching results from active query responses)
  const filteredJobsList = useMemo(() => {
    const list = jobsList || [];
    if (!searchQuery) return list;
    const normalized = searchQuery.toLowerCase().trim();
    return list.filter(
      (job) =>
        job.title?.toLowerCase().includes(normalized) ||
        job.department?.toLowerCase().includes(normalized) ||
        job.location?.toLowerCase().includes(normalized)
    );
  }, [jobsList, searchQuery]);

  // Table row renderer wrapper
  const renderRow = useCallback((job) => {
    const isMenuOpen = activeMenuId === job._id;
    const formattedDate = job.createdAt ? format(new Date(job.createdAt), 'MMM d, yyyy') : 'Recent';

    return (
      <tr
        key={job._id}
        className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 transition-colors"
      >
        {/* Title / Role */}
        <td className="py-4 pr-3 font-semibold text-slate-900 dark:text-slate-50 pl-4">
          <Link
            to={`/recruiter/jobs/${job._id}`}
            className="hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none transition-colors"
          >
            {job.title}
          </Link>
        </td>

        {/* Department */}
        <td className="py-4 px-3 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">
          {job.department}
        </td>

        {/* Application Count */}
        <td className="py-4 px-3 text-slate-700 dark:text-slate-350 text-xs sm:text-sm font-semibold">
          <Link
            to={`/recruiter/jobs/${job._id}`}
            className="inline-flex items-center gap-1 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <span>{job.applicationCount || 0}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </td>

        {/* StatusBadge */}
        <td className="py-4 px-3">
          <JobStatusBadge status={job.status} />
        </td>

        {/* Posted Date */}
        <td className="py-4 px-3 text-slate-400 text-xs font-semibold">
          {formattedDate}
        </td>

        {/* Action Dropdown Menu */}
        <td className="py-4 pl-3 pr-4 text-right relative">
          <button
            onClick={() => toggleMenu(job._id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-650 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-ring"
            aria-label="Actions menu"
            aria-expanded={isMenuOpen}
            type="button"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <>
              {/* Overlay to close menu on outside click */}
              <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
              
              <div className="absolute right-4 mt-1 w-48 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg z-50 py-1.5 animate-in fade-in duration-100">
                <Link
                  to={`/recruiter/jobs/${job._id}`}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-left w-full"
                >
                  <Eye className="w-4 h-4 text-slate-400" />
                  <span>View Pipeline</span>
                </Link>
                <Link
                  to={`/recruiter/jobs/${job._id}/edit`}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-left w-full"
                >
                  <Edit2 className="w-4 h-4 text-slate-400" />
                  <span>Edit Details</span>
                </Link>
                <button
                  onClick={() => handleStatusChange(job._id, job.status)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-left w-full"
                  type="button"
                >
                  <RotateCw className="w-4 h-4 text-slate-400" />
                  <span>Change Status</span>
                </button>
                <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                <button
                  onClick={() => setDeleteTargetId(job._id)}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 text-left w-full"
                  type="button"
                >
                  <Trash2 className="w-4 h-4 shrink-0" />
                  <span>Delete Post</span>
                </button>
              </div>
            </>
          )}
        </td>
      </tr>
    );
  }, [activeMenuId, toggleMenu, handleStatusChange]);

  // Render mobile cards layouts to avoid overflow tables on small screen viewports
  const renderMobileCard = useCallback((job) => {
    const isMenuOpen = activeMenuId === job._id;
    const formattedDate = job.createdAt ? format(new Date(job.createdAt), 'MMM d, yyyy') : 'Recent';

    return (
      <div
        key={job._id}
        className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between gap-4"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
              {job.department}
            </span>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
              <Link to={`/recruiter/jobs/${job._id}`} className="hover:underline">
                {job.title}
              </Link>
            </h4>
          </div>
          <div className="relative">
            <button
              onClick={() => toggleMenu(job._id)}
              className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Actions menu"
              type="button"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setActiveMenuId(null)} />
                <div className="absolute right-0 mt-1 w-44 rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md z-50 py-1 flex flex-col">
                  <Link
                    to={`/recruiter/jobs/${job._id}`}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-400" />
                    <span>View Pipeline</span>
                  </Link>
                  <Link
                    to={`/recruiter/jobs/${job._id}/edit`}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Edit Details</span>
                  </Link>
                  <button
                    onClick={() => handleStatusChange(job._id, job.status)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-800 text-left w-full"
                    type="button"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Change Status</span>
                  </button>
                  <button
                    onClick={() => setDeleteTargetId(job._id)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-450 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 text-left w-full font-bold"
                    type="button"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Post</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-xs font-semibold">
          <div className="flex items-center gap-3">
            <JobStatusBadge status={job.status} />
            <span className="text-slate-500 dark:text-slate-400">
              {job.applicationCount || 0} Apps
            </span>
          </div>
          <span className="text-slate-400">{formattedDate}</span>
        </div>
      </div>
    );
  }, [activeMenuId, toggleMenu, handleStatusChange]);

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Job Postings"
        description="Review, modify, and inspect applicant funnels across your active roles."
        actions={
          <Link
            to={ROUTES.RECRUITER.JOB_NEW}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all hover:scale-[1.02] focus-ring"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Create New Job</span>
          </Link>
        }
      />

      {/* Control row: Tab options + Search & Sorting */}
      <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
        {/* Status Tabs bar */}
        <div className="flex overflow-x-auto gap-2 border-b border-slate-100 dark:border-slate-850 pb-1 scrollbar-none" role="tablist">
          {STATUS_OPTIONS.map((opt) => {
            const isActive = statusTab === opt.value;
            return (
              <button
                key={opt.label}
                onClick={() => {
                  setStatusTab(opt.value);
                  setPage(1);
                }}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all focus-ring whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-sm'
                    : 'text-slate-550 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                role="tab"
                aria-selected={isActive}
                type="button"
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Input filters row */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search box (Title & Department local checks) */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search title, department, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus-ring"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-650"
                type="button"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort selection drop dropdown */}
          <div className="w-full sm:w-48 shrink-0">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-150 focus-ring font-semibold"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Jobs List display grids */}
      {isLoading ? (
        /* Loading skeleton mock table */
        <div className="space-y-4">
          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <th key={i} className="p-4"><Skeleton variant="text" width="60px" height="12px" /></th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="p-4"><Skeleton variant="text" width="180px" height="16px" /></td>
                    <td className="p-4"><Skeleton variant="text" width="80px" height="14px" /></td>
                    <td className="p-4"><Skeleton variant="text" width="40px" height="14px" /></td>
                    <td className="p-4"><Skeleton variant="text" width="70px" height="18px" className="rounded-full" /></td>
                    <td className="p-4"><Skeleton variant="text" width="80px" height="14px" /></td>
                    <td className="p-4 text-right"><Skeleton variant="circular" width="16px" height="16px" className="ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile Loading Card skeletons */}
          <div className="md:hidden space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-5 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 space-y-4">
                <Skeleton variant="text" width="60px" height="12px" />
                <Skeleton variant="text" width="180px" height="16px" />
                <div className="flex justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                  <Skeleton variant="text" width="70px" height="18px" className="rounded-full" />
                  <Skeleton variant="text" width="60px" height="12px" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : isError ? (
        /* Error resolution */
        <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/10 flex flex-col items-center justify-center text-center gap-3 max-w-md mx-auto">
          <AlertTriangle className="w-8 h-8 text-rose-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Failed to fetch job postings
          </h3>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 rounded-xl shadow-sm focus-ring transition-transform hover:scale-[1.01]"
            type="button"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Retry connection</span>
          </button>
        </div>
      ) : filteredJobsList.length === 0 ? (
        /* Empty results */
        <div className="p-10 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 bg-white dark:bg-slate-900 max-w-lg mx-auto shadow-sm">
          <Inbox className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {searchQuery ? 'No matching jobs found' : "You haven't created any job postings yet."}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-450 leading-relaxed">
            {searchQuery
              ? 'Try modifying your search queries or clearing active status tabs.'
              : 'Post your first career opening registry to start tracking candidate pipeline stages.'}
          </p>
          {!searchQuery && (
            <Link
              to={ROUTES.RECRUITER.JOB_NEW}
              className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-transform hover:scale-[1.01]"
            >
              <Plus className="w-4 h-4" />
              <span>Create Job</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left text-sm border-collapse" role="table">
              <thead className="text-xs font-bold text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold" scope="col">Job Title</th>
                  <th className="py-3 px-3 font-semibold" scope="col">Department</th>
                  <th className="py-3 px-3 font-semibold" scope="col">Applications</th>
                  <th className="py-3 px-3 font-semibold" scope="col">Status</th>
                  <th className="py-3 px-3 font-semibold" scope="col">Date Posted</th>
                  <th className="py-3 px-4 font-semibold text-right" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {filteredJobsList.map(renderRow)}
              </tbody>
            </table>
          </div>

          {/* Mobile Stacked Card View */}
          <div className="md:hidden flex flex-col gap-3">
            {filteredJobsList.map(renderMobileCard)}
          </div>

          {/* Pagination bottom bar */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-150/70 dark:border-slate-800/80 pt-4 mt-6">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={pagination.page <= 1 || statusMutation.isPending || deleteMutation.isPending}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus-ring"
                  aria-label="Previous page"
                  type="button"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages || statusMutation.isPending || deleteMutation.isPending}
                  onClick={() => setPage((prev) => Math.min(prev + 1, pagination.totalPages))}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-650 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors focus-ring"
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

      {/* Confirmation Soft Delete Modal dialog popup */}
      {deleteTargetId && (
        <div
          className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm z-100 flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 transform scale-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-450 flex items-center justify-center shrink-0">
                <FileMinus className="w-5 h-5" />
              </div>
              <h3 id="modal-title" className="text-base font-bold text-slate-900 dark:text-slate-50">
                Delete Job?
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              This action soft-deletes the job posting. Applicants will no longer be able to discover or submit resumes to this position. This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold focus-ring"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate(deleteTargetId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow focus-ring"
                disabled={deleteMutation.isPending}
                type="button"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </PageContainer>
  );
}
