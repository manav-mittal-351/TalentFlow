// ─── App.jsx ─────────────────────────────────────────────────────────────────
// Main application shell wiring layout templates, route parameters, and auth guards.
// Document reference: Document 10 — Route Structure

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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

      <Suspense fallback={<PageSkeleton />}>
        <Routes>
        {/* 1. Public Route Group */}
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.HOME} element={<HomePage />} />
          <Route path={ROUTES.JOBS} element={<ViewPlaceholder title="Public Careers Board" />} />
          <Route path={ROUTES.JOB_DETAIL} element={<ViewPlaceholder title="Job Specifications" />} />
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
            element={<ViewPlaceholder title="Candidate Workspace Dashboard" />}
          />
          <Route
            path={ROUTES.CANDIDATE.APPLICATIONS}
            element={<ViewPlaceholder title="Candidate Applications Pipeline" />}
          />
          <Route
            path={ROUTES.CANDIDATE.APPLICATION_DETAIL}
            element={<ViewPlaceholder title="Candidate Application Progress Timeline" />}
          />
          <Route
            path={ROUTES.CANDIDATE.SAVED_JOBS}
            element={<ViewPlaceholder title="Candidate Saved Job Openings" />}
          />
          <Route
            path={ROUTES.CANDIDATE.PROFILE}
            element={<ViewPlaceholder title="Candidate Profile Manager" />}
          />
          <Route
            path={ROUTES.CANDIDATE.NOTIFICATIONS}
            element={<ViewPlaceholder title="Candidate Notification Alert Panel" />}
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
            element={<ViewPlaceholder title="Job Applicants Hiring Pipeline" />}
          />
          <Route
            path={ROUTES.RECRUITER.CANDIDATE_DETAIL}
            element={<ViewPlaceholder title="Recruiter Candidate Profile Review" />}
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
            element={<ViewPlaceholder title="Recruiter Notification Alert Panel" />}
          />

          {/* Hiring Manager protected routes */}
          <Route
            path={ROUTES.HM.DASHBOARD}
            element={<ViewPlaceholder title="Hiring Manager Workspace Dashboard" />}
          />
          <Route
            path={ROUTES.HM.JOBS}
            element={<ViewPlaceholder title="Hiring Manager Jobs Registry" />}
          />
          <Route
            path={ROUTES.HM.JOB_PIPELINE}
            element={<ViewPlaceholder title="Hiring Manager Applicants Hiring Pipeline" />}
          />
          <Route
            path={ROUTES.HM.CANDIDATE_DETAIL}
            element={<ViewPlaceholder title="Hiring Manager Candidate Scorecard Evaluation" />}
          />
          <Route
            path={ROUTES.HM.NOTIFICATIONS}
            element={<ViewPlaceholder title="Hiring Manager Notification Alert Panel" />}
          />
        </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
