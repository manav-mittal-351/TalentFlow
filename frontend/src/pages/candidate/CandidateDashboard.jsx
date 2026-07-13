// ─── pages/candidate/CandidateDashboard.jsx ───────────────────────────────────
// Candidate workspace dashboard: stats overview, recent applications,
// upcoming interview, and quick-action shortcuts.
// API: GET /api/v1/dashboard/candidate
// Doc reference: Document 8 — UI Pages § Page 6 Candidate Dashboard

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { StatCard } from '../../components/common/StatCard.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { ROUTES } from '../../constants/routes.js';
import { getStatusBadgeClass, getStatusLabel, getStatusColor } from '../../utils/statusBadge.js';
import api from '../../services/api.js';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Briefcase,
  CheckCircle2,
  Calendar,
  Bookmark,
  AlertTriangle,
  RotateCw,
  ArrowRight,
  Search,
  User,
  Video,
  Phone,
  MapPin,
  Clock,
  TrendingUp,
  Inbox,
  Sparkles,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

// ─── Sub-components ───────────────────────────────────────────────────────────

function SkeletonDashboard() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 rounded-2xl bg-slate-100 dark:bg-slate-800" />
        <div className="h-64 rounded-2xl bg-slate-100 dark:bg-slate-800" />
      </div>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="p-8 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/10 flex flex-col items-center gap-4 max-w-sm text-center shadow-sm">
        <AlertTriangle className="w-10 h-10 text-rose-500 animate-bounce" />
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Failed to load dashboard</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Could not reach the server. Please try again.</p>
        </div>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-200 transition-all focus-ring"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Retry
        </button>
      </div>
    </div>
  );
}

