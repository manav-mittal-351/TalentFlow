// ─── pages/candidate/SavedJobsPage.jsx ─────────────────────────────────────────
// Renders the candidate's bookmarked roles. Reuses JobCard and implements React Query
// optimistic updates for unsaving jobs.

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { JobCard } from '../../components/jobs/JobCard.jsx';
import api from '../../services/api.js';
import toast from 'react-hot-toast';
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';

export default function SavedJobsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // 1. Query for saved jobs list
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['savedJobs', page],
    queryFn: async () => {
      const response = await api.get('/users/saved-jobs', {
        params: { page, limit: 6 },
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 mins cache
    keepPreviousData: true,
  });

  const savedJobs = data?.data || [];
  const pagination = data?.pagination || { currentPage: 1, totalPages: 1, total: 0 };

  // 2. Unsave mutation with optimistic updates
  const unsaveMutation = useMutation({
    mutationFn: async (jobId) => {
      await api.delete(`/users/saved-jobs/${jobId}`);
    },
    onMutate: async (jobId) => {
      // Cancel outstanding refetches for savedJobs query
      await queryClient.cancelQueries({ queryKey: ['savedJobs', page] });

      // Snapshot previous cache state
      const previousData = queryClient.getQueryData(['savedJobs', page]);

      // Optimistically update cache to filter out unsaved job
      queryClient.setQueryData(['savedJobs', page], (old) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data ? old.data.filter((job) => job._id !== jobId) : [],
          pagination: {
            ...old.pagination,
            total: Math.max(0, (old.pagination?.total || 0) - 1),
          },
        };
      });

      // Context value for error rollback
      return { previousData };
    },
    onError: (err, jobId, context) => {
      // Rollback cache to pre-mutation snapshot
      if (context?.previousData) {
        queryClient.setQueryData(['savedJobs', page], context.previousData);
      }
      toast.error('Failed to unsave job. Please try again.');
    },
    onSuccess: () => {
      toast.success('Job removed from saved list.');
    },
    onSettled: () => {
      // Refetch anyway to reconcile server and client cache state
      queryClient.invalidateQueries({ queryKey: ['savedJobs', page] });
    },
  });

  const handleUnsaveToggle = (jobId) => {
    unsaveMutation.mutate(jobId);
  };

  if (isError) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
          <AlertTriangle className="w-12 h-12 text-rose-500 animate-bounce" />
          <h3 className="text-base font-bold text-slate-805 dark:text-slate-100">
            Failed to Load Bookmarks
          </h3>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            There was a connection issue fetching your saved job listings. Check your internet connection.
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

  return (
    <PageContainer>
      <PageHeader
        title="Saved Job Postings"
        description="Review, apply, or manage job openings you've bookmarked for later."
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 animate-pulse" />
          ))}
        </div>
      ) : savedJobs.length === 0 ? (
        <div className="border border-dashed border-slate-205 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4 bg-slate-50/20 dark:bg-slate-950/5 mt-6">
          <Bookmark className="w-10 h-10 text-slate-350 mx-auto" />
          <h4 className="text-sm font-bold text-slate-805 dark:text-slate-200">No Saved Jobs Yet</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto leading-relaxed">
            Bookmarks help you track roles you are interested in applying for later.
          </p>
          <Link
            to="/jobs"
            className="inline-flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow transition-all active:scale-98"
          >
            Browse Active Jobs
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedJobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                isBookmarked={true}
                onBookmarkToggle={handleUnsaveToggle}
              />
            ))}
          </div>

          {/* Pagination bar */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                Page {pagination.currentPage} of {pagination.totalPages} · {pagination.total} bookmarks
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
