// ─── pages/candidate/CandidateApplicationsPage.jsx ──────────────────────────
// Candidate interface reviewing their submitted applications history pipeline.
// API: GET /api/v1/applications/my
// Doc reference: Document 8 — UI Pages § Page 7 Candidate Applications List

import { useState, useCallback, useMemo, useTransition } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { ApplicationRow } from '../../components/application/ApplicationRow.jsx';
import { ApplicationFilters } from '../../components/application/ApplicationFilters.jsx';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { AlertTriangle, RotateCw, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes.js';

function SkeletonList() {
  return (
    <div className="space-y-3.5">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-100 dark:border-slate-850" />
      ))}
    </div>
  );
}

export default function CandidateApplicationsPage() {
  const queryClient = useQueryClient();
  const [isPendingFilter, startTransition] = useTransition();

  // State matching GET /applications/my params + client search keywords
  const [filterState, setFilterState] = useState({
    status: '',
    sortBy: 'latest',
    search: '',
    page: 1,
  });

  // 1. Fetch Candidate Applications
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['myApplications', filterState.status, filterState.sortBy, filterState.page],
    queryFn: async () => {
      const { status, sortBy, page } = filterState;
      const params = { page, limit: 10 };
      if (status) params.status = status;
      if (sortBy) params.sortBy = sortBy;

      const response = await api.get('/applications/my', { params });
      return response.data;
    },
    staleTime: 1000 * 60 * 2, // 2 mins cache
  });

  // 2. Mutation: Withdraw Application
  const withdrawMutation = useMutation({
    mutationFn: async (appId) => {
      const response = await api.patch(`/applications/${appId}/withdraw`);
      return response.data;
    },
    onSuccess: (res) => {
      toast.success(res?.message || 'Application withdrawn successfully');
      queryClient.invalidateQueries({ queryKey: ['myApplications'] });
      queryClient.invalidateQueries({ queryKey: ['candidateDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['myApplicationsCheck'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to withdraw application');
    },
  });

  const handleWithdraw = useCallback((appId, jobTitle) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to withdraw your application for "${jobTitle}"? This action cannot be undone.`
    );
    if (isConfirmed) {
      withdrawMutation.mutate(appId);
    }
  }, [withdrawMutation]);

  // Handle individual filter updates
  const handleFilterChange = useCallback((newFilters) => {
    startTransition(() => {
      setFilterState((prev) => ({
        ...prev,
        ...newFilters,
        page: 1, // Reset page
      }));
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    startTransition(() => {
      setFilterState({
        status: '',
        sortBy: 'latest',
        search: '',
        page: 1,
      });
    });
  }, []);

  const handlePageChange = (newPage) => {
    setFilterState((prev) => ({
      ...prev,
      page: newPage,
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applicationsList = useMemo(() => data?.data || [], [data]);
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  // Apply client-side keywords filter
  const filteredApplications = useMemo(() => {
    if (!filterState.search.trim()) return applicationsList;
    const query = filterState.search.toLowerCase().trim();
    return applicationsList.filter((app) => {
      const jobTitle = app.job?.title?.toLowerCase() || '';
      const companyName = app.job?.company?.name?.toLowerCase() || '';
      return jobTitle.includes(query) || companyName.includes(query);
    });
  }, [applicationsList, filterState.search]);

  return (
    <PageContainer>
      
      {/* Header */}
      <PageHeader
        title="My Applications"
        description="Track and manage the progress of the positions you have applied for."
        actions={
          <Link
            to={ROUTES.JOBS}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-250 text-xs font-semibold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm focus-ring"
          >
            <span>Search More Jobs</span>
          </Link>
        }
      />

      {/* Main filter bar */}
      <div className="mt-6 space-y-4">
        <ApplicationFilters
          filters={filterState}
          onChange={handleFilterChange}
          onReset={handleResetFilters}
        />

        {/* Dynamic refinement indicator */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
          <span>
            {isLoading ? 'Loading records...' : `Showing ${filteredApplications.length} applications`}
          </span>
          {isPendingFilter && (
            <span className="text-indigo-650 dark:text-indigo-400 flex items-center gap-1">
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              Refining...
            </span>
          )}
        </div>

        {/* List Content */}
        {isError ? (
          <div className="border border-rose-250 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/10 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
            <AlertTriangle className="w-9 h-9 text-rose-500 animate-bounce" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                Failed to load applications
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Could not connect to the database. Try reloading the connection.
              </p>
            </div>
            <button
              onClick={refetch}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow focus-ring hover:scale-[1.01]"
              type="button"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Retry Connection
            </button>
          </div>
        ) : isLoading ? (
          <SkeletonList />
        ) : filteredApplications.length === 0 ? (
          <div className="border border-slate-205 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-12 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
            <Inbox className="w-10 h-10 text-slate-350 dark:text-slate-650" />
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                No applications found
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                You haven&apos;t applied to any roles matching these filters. Try adjusting your stages dropdown options.
              </p>
            </div>
            {applicationsList.length === 0 ? (
              <Link
                to={ROUTES.JOBS}
                className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all focus-ring shadow-md hover:scale-[1.01] mt-2"
              >
                Find job openings
              </Link>
            ) : (
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-indigo-650 dark:text-indigo-400 hover:underline mt-1"
                type="button"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredApplications.map((app) => (
              <ApplicationRow
                key={app._id}
                application={app}
                onWithdraw={handleWithdraw}
                isPending={withdrawMutation.isPending}
              />
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {!isLoading && !isError && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-5 text-xs font-bold text-slate-600 dark:text-slate-400">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-205 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors focus-ring"
              type="button"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-205 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors focus-ring"
              type="button"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </PageContainer>
  );
}
