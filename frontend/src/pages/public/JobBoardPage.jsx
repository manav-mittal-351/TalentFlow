// ─── pages/public/JobBoardPage.jsx ──────────────────────────────────────────
// Public careers board list view displaying, sorting, and searching published roles.
// API: GET /api/v1/jobs
// Doc reference: Document 8 — UI Pages § Page 1 Jobs Registry

import { useState, useCallback, useTransition, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { JobCard } from '../../components/jobs/JobCard.jsx';
import { JobFilters } from '../../components/jobs/JobFilters.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import { AlertTriangle, RotateCw, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

// Renders list skeletons during load
function SkeletonList() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-56 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-100 dark:border-slate-850" />
      ))}
    </div>
  );
}

export default function JobBoardPage() {
  const { user, isAuthenticated } = useAuth();
  const [isPendingFilter, startTransition] = useTransition();

  // State matching GET /jobs query filters
  const [filterState, setFilterState] = useState({
    search: '',
    location: '',
    department: '',
    jobType: '',
    isRemote: '',
    sortBy: 'newest',
    page: 1,
  });

  // Fetch paginated jobs list
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['publicJobs', filterState],
    queryFn: async () => {
      const { search, location, department, jobType, isRemote, sortBy, page } = filterState;
      const params = { page, limit: 10, sortBy };
      if (search) params.search = search;
      if (location) params.location = location;
      if (department) params.department = department;
      if (jobType) params.jobType = jobType;
      if (isRemote !== '') params.isRemote = isRemote;

      const response = await api.get('/jobs', { params });
      return response.data;
    },
    staleTime: 1000 * 60 * 2, // 2 mins cache
  });

  // Fetch candidate saved jobs to identify bookmarked icons
  const { data: savedJobsRes } = useQuery({
    queryKey: ['candidateSavedJobs'],
    queryFn: async () => {
      const res = await api.get('/users/saved-jobs');
      return res.data?.data || [];
    },
    enabled: isAuthenticated && user?.role === 'candidate',
    staleTime: 1000 * 60 * 5,
  });

  const savedJobIds = useMemo(() => {
    return savedJobsRes ? savedJobsRes.map((j) => j._id) : [];
  }, [savedJobsRes]);

  // Bookmark toggler callback (POST/DELETE saved jobs)
  const handleBookmarkToggle = useCallback(async (jobId) => {
    if (!isAuthenticated) {
      toast.error('Please log in to save job openings.');
      return;
    }
    if (user?.role !== 'candidate') {
      toast.error('Only candidate profiles can save job positions.');
      return;
    }

    const isCurrentlySaved = savedJobIds.includes(jobId);
    try {
      if (isCurrentlySaved) {
        await api.delete(`/users/saved-jobs/${jobId}`);
        toast.success('Job removed from saved bookmarks');
      } else {
        await api.post(`/users/saved-jobs/${jobId}`);
        toast.success('Job saved to bookmarks successfully');
      }
      refetch(); // Invalidate list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle bookmark');
    }
  }, [isAuthenticated, user, savedJobIds, refetch]);

  // Handle individual filter updates
  const handleFilterChange = useCallback((newFilters) => {
    startTransition(() => {
      setFilterState((prev) => ({
        ...prev,
        ...newFilters,
        page: 1, // Reset to first page on criteria change
      }));
    });
  }, []);

  const handleResetFilters = useCallback(() => {
    startTransition(() => {
      setFilterState({
        search: '',
        location: '',
        department: '',
        jobType: '',
        isRemote: '',
        sortBy: 'newest',
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

  const jobsList = data?.data || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1, total: 0 };

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Explore Job Openings"
        description="Find your next career move at TalentFlow. Browse published roles across global engineering, design, and product departments."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
        {/* Left Column: Filter Panel */}
        <div className="lg:col-span-1">
          <JobFilters
            filters={filterState}
            onChange={handleFilterChange}
            onReset={handleResetFilters}
          />
        </div>

        {/* Right Column: Listings Grid */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Header count indicators */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>
              {isLoading ? 'Counting roles...' : `Showing ${pagination.total || 0} open positions`}
            </span>
            {isPendingFilter && (
              <span className="text-indigo-650 dark:text-indigo-400 flex items-center gap-1">
                <RotateCw className="w-3 h-3 animate-spin" />
                Refining...
              </span>
            )}
          </div>

          {/* Grid results mapping */}
          {isError ? (
            <div className="border border-rose-250 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/10 rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-4 shadow-sm">
              <AlertTriangle className="w-9 h-9 text-rose-500 animate-bounce" />
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  Failed to fetch positions
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Encountered an network error while pulling positions list.
                </p>
              </div>
              <button
                onClick={refetch}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow focus-ring hover:scale-[1.01]"
                type="button"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Retry connection
              </button>
            </div>
          ) : isLoading ? (
            <SkeletonList />
          ) : jobsList.length === 0 ? (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 p-12 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
              <Sparkles className="w-10 h-10 text-slate-350 dark:text-slate-650" />
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                  No matching jobs found
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Try adjusting your search keywords, departments, or remote toggle option filters.
                </p>
              </div>
              <button
                onClick={handleResetFilters}
                className="text-xs font-semibold text-indigo-650 dark:text-indigo-400 hover:underline mt-1"
                type="button"
              >
                Reset search filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobsList.map((j) => (
                <JobCard
                  key={j._id}
                  job={j}
                  isBookmarked={savedJobIds.includes(j._id)}
                  onBookmarkToggle={handleBookmarkToggle}
                />
              ))}
            </div>
          )}

          {/* Pagination bar */}
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
      </div>
    </PageContainer>
  );
}
