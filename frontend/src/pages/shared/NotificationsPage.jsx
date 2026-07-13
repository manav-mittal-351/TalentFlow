// ─── pages/shared/NotificationsPage.jsx ─────────────────────────────────────────
// Global in-app notifications hub. Displays a user's notifications, unread counts,
// tab filters, and handles mark-as-read and redirection workflows.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/layout/PageContainer.jsx';
import { PageHeader } from '../../components/layout/PageHeader.jsx';
import { useNotifications } from '../../contexts/NotificationContext.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../../utils/cn.js';
import {
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Info,
  CheckCheck,
  Inbox,
  Loader2,
} from 'lucide-react';

const ICON_MAP = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertOctagon,
  info: Info,
};

const COLOR_MAP = {
  success: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 border-emerald-100 dark:border-emerald-900/35',
  warning: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/35',
  error: 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 border-rose-100 dark:border-rose-900/35',
  info: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-450 border-blue-105 dark:border-blue-900/35',
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'unread'

  const userRole = user?.role || 'candidate';

  // Navigate to appropriate role-scoped detail view
  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif._id);
    }

    const appId = notif.relatedApp?._id || notif.relatedApp;
    const jobId = notif.relatedJob?._id || notif.relatedJob;

    // Routing mapping matrix
    if (userRole === 'candidate') {
      if (appId) {
        navigate(`/candidate/applications/${appId}`);
      } else {
        navigate('/candidate/dashboard');
      }
    } else if (userRole === 'recruiter') {
      if (appId) {
        navigate(`/recruiter/candidates/${appId}`);
      } else if (jobId) {
        navigate(`/recruiter/jobs/${jobId}`);
      } else {
        navigate('/recruiter/dashboard');
      }
    } else if (userRole === 'hiring_manager') {
      if (appId) {
        navigate(`/hiring-manager/candidates/${appId}`);
      } else if (jobId) {
        navigate(`/hiring-manager/jobs/${jobId}`);
      } else {
        navigate('/hiring-manager/dashboard');
      }
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (activeTab === 'unread') return !notif.isRead;
    return true;
  });

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return '';
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch (e) {
      return '';
    }
  };

  return (
    <PageContainer>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Notification Center"
          description="Track status updates, interview schedules, and evaluation feedback alerts."
        />

        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="self-start sm:self-center inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors focus-ring shadow-sm"
            type="button"
          >
            <CheckCheck className="w-4 h-4 text-indigo-500" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Tabs selectors */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 mt-6 gap-6 text-xs font-bold text-slate-400">
        <button
          onClick={() => setActiveTab('all')}
          className={cn(
            'pb-3 border-b-2 transition-all relative',
            activeTab === 'all'
              ? 'border-indigo-650 text-indigo-650 dark:text-indigo-400 font-extrabold'
              : 'border-transparent hover:text-slate-600 dark:hover:text-slate-200'
          )}
          type="button"
        >
          <span>All Notifications</span>
          <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 font-bold">
            {notifications.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('unread')}
          className={cn(
            'pb-3 border-b-2 transition-all relative',
            activeTab === 'unread'
              ? 'border-indigo-650 text-indigo-650 dark:text-indigo-400 font-extrabold'
              : 'border-transparent hover:text-slate-600 dark:hover:text-slate-200'
          )}
          type="button"
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/35 text-[10px] text-indigo-600 dark:text-indigo-400 font-bold animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications list */}
      <div className="mt-6">
        {isLoading && notifications.length === 0 ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="border border-dashed border-slate-205 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3 bg-slate-50/20 dark:bg-slate-950/5">
            <Inbox className="w-10 h-10 text-slate-350 mx-auto" />
            <h4 className="text-sm font-bold text-slate-805 dark:text-slate-200">
              You&apos;re all caught up 🎉
            </h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mx-auto leading-relaxed">
              No notifications found matching this list filter. New status changes will appear here instantly.
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-sm">
            {filteredNotifications.map((notif) => {
              const IconComponent = ICON_MAP[notif.icon] || Info;
              const colorClasses = COLOR_MAP[notif.icon] || COLOR_MAP.info;

              return (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={cn(
                    'p-4 flex items-start justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-850/40 transition-colors cursor-pointer text-xs',
                    !notif.isRead && 'bg-indigo-50/15 dark:bg-indigo-950/5'
                  )}
                >
                  <div className="flex items-start gap-3.5">
                    {/* Icon tag */}
                    <div className={cn('p-2 border rounded-xl shrink-0 flex items-center justify-center', colorClasses)}>
                      <IconComponent className="w-4 h-4 shrink-0" />
                    </div>
                    {/* Message content */}
                    <div className="space-y-1 pr-4">
                      <p className={cn(
                        'text-slate-700 dark:text-slate-300 leading-relaxed font-semibold',
                        !notif.isRead && 'text-slate-900 dark:text-slate-100 font-bold'
                      )}>
                        {notif.message}
                      </p>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {getRelativeTime(notif.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Unread circle badge */}
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-2.5 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