function InterviewFormatIcon({ fmt }) {
  if (fmt === 'video') return <Video className="w-4 h-4 text-indigo-500" />;
  if (fmt === 'phone') return <Phone className="w-4 h-4 text-cyan-500" />;
  return <MapPin className="w-4 h-4 text-amber-500" />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CandidateDashboard() {
  const { user } = useAuth();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['candidateDashboard'],
    queryFn: async () => {
      const res = await api.get('/dashboard/candidate');
      return res.data?.data;
    },
    staleTime: 1000 * 60 * 3, // 3 min cache
  });

  // Build pie chart data from recentApplications status breakdown
  const pieData = useMemo(() => {
    if (!data?.recentApplications?.length) return [];
    const counts = {};
    data.recentApplications.forEach((app) => {
      counts[app.status] = (counts[app.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: getStatusLabel(status),
      value: count,
      color: getStatusColor(status),
    }));
  }, [data]);

  const firstName = user?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (isLoading) return <PageContainer><SkeletonDashboard /></PageContainer>;
  if (isError)   return <PageContainer><ErrorState onRetry={refetch} /></PageContainer>;

  const { stats, recentApplications, upcomingInterview, unreadNotifications } = data;

  return (
    <PageContainer>
      {/* Header */}
      <PageHeader
        title={`${greeting}, ${firstName} 👋`}
        description="Here's a snapshot of your job search activity."
        actions={
          <div className="flex items-center gap-2">
            {unreadNotifications > 0 && (
              <span className="text-[11px] font-bold bg-rose-500 text-white rounded-full px-2 py-0.5 animate-pulse">
                {unreadNotifications} new
              </span>
            )}
            <Link
              to={ROUTES.JOBS}
              id="browse-jobs-btn"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow transition-all hover:scale-[1.01] focus-ring"
            >
              <Search className="w-3.5 h-3.5" />
              Browse Jobs
            </Link>
          </div>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <StatCard
          id="stat-total-applications"
          title="Total Applications"
          value={stats.totalApplications}
          icon={Briefcase}
          color="indigo"
        />
        <StatCard
          id="stat-active-applications"
          title="Active Applications"
          value={stats.activeApplications}
          icon={TrendingUp}
          color="cyan"
          trend={stats.activeApplications > 0 ? 'In progress' : null}
        />
        <StatCard
          id="stat-scheduled-interviews"
          title="Interviews Scheduled"
          value={stats.interviews}
          icon={Calendar}
          color="amber"
        />
        <StatCard
          id="stat-saved-jobs"
          title="Saved Jobs"
          value={stats.savedJobs}
          icon={Bookmark}
          color="green"
        />
      </div>

      {/* Main two-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">

        {/* Left: Recent Applications table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Inbox className="w-3.5 h-3.5" />
              Recent Applications
            </h2>
            <Link
              to={ROUTES.CANDIDATE.APPLICATIONS}
              id="view-all-applications-link"
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {recentApplications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
              <Sparkles className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                No applications yet.
              </p>
              <Link
                to={ROUTES.JOBS}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
              >
                Find your first job →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {recentApplications.map((app) => (
                <Link
                  key={app._id}
                  to={`/candidate/applications/${app._id}`}
                  id={`recent-app-${app._id}`}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {app.job?.title || 'Untitled Position'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {app.job?.company?.name || 'Company'}
                      {app.appliedAt && (
                        <span className="ml-2 text-slate-400 dark:text-slate-500">
                          · {formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true })}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className={getStatusBadgeClass(app.status)}>
                      {getStatusLabel(app.status)}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">

          {/* Upcoming Interview Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center gap-1.5 px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Next Interview
              </h2>
            </div>

            {upcomingInterview ? (
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center shrink-0">
                    <InterviewFormatIcon fmt={upcomingInterview.format} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {upcomingInterview.job?.title || 'Interview'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                      {upcomingInterview.format?.replace('-', ' ')} interview
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>
                    {format(new Date(upcomingInterview.scheduledAt), 'EEE, MMM d · h:mm a')}
                  </span>
                </div>
                {upcomingInterview.candidateInstructions && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 rounded-lg p-2.5 border border-slate-100 dark:border-slate-800 leading-relaxed">
                    {upcomingInterview.candidateInstructions}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                <Calendar className="w-7 h-7 text-slate-300 dark:text-slate-600" />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold">
                  No upcoming interviews
                </p>
              </div>
            )}
          </div>

          {/* Application Status Breakdown Mini Pie */}
          {pieData.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="flex items-center gap-1.5 px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Status Breakdown
                </h2>
              </div>
              <div className="p-5">
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={38}
                      outerRadius={58}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: 'var(--color-bg-surface, #fff)',
                        border: '1px solid var(--color-border, #e2e8f0)',
                        borderRadius: '0.75rem',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2">
                  {pieData.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-600 dark:text-slate-400">
                      <span
                        className="inline-block w-2 h-2 rounded-full shrink-0"
                        style={{ background: entry.color }}
                      />
                      {entry.name} ({entry.value})
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="flex items-center gap-1.5 px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Quick Actions
              </h2>
            </div>
            <div className="p-4 flex flex-col gap-2">
              <Link
                to={ROUTES.JOBS}
                id="quick-browse-jobs"
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-250 transition-colors"
              >
                <Search className="w-4 h-4 text-indigo-500 shrink-0" />
                Browse open positions
              </Link>
              <Link
                to={ROUTES.CANDIDATE.APPLICATIONS}
                id="quick-view-applications"
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-250 transition-colors"
              >
                <Briefcase className="w-4 h-4 text-cyan-500 shrink-0" />
                My applications
              </Link>
              <Link
                to={ROUTES.CANDIDATE.SAVED_JOBS}
                id="quick-saved-jobs"
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-250 transition-colors"
              >
                <Bookmark className="w-4 h-4 text-amber-500 shrink-0" />
                Saved jobs {stats.savedJobs > 0 && <span className="ml-auto text-[10px] bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-1.5 rounded">{stats.savedJobs}</span>}
              </Link>
              <Link
                to={ROUTES.CANDIDATE.PROFILE}
                id="quick-edit-profile"
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-250 transition-colors"
              >
                <User className="w-4 h-4 text-emerald-500 shrink-0" />
                Edit profile
              </Link>
            </div>
          </div>

        </div>
      </div>
    </PageContainer>
  );
}
