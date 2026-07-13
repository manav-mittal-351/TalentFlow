// ─── pages/recruiter/RecruiterDashboard.jsx ──────────────────────────────────
// Recruiter Hiring Command Center dashboard page. Integrates Recharts donut plots,
// dynamic progress metrics, upcoming interviews, and recent applications logs.
// Document reference: Document 8 — UI Pages § Page 12 Recruiter Dashboard

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { StatCard } from '../../components/common/StatCard.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { ROUTES } from '../../constants/routes.js';
import api from '../../services/api.js';
import { format } from 'date-fns';
import {
  Briefcase,
  Users,
  Calendar,
  CheckCircle2,
  Plus,
  AlertTriangle,
  RotateCw,
  Clock,
  ArrowRight,
  TrendingUp,
  Inbox,
  Video,
  Phone,
  UserCheck,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Colors registry matching Tailwind and variables themes
const STATUS_COLORS = {
  applied: '#6366f1',      // Indigo
  under_review: '#a855f7', // Purple
  shortlisted: '#06b6d4',  // Cyan
  interview: '#f59e0b',    // Amber
  offer: '#ec4899',        // Pink
  hired: '#10b981',        // Emerald
  rejected: '#ef4444',     // Red
  withdrawn: '#64748b',    // Slate
};

const getStatusBadgeClass = (status) => {
  const base = 'inline-flex items-center text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded';
  switch (status) {
    case 'applied':
      return `${base} bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400`;
    case 'under_review':
      return `${base} bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400`;
    case 'shortlisted':
      return `${base} bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400`;
    case 'interview':
      return `${base} bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-450`;
    case 'offer':
      return `${base} bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400`;
    case 'hired':
      return `${base} bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450`;
    case 'rejected':
      return `${base} bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400`;
    default:
      return `${base} bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400`;
  }
};

const getInterviewFormatIcon = (formatStr) => {
  switch (formatStr) {
    case 'video':
      return <Video className="w-3.5 h-3.5 text-indigo-500" />;
    case 'phone':
      return <Phone className="w-3.5 h-3.5 text-cyan-500" />;
    default:
      return <UserCheck className="w-3.5 h-3.5 text-amber-500" />;
  }
};

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  const today = useMemo(() => format(new Date(), 'eeee, MMMM d, yyyy'), []);

  // 1. Fetch dashboard data using TanStack Query matching shared cache configuration
  const {
    data: dashboardData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['recruiterDashboard'],
    queryFn: async () => {
      const response = await api.get('/dashboard/recruiter');
      return response.data?.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache lifetime
  });

  const { stats, recentApplications = [], upcomingInterviews = [], pipelineBreakdown = {} } =
    dashboardData || {};

  // Check if there are any applications tracked in the system
  const hasApplications = useMemo(() => {
    if (!pipelineBreakdown) return false;
    return Object.values(pipelineBreakdown).reduce((sum, val) => sum + val, 0) > 0;
  }, [pipelineBreakdown]);

  // Format pipeline status breakdown list for Recharts Pie plot
  const chartData = useMemo(() => {
    if (!pipelineBreakdown) return [];
    return Object.entries(pipelineBreakdown)
      .filter(([, val]) => val > 0)
      .map(([key, val]) => ({
        name: key.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        value: val,
        color: STATUS_COLORS[key] || '#6366f1',
      }));
  }, [pipelineBreakdown]);

  if (isLoading) {
    return (
      <PageContainer className="animate-pulse">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="space-y-2">
            <Skeleton variant="text" width="220px" height="28px" />
            <Skeleton variant="text" width="160px" height="16px" />
          </div>
          <Skeleton width="110px" height="38px" className="rounded-xl" />
        </div>
        {/* Stats Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="stat" />
          ))}
        </div>
        {/* Columns Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
          <div className="lg:col-span-8 space-y-4">
            <Skeleton width="100%" height="240px" className="rounded-2xl" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <Skeleton width="100%" height="240px" className="rounded-2xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer className="flex items-center justify-center min-h-[70vh]">
        <div className="p-6 rounded-2xl border border-rose-250 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/10 flex flex-col items-center justify-center text-center gap-4 max-w-md shadow-sm">
          <AlertTriangle className="w-10 h-10 text-rose-500 animate-bounce" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Failed to load Recruiter Dashboard
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              The query pipeline encountered connection drops or authentication issues. Check server logs.
            </p>
          </div>
          <button
            onClick={() => refetch()}
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

  // Define quick action button for Recruiter Dashboard Header
  const headerActions = (
    <Link
      to={ROUTES.RECRUITER.JOB_NEW}
      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-all focus-ring hover:scale-[1.02]"
    >
      <Plus className="w-4 h-4 shrink-0" />
      <span>Create Job</span>
    </Link>
  );

  return (
    <PageContainer>
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description={today}
        actions={headerActions}
      />

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Open Job Postings"
          value={stats?.openJobs}
          icon={Briefcase}
          color="indigo"
        />
        <StatCard
          title="Total Applications"
          value={stats?.totalApplications}
          icon={Users}
          color="cyan"
        />
        <StatCard
          title="Interviews Scheduled"
          value={stats?.scheduledInterviews}
          icon={Calendar}
          color="amber"
        />
        <StatCard
          title="Hired This Month"
          value={stats?.hiredThisMonth}
          icon={CheckCircle2}
          color="green"
        />
      </div>

      {/* Grid: Breakdown & Pipeline Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Pipeline distribution breakdown (8 cols on desktop) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Pipeline Breakdown card */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                <span>Application Pipeline Breakdown</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Distribution of candidate pipelines across the recruitment stages.
              </p>
            </div>

            {hasApplications ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* 1. Recharts Donut Pie Plot (5 cols) */}
                <div className="md:col-span-5 h-64 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          background: 'var(--color-bg-surface)',
                          borderColor: 'var(--color-border)',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '11px',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Absolute Center Counter */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-slate-50">
                      {stats?.totalApplications || 0}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Applicants
                    </span>
                  </div>
                </div>

                {/* 2. Visual Progress bars showing stages (7 cols) */}
                <div className="md:col-span-7 space-y-3">
                  {Object.entries(pipelineBreakdown).map(([key, val]) => {
                    const pct = stats?.totalApplications
                      ? Math.round((val / stats.totalApplications) * 100)
                      : 0;
                    const stageColor = STATUS_COLORS[key] || '#6366f1';
                    const displayLabel = key
                      .replace('_', ' ')
                      .replace(/\b\w/g, (c) => c.toUpperCase());

                    return (
                      <div key={key} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-slate-600 dark:text-slate-400">
                            {displayLabel}
                          </span>
                          <span className="text-slate-900 dark:text-slate-50">
                            {val} <span className="text-[10px] text-slate-400 font-medium">({pct}%)</span>
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: stageColor,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Empty pipeline state */
              <div className="py-12 text-center space-y-3">
                <Inbox className="w-10 h-10 text-slate-400 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    No Pipeline Data
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-450 max-w-xs mx-auto leading-relaxed">
                    No active applications have been submitted to your job posts yet. Publish a job posting or register profiles to populate graphs.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Recent Applications card */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                Recent Applications
              </h3>
              <Link
                to={ROUTES.RECRUITER.JOBS}
                className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {recentApplications.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse" role="table">
                  <thead className="text-xs font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="pb-3 font-semibold" scope="col">Candidate</th>
                      <th className="pb-3 font-semibold" scope="col">Position</th>
                      <th className="pb-3 font-semibold" scope="col">Pipeline Stage</th>
                      <th className="pb-3 font-semibold text-right" scope="col">Applied</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                    {recentApplications.map((app) => (
                      <tr
                        key={app._id}
                        className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/40 cursor-pointer"
                        onClick={() => navigate(ROUTES.RECRUITER.JOBS)} // In V2 redirects to recruiter pipeline detail
                      >
                        <td className="py-3.5 pr-3 font-semibold text-slate-900 dark:text-slate-50">
                          {app.candidate?.name || 'Unknown Candidate'}
                        </td>
                        <td className="py-3.5 px-3 text-slate-500 dark:text-slate-400">
                          {app.job?.title || 'Unknown Job'}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={getStatusBadgeClass(app.status)}>
                            {app.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 pl-3 text-right text-slate-400 text-xs font-medium">
                          {app.appliedAt ? format(new Date(app.appliedAt), 'MMM d') : 'Recent'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-6">
                No recent applications received.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Upcoming Interviews list (4 cols on desktop) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors h-full flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                  Upcoming Interviews
                </h3>
                <Link
                  to={ROUTES.RECRUITER.INTERVIEWS}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {upcomingInterviews.length > 0 ? (
                <div className="space-y-3">
                  {upcomingInterviews.map((interview) => (
                    <div
                      key={interview._id}
                      className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/20 transition-all flex flex-col gap-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {interview.candidate?.name || 'Unknown Candidate'}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                          {getInterviewFormatIcon(interview.format)}
                          <span className="capitalize">{interview.format}</span>
                        </span>
                      </div>
                      
                      <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {interview.job?.title || 'Unknown Position'}
                      </span>

                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 pt-1 mt-1 border-t border-slate-100 dark:border-slate-800/40">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {interview.scheduledAt
                            ? format(new Date(interview.scheduledAt), 'MMM d, h:mm a')
                            : 'Unscheduled'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-10">
                  No upcoming interviews scheduled.
                </p>
              )}
            </div>

            {/* V2 Future Analytics Note placeholder box */}
            <div className="p-3 bg-indigo-50/40 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/20 rounded-xl text-[10px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-2">
              <Plus className="w-4 h-4 shrink-0" />
              <span>Historical analytics (V2) will appear here.</span>
            </div>
          </div>
        </div>

      </div>
    </PageContainer>
  );
}
