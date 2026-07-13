// ─── App.jsx ─────────────────────────────────────────────────────────────────
// App entry shell mapping browser paths to modular UI page routes.
// Document reference: Document 10 — Route Structure

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ROUTES } from './constants/routes.js';

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

      <Routes>
        {/* Public Routes */}
        <Route path={ROUTES.HOME} element={<div>Public Home</div>} />
        <Route path={ROUTES.JOBS} element={<div>Public Job Board</div>} />
        <Route path={ROUTES.JOB_DETAIL} element={<div>Job Details</div>} />
        <Route path={ROUTES.LOGIN} element={<div>Login Screen</div>} />
        <Route path={ROUTES.REGISTER} element={<div>Registration Screen</div>} />
        <Route path={ROUTES.SEARCH} element={<div>Global Search Results</div>} />

        {/* Candidate Protected Routes */}
        <Route path={ROUTES.CANDIDATE.DASHBOARD} element={<div>Candidate Dashboard</div>} />
        <Route path={ROUTES.CANDIDATE.APPLICATIONS} element={<div>My Applications</div>} />
        <Route
          path={ROUTES.CANDIDATE.APPLICATION_DETAIL}
          element={<div>Application Timeline</div>}
        />
        <Route path={ROUTES.CANDIDATE.SAVED_JOBS} element={<div>Saved Jobs List</div>} />
        <Route path={ROUTES.CANDIDATE.PROFILE} element={<div>Candidate Profile</div>} />
        <Route path={ROUTES.CANDIDATE.NOTIFICATIONS} element={<div>Candidate Notifications</div>} />

        {/* Recruiter Protected Routes */}
        <Route path={ROUTES.RECRUITER.DASHBOARD} element={<div>Recruiter Dashboard</div>} />
        <Route path={ROUTES.RECRUITER.JOBS} element={<div>Recruiter Jobs List</div>} />
        <Route path={ROUTES.RECRUITER.JOB_NEW} element={<div>Post New Job</div>} />
        <Route path={ROUTES.RECRUITER.JOB_EDIT} element={<div>Edit Job Post</div>} />
        <Route path={ROUTES.RECRUITER.JOB_PIPELINE} element={<div>Job Hiring Pipeline</div>} />
        <Route
          path={ROUTES.RECRUITER.CANDIDATE_DETAIL}
          element={<div>Candidate Evaluation Profile</div>}
        />
        <Route path={ROUTES.RECRUITER.INTERVIEWS} element={<div>Recruiter Interviews list</div>} />
        <Route path={ROUTES.RECRUITER.COMPANY} element={<div>Manage Company profile</div>} />
        <Route path={ROUTES.RECRUITER.NOTIFICATIONS} element={<div>Recruiter Notifications</div>} />

        {/* Hiring Manager Protected Routes */}
        <Route path={ROUTES.HM.DASHBOARD} element={<div>Hiring Manager Dashboard</div>} />
        <Route path={ROUTES.HM.JOBS} element={<div>HM Jobs list</div>} />
        <Route path={ROUTES.HM.JOB_PIPELINE} element={<div>HM Job applications list</div>} />
        <Route
          path={ROUTES.HM.CANDIDATE_DETAIL}
          element={<div>Candidate scorecard evaluations</div>}
        />
        <Route path={ROUTES.HM.NOTIFICATIONS} element={<div>HM Notifications</div>} />

        {/* Utility / Error Routes */}
        <Route path={ROUTES.UNAUTHORIZED} element={<div>Access Unauthorized</div>} />
        <Route path={ROUTES.NOT_FOUND} element={<div>Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}
