// ─── pages/hiring-manager/HMDashboard.jsx ──────────────────────────────────────
// Scoped workspace landing page for the Hiring Manager role. Renders stats widgets,
// candidate reviews, and upcoming interview cards.

import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { StatCard } from '../../components/common/StatCard.jsx';
import { InterviewCard } from '../../components/candidate/InterviewCard.jsx';
import { PageSkeleton } from '../../components/common/PageSkeleton.jsx';
import api from '../../services/api.js';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { formatDistanceToNow } from 'date-fns';
import {
  Briefcase,
  Users,
  CheckSquare,
  Calendar,
  ChevronRight,
  Inbox,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';

export default function HMDashboard() {
  const { user } = useAuth();

  // 1. Query HM Scoped Dashboard aggregation payload
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['hmDashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard/hiring-manager');
      return response.data?.data;
    },
    staleTime: 1000 * 60 * 2, // 2 mins cache
  });

  const stats = data?.stats || {
    assignedJobs: 0,
    pendingReview: 0,
    feedbackSubmitted: 0,
    scheduledInterviews: 0,
  };
  const candidatesPending = data?.candidatesPendingReview || [];
  const upcomingInterviews = data?.upcomingInterviews || [];

  const getShortlistedDate = (app) => {
    const event = app.statusHistory?.find((h) => h.status === 'shortlisted');
    return event?.changedAt || app.appliedAt;
  };

  const isPendingWarning = (app) => {
    const refDate = new Date(getShortlistedDate(app));
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return refDate < threeDaysAgo;
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (isError) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center">
          <AlertTriangle className="w-12 h-12 text-rose-500 animate-bounce" />
          <h3 className="text-base font-bold text-slate-805 dark:text-slate-100">
            Failed to Load Dashboard
          </h3>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed">
            There was a connection issue loading your hiring manager dashboard. Check your department assignments.
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
        title={`Welcome back, ${user?.name?.split(' ')[0] || 'Manager'} 👋`}
        description={`Hiring Manager Workspace for the ${user?.department || 'Hiring'} Department.`}
      />

      {/* 1. Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard
          title="Assigned Jobs"
          value={stats.assignedJobs}
          icon={Briefcase}
          color="indigo"
        />
        <StatCard
          title="Pending Review"
          value={stats.pendingReview}
          icon={Users}
          color="amber"
        />
        <StatCard
          title="Feedback Submitted"
          value={stats.feedbackSubmitted}
          icon={CheckSquare}
          color="green"
        />
        <StatCard
          title="Upcoming Interviews"
          value={stats.scheduledInterviews}
          icon={Calendar}
          color="cyan"
        />
      </div>

      {/* 2. Main content grids */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        
        {/* Candidates Pending Review section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-805 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <span>Pending Review Checklist</span>
              {candidatesPending.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center justify-center">
                  {candidatesPending.length}
                </span>
              )}
            </h3>
            <Link
              to="/hiring-manager/jobs"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-455 hover:underline flex items-center gap-0.5"
            >
              <span>View My Jobs</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3.5">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 animate-pulse" />
              ))}
            </div>
          ) : candidatesPending.length === 0 ? (
            <div className="border border-dashed border-slate-205 dark:border-slate-800 rounded-2xl p-8 text-center space-y-2 bg-slate-50/20 dark:bg-slate-950/5">
              <Inbox className="w-8 h-8 text-slate-350 mx-auto" />
              <h4 className="text-xs font-bold text-slate-805 dark:text-slate-200">All caught up!</h4>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs mx-auto">
                No candidate scorecards are pending your evaluation in the {user?.department || 'assigned'} department.
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-950/20">
                      <th className="py-3 px-4">Candidate</th>
                      <th className="py-3 px-4">Job Role</th>
                      <th className="py-3 px-4">Timeline</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {candidatesPending.map((app) => {
                      const shortlistDate = getShortlistedDate(app);
                      const isWarning = isPendingWarning(app);
                      return (
                        <tr key={app._id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/30 transition-colors">
                          <td className="py-4 px-4 font-bold text-slate-850 dark:text-slate-100 flex items-center gap-2">
                            {isWarning && (
                              <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                              </span>
                            )}
                            <span>{app.candidate?.name || 'Unknown Candidate'}</span>
                          </td>
                          <td className="py-4 px-4 text-slate-500 dark:text-slate-400 font-semibold">
                            {app.job?.title}
                          </td>
                          <td className="py-4 px-4 text-slate-400 font-semibold">
                            {formatDistanceToNow(new Date(shortlistDate), { addSuffix: true })}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <Link
                              to={`/hiring-manager/candidates/${app._id}`}
                              className="inline-flex items-center gap-0.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-250 font-bold hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-[11px]"
                            >
                              <span>Review Now</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Upcoming interviews sidebar column */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-805 dark:text-slate-100 uppercase tracking-wider">
            Interviews Calendar
          </h3>

          {isLoading ? (
            <div className="h-44 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 animate-pulse" />
          ) : upcomingInterviews.length === 0 ? (
            <div className="border border-dashed border-slate-205 dark:border-slate-800 rounded-2xl p-6 text-center space-y-2 bg-slate-50/20 dark:bg-slate-950/5">
              <Calendar className="w-8 h-8 text-slate-350 mx-auto" />
              <h4 className="text-xs font-bold text-slate-805 dark:text-slate-200">No interviews</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[180px] mx-auto leading-relaxed">
                You have no scheduled interview panels on your agenda today.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingInterviews.slice(0, 2).map((int) => (
                <div key={int._id} className="relative group">
                  <InterviewCard interview={int} isPending={false} />
                  {/* Overlay small indicator tag linking to evaluation detail */}
                  <div className="absolute top-4 right-4 z-10">
                    <Link
                      to={`/hiring-manager/candidates/${int.application}`}
                      className="text-[9px] font-bold bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-100 dark:border-indigo-900/35 text-indigo-650 dark:text-indigo-400 px-2 py-0.5 rounded-full transition-colors"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </PageContainer>
  );
}
