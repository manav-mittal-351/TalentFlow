// ─── App.jsx ─────────────────────────────────────────────────────────────────
// Main application shell wiring layout templates, route parameters, and auth guards.
// Document reference: Document 10 — Route Structure

import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';
import { ROUTES } from './constants/routes.js';
import { PublicLayout } from './components/layout/PublicLayout.jsx';
import { DashboardLayout } from './components/layout/DashboardLayout.jsx';
import NotFoundPage from './pages/shared/NotFoundPage.jsx';
import UnauthorizedPage from './pages/shared/UnauthorizedPage.jsx';
import LoginPage from './pages/public/LoginPage.jsx';
import RegisterPage from './pages/public/RegisterPage.jsx';
import HomePage from './pages/public/HomePage.jsx';
import { PageSkeleton } from './components/common/PageSkeleton.jsx';

// Lazy loaded feature-heavy authenticated pages
const RecruiterDashboard = lazy(() => import('./pages/recruiter/RecruiterDashboard.jsx'));
const RecruiterJobsPage = lazy(() => import('./pages/recruiter/RecruiterJobsPage.jsx'));
const CreateJobPage = lazy(() => import('./pages/recruiter/CreateJobPage.jsx'));
const EditJobPage = lazy(() => import('./pages/recruiter/EditJobPage.jsx'));
const JobPipelinePage = lazy(() => import('./pages/recruiter/JobPipelinePage.jsx'));
const CandidateDetailPage = lazy(() => import('./pages/recruiter/CandidateDetailPage.jsx'));
const CandidateDashboard = lazy(() => import('./pages/candidate/CandidateDashboard.jsx'));
const JobBoardPage = lazy(() => import('./pages/public/JobBoardPage.jsx'));
const JobDetailPage = lazy(() => import('./pages/public/JobDetailPage.jsx'));
const CandidateApplicationsPage = lazy(() => import('./pages/candidate/CandidateApplicationsPage.jsx'));
const ApplicationDetailPage = lazy(() => import('./pages/candidate/ApplicationDetailPage.jsx'));
const CandidateProfilePage = lazy(() => import('./pages/candidate/CandidateProfilePage.jsx'));

// Hiring Manager lazy pages
const HMDashboard = lazy(() => import('./pages/hiring-manager/HMDashboard.jsx'));
const HMJobsPage = lazy(() => import('./pages/hiring-manager/HMJobsPage.jsx'));
const HMJobPipelinePage = lazy(() => import('./pages/hiring-manager/HMJobPipelinePage.jsx'));
const HMCandidateDetailPage = lazy(() => import('./pages/hiring-manager/HMCandidateDetailPage.jsx'));

// Shared & Saved Jobs lazy pages
const SavedJobsPage = lazy(() => import('./pages/candidate/SavedJobsPage.jsx'));
const NotificationsPage = lazy(() => import('./pages/shared/NotificationsPage.jsx'));

// Simple placeholder page component builder to avoid empty render exceptions.
function ViewPlaceholder({ title }) {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">{title} Placeholder</h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Workspace pages are coming soon. Layout foundations are fully active and verified.
      </p>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const handleOnline = () => {
      toast.dismiss('offline-alert');
      toast.success('You are back online!');
    };
    const handleOffline = () => {
      toast.error('You are offline. Verify your network connection.', {
        id: 'offline-alert',
        duration: Infinity,
      });
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <BrowserRouter>
      {/* Toast notifications rendering container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--color-bg-surface)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.875rem',
            borderRadius: 'var(--radius-md)',
          },
        }}
      />

      <ErrorBoundary>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
        {/* 1. Public Route Group */}
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.JOBS} element={<JobBoardPage />} />
          <Route path={ROUTES.JOB_DETAIL} element={<JobDetailPage />} />
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
          <Route path={ROUTES.SEARCH} element={<ViewPlaceholder title="Global Job Search" />} />
          
          {/* Public utility pages */}
          <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
          <Route path={ROUTES.NOT_FOUND} element={<NotFoundPage />} />
        </Route>

        {/* 2. Authenticated Dashboard Route Group (handled by DashboardLayout + ProtectedRoute) */}
        <Route element={<DashboardLayout />}>
          {/* Candidate protected routes */}
          <Route
            path={ROUTES.CANDIDATE.DASHBOARD}
            element={<CandidateDashboard />}
          />
          <Route
            path={ROUTES.CANDIDATE.APPLICATIONS}
            element={<CandidateApplicationsPage />}
          />
          <Route
            path={ROUTES.CANDIDATE.APPLICATION_DETAIL}
            element={<ApplicationDetailPage />}
          />
          <Route
            path={ROUTES.CANDIDATE.SAVED_JOBS}
            element={<SavedJobsPage />}
          />
          <Route
            path={ROUTES.CANDIDATE.PROFILE}
            element={<CandidateProfilePage />}
          />
          <Route
            path={ROUTES.CANDIDATE.NOTIFICATIONS}
            element={<NotificationsPage />}
          />

          {/* Recruiter protected routes */}
          <Route
            path={ROUTES.RECRUITER.DASHBOARD}
            element={<RecruiterDashboard />}
          />
          <Route
            path={ROUTES.RECRUITER.JOBS}
            element={<RecruiterJobsPage />}
          />
          <Route
            path={ROUTES.RECRUITER.JOB_NEW}
            element={<CreateJobPage />}
          />
          <Route
            path={ROUTES.RECRUITER.JOB_EDIT}
            element={<EditJobPage />}
          />
          <Route
            path={ROUTES.RECRUITER.JOB_PIPELINE}
            element={<JobPipelinePage />}
          />
          <Route
            path={ROUTES.RECRUITER.CANDIDATE_DETAIL}
            element={<CandidateDetailPage />}
          />
          <Route
            path={ROUTES.RECRUITER.INTERVIEWS}
            element={<ViewPlaceholder title="Recruiter Interviews Calendar" />}
          />
          <Route
            path={ROUTES.RECRUITER.COMPANY}
            element={<ViewPlaceholder title="Manage Company Registry Profile" />}
          />
          <Route
            path={ROUTES.RECRUITER.NOTIFICATIONS}
            element={<NotificationsPage />}
          />

          {/* Hiring Manager protected routes */}
          <Route
            path={ROUTES.HM.DASHBOARD}
            element={<HMDashboard />}
          />
          <Route
            path={ROUTES.HM.JOBS}
            element={<HMJobsPage />}
          />
          <Route
            path={ROUTES.HM.JOB_PIPELINE}
            element={<HMJobPipelinePage />}
          />
          <Route
            path={ROUTES.HM.CANDIDATE_DETAIL}
            element={<HMCandidateDetailPage />}
          />
          <Route
            path={ROUTES.HM.NOTIFICATIONS}
            element={<NotificationsPage />}
          />
        </Route>
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
