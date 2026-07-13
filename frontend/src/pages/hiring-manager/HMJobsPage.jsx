// ─── pages/hiring-manager/HMJobsPage.jsx ────────────────────────────────────────
// Lists jobs assigned to the Hiring Manager's department. Integrates client-side
// shortlist count lookups via React Query and department-scoping.

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import api from '../../services/api.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import {
  AlertTriangle,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Globe,
  ArrowRight,
} from 'lucide-react';

function ShortlistedCell({ jobId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['jobShortlistedCount', jobId],
    queryFn: async () => {
      const response = await api.get(`/applications/job/${jobId}/hm`, {
        params: { limit: 1 },
      });
      return response.data?.pagination?.total || 0;
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  if (isLoading) {
    return <span className="w-8 h-4 bg-slate-100 dark:bg-slate-800 animate-pulse rounded block" />;
  }

  const count = data || 0;

  if (count === 0) {
    return <span className="text-slate-400 dark:text-slate-500 font-semibold text-xs">0</span>;
  }

  return (
    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-455 border border-amber-105 dark:border-amber-900/30">
      {count}
    </span>
  );
}

export default function HMJobsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);

  // 1. Fetch assigned jobs scoped to HM department
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['hmJobs', page],
    queryFn: async () => {
      const response = await api.get('/jobs/hiring-manager/assigned', {
        params: { page, limit: 10 },
      });
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
    keepPreviousData: true,
  });

  const jobs = data?.data || [];
  const pagination = data?.pagination || { currentPage: 1, totalPages: 1, total: 0 };

  if (isError) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
          <AlertTriangle className="w-12 h-12 text-rose-500 animate-bounce" />
          <h3 className="text-base font-bold text-slate-805 dark:text-slate-100">
            Failed to Load Jobs
          </h3>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            Could not fetch job postings for your department. Verify your network or department details.
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
        title="My Jobs Directory"
        description="Assigned job listings currently active in your department."
        badge={<Badge label={`${user?.department || 'Department'}`} variant="purple" />}
      />

      {isLoading ? (
        <div className="space-y-4 mt-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="border border-dashed border-slate-205 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3 bg-slate-50/20 dark:bg-slate-950/5 mt-6">
          <Inbox className="w-10 h-10 text-slate-350 mx-auto" />
          <h4 className="text-sm font-bold text-slate-805 dark:text-slate-200">No Jobs Assigned</h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
            No published roles match the {user?.department || 'assigned'} department criteria.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/20">
                    <th className="py-3.5 px-4">Job Title</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Total Applied</th>
                    <th className="py-3.5 px-4">Shortlisted</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Candidates</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {jobs.map((job) => (
                    <tr
                      key={job._id}
                      className="hover:bg-slate-50/40 dark:hover:bg-slate-850/30 transition-colors cursor-pointer"
                    >
                      <td className="py-4 px-4 font-bold text-slate-850 dark:text-slate-100">
                        <Link to={`/hiring-manager/jobs/${job._id}`} className="hover:text-indigo-600 dark:hover:text-indigo-400 block transition-colors">
                          {job.title}
                        </Link>
                      </td>
                      <td className="py-4 px-4">
                        <Badge label={job.department} variant="neutral" />
                      </td>
                      <td className="py-4 px-4 text-slate-550 dark:text-slate-400 font-semibold">
                        {job.applicationCount || 0}
                      </td>
                      <td className="py-4 px-4">
                        <ShortlistedCell jobId={job._id} />
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 border border-emerald-100/30">
                          <Globe className="w-2.5 h-2.5 mr-1 text-emerald-500" />
                          <span>Active</span>
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link
                          to={`/hiring-manager/jobs/${job._id}`}
                          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          <span>Review Pipeline</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Simple table pagination bar */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wide">
                Page {pagination.currentPage} of {pagination.totalPages} · {pagination.total} roles
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
