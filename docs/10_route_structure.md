# 📄 Document 10 of 10 — Route Structure (Final)
> **TalentFlow** | Full-Stack Recruitment Management Platform

---

## Overview

TalentFlow uses **React Router v6** for client-side routing with nested layouts, lazy-loaded code splitting per role group, URL-driven filter state, route metadata, and Error Boundaries per route group. Backend routes are all mounted under `/api/v1`.

> **API Convention:** All backend endpoints use `/api/v1` as the base path. This is consistent throughout all documents.

---

## Note: React Router Data API

React Router v6.4+ introduced a more powerful data-loading API:

```js
// Modern alternative (not used in V1)
const router = createBrowserRouter([
  {
    path: '/recruiter/jobs',
    element: <JobsPage />,
    loader: jobsLoader,       // data fetched before render
    errorElement: <ErrorPage />,
  },
]);
```

**Why we use `<BrowserRouter>` instead:**
- `<BrowserRouter>` + `<Routes>` is cleaner to read, teach, and explain in interviews
- TanStack Query already handles data fetching, loading, and error states — `loader()` would be redundant
- The Data API shines when not using React Query; combining both creates unnecessary complexity

**V2 consideration:** If React Query is ever removed, migrating to `createBrowserRouter` + loaders is straightforward — the route structure is already modular enough to support it.

---

## 1. Route Architecture Principles

1. **Outlet-based nested layouts** — `AppShell` renders `<Outlet />` so React Router v6 manages child mounting natively
2. **Role-based protection** — `ProtectedRoute` checks auth + role before rendering; wrong role → `/unauthorized`
3. **Error Boundaries** — Each role group is wrapped independently so one page crash doesn't kill the app
4. **PageSkeleton loading** — `Suspense` fallback uses `PageSkeleton` (not a generic spinner) for smooth UX
5. **Lazy loading** — Each role's page group is code-split via `React.lazy()` — candidates don't download recruiter bundles
6. **Route constants** — All paths live in `src/constants/routes.js`; never hardcoded in components
7. **URL as source of truth** — Filters, pagination, search, and sort live in URL query params via `useSearchParams`
8. **Route metadata** — Each route carries title, icon, role, and sidebar visibility — consumed by Sidebar, Breadcrumbs, and `<title>`
9. **Analytics hooks** — Page view and action events are fired from a central `useAnalytics` hook
10. **Smart scroll restoration** — List pages restore scroll position; detail pages scroll to top

---

## 2. Route Constants

**File:** `src/constants/routes.js`

```js
export const ROUTES = {
  // Public
  HOME:           '/',
  JOBS:           '/jobs',
  JOB_DETAIL:     '/jobs/:jobId',
  LOGIN:          '/login',
  REGISTER:       '/register',
  SEARCH:         '/search',

  // Candidate
  CANDIDATE: {
    DASHBOARD:          '/candidate/dashboard',
    APPLICATIONS:       '/candidate/applications',
    APPLICATION_DETAIL: '/candidate/applications/:applicationId',
    SAVED_JOBS:         '/candidate/saved-jobs',
    PROFILE:            '/candidate/profile',
    NOTIFICATIONS:      '/candidate/notifications',
  },

  // Recruiter
  RECRUITER: {
    DASHBOARD:          '/recruiter/dashboard',
    JOBS:               '/recruiter/jobs',
    JOB_NEW:            '/recruiter/jobs/new',
    JOB_EDIT:           '/recruiter/jobs/:jobId/edit',
    JOB_PIPELINE:       '/recruiter/jobs/:jobId',
    CANDIDATE_DETAIL:   '/recruiter/candidates/:candidateId',
    INTERVIEWS:         '/recruiter/interviews',
    COMPANY:            '/recruiter/company',
    NOTIFICATIONS:      '/recruiter/notifications',
  },

  // Hiring Manager
  HM: {
    DASHBOARD:          '/hiring-manager/dashboard',
    JOBS:               '/hiring-manager/jobs',
    JOB_PIPELINE:       '/hiring-manager/jobs/:jobId',
    CANDIDATE_DETAIL:   '/hiring-manager/candidates/:candidateId',
    NOTIFICATIONS:      '/hiring-manager/notifications',
  },

  // Utility
  UNAUTHORIZED: '/unauthorized',
  NOT_FOUND:    '*',
};

// Build parameterised paths
export const buildRoute = (route, params) =>
  Object.entries(params).reduce(
    (path, [key, val]) => path.replace(`:${key}`, val),
    route
  );

// Usage:
// buildRoute(ROUTES.RECRUITER.JOB_PIPELINE, { jobId: '123' })
// → '/recruiter/jobs/123'
```

---

## 3. Route Metadata Config

**File:** `src/constants/routeMeta.js`

Route metadata drives Sidebar nav items, Breadcrumbs, and page `<title>` — all automatically. No duplication.

> **SEO Design Choice:** Only public routes expose SEO metadata (e.g., `meta: { title, description, canonical, robots }`). Authenticated dashboard pages intentionally omit this metadata because they are private and must not be indexed by search engines.
> 
> **Animation Note:** The `pageTransition` key ('fade', 'slide', etc.) is consumed by Framer Motion's `<AnimatePresence>` wrapper in `AppShell` or page routing logic to coordinate transition styles dynamically when swapping routes.

```js
import {
  LayoutDashboard, Briefcase, Users, Calendar,
  Building2, Bell, BookmarkCheck, FileText, User, Search
} from 'lucide-react';

// ─── Route Metadata Schema ────────────────────────────────────────────────
// icon: store the COMPONENT REFERENCE, not a JSX instance.
// Reason: component refs are serializable, testable, and reusable.
// Render with: const Icon = meta.icon; <Icon size={18} />
export const ROUTE_META = {
  // ── Recruiter ─────────────────────────────────────
  [ROUTES.RECRUITER.DASHBOARD]: {
    title:          'Dashboard',
    icon:           LayoutDashboard,   // ← component ref, not <LayoutDashboard />
    roles:          ['recruiter'],
    requiresAuth:   true,
    layout:         'dashboard',
    showInSidebar:  true,
    pageTransition: 'fade',
    permissions:    [],
    breadcrumb:     ['Dashboard'],
  },
  [ROUTES.RECRUITER.JOBS]: {
    title:          'Job Postings',
    icon:           Briefcase,
    roles:          ['recruiter'],
    requiresAuth:   true,
    layout:         'dashboard',
    showInSidebar:  true,
    pageTransition: 'fade',
    permissions:    [],
    breadcrumb:     ['Dashboard', 'Jobs'],
  },
  [ROUTES.RECRUITER.JOB_PIPELINE]: {
    title:          'Job Pipeline',
    icon:           Users,
    roles:          ['recruiter'],
    requiresAuth:   true,
    layout:         'dashboard',
    showInSidebar:  false,
    pageTransition: 'slide',
    permissions:    [],
    breadcrumb:     ['Dashboard', 'Jobs', ':jobTitle'],
  },
  [ROUTES.RECRUITER.CANDIDATE_DETAIL]: {
    title:          'Candidate Profile',
    icon:           User,
    roles:          ['recruiter'],
    requiresAuth:   true,
    layout:         'dashboard',
    showInSidebar:  false,
    pageTransition: 'slide',
    permissions:    [],
    breadcrumb:     ['Dashboard', 'Jobs', ':jobTitle', ':candidateName'],
  },
  [ROUTES.RECRUITER.INTERVIEWS]: {
    title:          'Interviews',
    icon:           Calendar,
    roles:          ['recruiter'],
    requiresAuth:   true,
    layout:         'dashboard',
    showInSidebar:  true,
    pageTransition: 'fade',
    permissions:    [],
    breadcrumb:     ['Dashboard', 'Interviews'],
  },
  [ROUTES.RECRUITER.COMPANY]: {
    title:          'Company Information',
    icon:           Building2,
    roles:          ['recruiter'],
    requiresAuth:   true,
    layout:         'dashboard',
    showInSidebar:  true,
    pageTransition: 'fade',
    permissions:    [],
    breadcrumb:     ['Dashboard', 'Company'],
  },
  [ROUTES.RECRUITER.NOTIFICATIONS]: {
    title:          'Notifications',
    icon:           Bell,
    roles:          ['recruiter'],
    requiresAuth:   true,
    layout:         'dashboard',
    showInSidebar:  true,
    pageTransition: 'fade',
    permissions:    [],
    breadcrumb:     ['Dashboard', 'Notifications'],
  },

  // ── Hiring Manager ────────────────────────────────
  [ROUTES.HM.DASHBOARD]: {
    title: 'Dashboard', icon: LayoutDashboard,
    roles: ['hiring_manager'], requiresAuth: true, layout: 'dashboard',
    showInSidebar: true, pageTransition: 'fade', permissions: [],
    breadcrumb: ['Dashboard'],
  },
  [ROUTES.HM.JOBS]: {
    title: 'My Jobs', icon: Briefcase,
    roles: ['hiring_manager'], requiresAuth: true, layout: 'dashboard',
    showInSidebar: true, pageTransition: 'fade', permissions: [],
    breadcrumb: ['Dashboard', 'My Jobs'],
  },
  [ROUTES.HM.CANDIDATE_DETAIL]: {
    title: 'Candidate Profile', icon: User,
    roles: ['hiring_manager'], requiresAuth: true, layout: 'dashboard',
    showInSidebar: false, pageTransition: 'slide', permissions: [],
    breadcrumb: ['Dashboard', 'My Jobs', ':jobTitle', ':candidateName'],
  },

  // ── Candidate ─────────────────────────────────────
  [ROUTES.CANDIDATE.DASHBOARD]: {
    title: 'Dashboard', icon: LayoutDashboard,
    roles: ['candidate'], requiresAuth: true, layout: 'dashboard',
    showInSidebar: true, pageTransition: 'fade', permissions: [],
    breadcrumb: ['Dashboard'],
  },
  [ROUTES.CANDIDATE.APPLICATIONS]: {
    title: 'My Applications', icon: FileText,
    roles: ['candidate'], requiresAuth: true, layout: 'dashboard',
    showInSidebar: true, pageTransition: 'fade', permissions: [],
    breadcrumb: ['Dashboard', 'My Applications'],
  },
  [ROUTES.CANDIDATE.SAVED_JOBS]: {
    title: 'Saved Jobs', icon: BookmarkCheck,
    roles: ['candidate'], requiresAuth: true, layout: 'dashboard',
    showInSidebar: true, pageTransition: 'fade', permissions: [],
    breadcrumb: ['Dashboard', 'Saved Jobs'],
  },
  [ROUTES.CANDIDATE.PROFILE]: {
    title: 'My Profile', icon: User,
    roles: ['candidate'], requiresAuth: true, layout: 'dashboard',
    showInSidebar: true, pageTransition: 'fade', permissions: [],
    breadcrumb: ['Dashboard', 'My Profile'],
  },
  [ROUTES.CANDIDATE.NOTIFICATIONS]: {
    title: 'Notifications', icon: Bell,
    roles: ['candidate'], requiresAuth: true, layout: 'dashboard',
    showInSidebar: true, pageTransition: 'fade', permissions: [],
    breadcrumb: ['Dashboard', 'Notifications'],
  },

  // ── Public ────────────────────────────────────────
  [ROUTES.SEARCH]: {
    title: 'Search', icon: Search,
    roles: [], requiresAuth: false, layout: 'public',
    showInSidebar: false, pageTransition: 'fade', permissions: [],
    breadcrumb: ['Search'],
    meta: {
      title: 'Search Careers - TalentFlow',
      description: 'Search open positions across departments and find your next role.',
      canonical: 'https://talentflow.com/search',
      robots: 'index, follow'
    }
  },
  [ROUTES.HOME]: {
    title: 'Home', icon: null,
    roles: [], requiresAuth: false, layout: 'public',
    showInSidebar: false, pageTransition: 'fade', permissions: [],
    breadcrumb: ['Home'],
    meta: {
      title: 'TalentFlow - Recruitment Management Platform',
      description: 'The premium full-stack recruitment platform for recruiters, candidates, and hiring managers.',
      canonical: 'https://talentflow.com/',
      robots: 'index, follow'
    }
  }
};

// ─── Dynamic Route Matching ──────────────────────────────────────────────
// IMPORTANT: ROUTE_META[pathname] only works for exact paths like /jobs.
// It FAILS for parameterised paths like /jobs/123 (/jobs/:jobId !== /jobs/123).
// Use matchPath() from React Router to resolve parameterised routes correctly.
import { matchPath, useLocation } from 'react-router-dom';

export const useRouteMeta = () => {
  const { pathname } = useLocation();

  // Try exact match first
  if (ROUTE_META[pathname]) return ROUTE_META[pathname];

  // Fall back to pattern matching for parameterised routes
  for (const [pattern, meta] of Object.entries(ROUTE_META)) {
    const match = matchPath(pattern, pathname);
    if (match) return { ...meta, params: match.params };
  }

  return { title: 'TalentFlow', breadcrumb: [], icon: null };
};
```

**Consumer examples:**
```jsx
// Sidebar — auto-generates nav items (component ref icons rendered correctly)
const sidebarItems = Object.entries(ROUTE_META)
  .filter(([_, meta]) => meta.roles.includes(user.role) && meta.showInSidebar)
  .map(([path, meta]) => {
    const Icon = meta.icon;          // ← destructure the component ref
    return (
      <NavItem key={path} to={path} label={meta.title}>
        <Icon size={18} />           {/* ← render with size prop */}
      </NavItem>
    );
  });

// Navbar — auto page title
const meta = useRouteMeta();
const Icon = meta.icon;
useEffect(() => { document.title = `${meta.title} — TalentFlow`; }, [meta.title]);

// Breadcrumb — renders from meta.breadcrumb array (dynamic segments resolved by page)
// PostHog / analytics — use meta.title as the page name
track(ANALYTICS_EVENTS.PAGE_VIEWED, { page: meta.title });
```

---

## 4. Error Boundary

**File:** `src/components/common/ErrorBoundary.jsx`

```jsx
import { Component } from 'react';

export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // V2: pipe to Sentry or PostHog error tracking
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // Reset also reloads the failed route by navigating to current path
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Something went wrong
          </h2>
          <p className="text-neutral-500 max-w-sm">
            This page encountered an error. Your other work is safe.
          </p>
          <button
            onClick={this.handleReset}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Alternative: react-error-boundary (recommended for V2) ───────────────
// npm install react-error-boundary
//
// import { ErrorBoundary } from 'react-error-boundary';
//
// <ErrorBoundary
//   FallbackComponent={ErrorFallback}
//   onReset={() => queryClient.clear()}   // clears React Query cache on reset
//   onError={(error) => posthog.captureException(error)}
// >
//
// Benefits over the class-based approach:
// - onReset() callback clears stale cached data before retry and remounts the failed route instead of reloading the browser
// - onError() integrates directly with PostHog / Sentry
// - withErrorBoundary() HOC for wrapping lazy-loaded components
```

---

## 5. PageSkeleton (Suspense Fallback)

**File:** `src/components/common/PageSkeleton.jsx`

Replaces the generic `<Spinner />` in `<Suspense>`. Renders a skeleton matching the shape of the loading page — much smoother than a centered spinner.

```jsx
import { Skeleton } from './Skeleton';

export function PageSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* PageHeader skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant="text" width="200px" height="28px" />
          <Skeleton variant="text" width="300px" height="16px" />
        </div>
        <Skeleton width="120px" height="40px" className="rounded-lg" />
      </div>
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} variant="stat" />
        ))}
      </div>
      {/* Table skeleton */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} variant="table-row" />
        ))}
      </div>
    </div>
  );
}
```

---

## 6. Breadcrumb Component

**File:** `src/components/common/Breadcrumb.jsx`

Auto-generated from route metadata. Dynamic segments (`:jobTitle`, `:candidateName`) are resolved by the page that owns them via a context or prop.

```jsx
Props:
  overrides?: Record<string, string>  // resolve dynamic segments
  // e.g. { ':jobTitle': 'Frontend Developer', ':candidateName': 'John Smith' }

// Usage in CandidateDetailPage:
<Breadcrumb overrides={{ ':jobTitle': job.title, ':candidateName': candidate.name }} />
// Renders: Dashboard / Jobs / Frontend Developer / John Smith
```

**Design:** `Home icon > Jobs > Frontend Developer > John Smith`
— Clickable except last segment. Muted separator (`/`). Last segment is current page (not linked, slightly bold). Responsive: collapses to `...` on mobile.

---

## 7. URL as Source of Truth (useSearchParams)

All filterable/sortable/paginated list pages store their state in the URL, not in `useState`. This means filters survive refresh, can be shared via link, and work with the browser back button.

**File:** `src/hooks/useUrlFilters.js`

```js
import { useSearchParams } from 'react-router-dom';

export function useUrlFilters(defaults = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = {
    page:       Number(searchParams.get('page'))       || defaults.page       || 1,
    limit:      Number(searchParams.get('limit'))      || defaults.limit      || 10,
    search:     searchParams.get('search')             || defaults.search     || '',
    status:     searchParams.get('status')             || defaults.status     || '',
    department: searchParams.get('department')         || defaults.department || '',
    jobType:    searchParams.get('jobType')            || defaults.jobType    || '',
    sortBy:     searchParams.get('sortBy')             || defaults.sortBy     || 'newest',
  };

  const setFilter = (key, value) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value === '' || value === null) {
        next.delete(key);
      } else {
        next.set(key, value);
        if (key !== 'page') next.set('page', '1'); // reset page on filter change
      }
      return next;
    });
  };

  const clearAll = () => setSearchParams({});

  return { filters, setFilter, clearAll };
}
```

**Usage examples:**
```js
// Job Board
const { filters, setFilter, clearAll } = useUrlFilters({ limit: 12 });
// URL: /jobs?department=Engineering&sortBy=salary&page=2

// Job Pipeline (Recruiter)
const { filters, setFilter } = useUrlFilters();
// URL: /recruiter/jobs/123?status=shortlisted&search=manav&page=1

// My Applications (Candidate)
const { filters, setFilter } = useUrlFilters();
// URL: /candidate/applications?status=interview&sortBy=latest
```

**Result:** Refresh, share, or bookmark any filtered view — it works.

---

## 8. Global Search Route

**Route:** `/search`
**Access:** Public (results scope to role if authenticated)

**Purpose:** Mobile-accessible global search. Also triggered by `Ctrl+K` which opens `CommandPalette` overlay on desktop — `/search` is the full-page equivalent.

```jsx
// SearchPage — full-page search
// Query: /search?q=frontend+developer

// Results sections (authenticated):
//   Recruiter → Jobs, Candidates
//   HM        → Candidates (own dept)
//   Candidate → Jobs only

// Results sections (unauthenticated):
//   Public job listings only
```

**`SearchInput` in Navbar:** On mobile (< `lg`), clicking search navigates to `/search` instead of opening `CommandPalette` overlay.

---

## 9. Analytics Hooks

**File:** `src/hooks/useAnalytics.js`

Thin event-tracking hook. Fires events to `console` in development, to an analytics service (PostHog, Mixpanel, or custom) in production. Architecture is in place — implementation can be swapped without touching pages.

```js
export function useAnalytics() {
  const { user } = useAuth();

  const track = (eventName, properties = {}) => {
    const payload = {
      event: eventName,
      userId: user?._id,
      role: user?.role,
      timestamp: new Date().toISOString(),
      ...properties,
    };

    if (import.meta.env.DEV) {
      console.log('[Analytics]', payload);
      return;
    }

    // V2: analytics.track(eventName, payload);
  };

  return { track };
}

// Standard events:
export const ANALYTICS_EVENTS = {
  PAGE_VIEWED:          'page_viewed',
  JOB_APPLIED:          'job_applied',
  JOB_SAVED:            'job_saved',
  JOB_CREATED:          'job_created',
  RESUME_UPLOADED:      'resume_uploaded',
  INTERVIEW_SCHEDULED:  'interview_scheduled',
  STATUS_UPDATED:       'status_updated',
  FEEDBACK_SUBMITTED:   'feedback_submitted',
  SEARCH_PERFORMED:     'search_performed',
  NOTIFICATION_READ:    'notification_read',
  // System & Authentication Tracking:
  LOGIN:                'auth_login',
  LOGOUT:               'auth_logout',
  NOT_FOUND_ACCESSED:   'error_404_page',
  UNAUTHORIZED_ACCESSED:'error_403_page',
  ROUTE_CHANGE_TIMING:  'perf_route_load_time',
};
```

**Usage — page view tracking:**
```js
// In each page component:
const { track } = useAnalytics();
useEffect(() => {
  track(ANALYTICS_EVENTS.PAGE_VIEWED, { page: 'job_pipeline', jobId });
}, [jobId]);

// On action:
const handleApply = async () => {
  await submitApplication();
  track(ANALYTICS_EVENTS.JOB_APPLIED, { jobId, jobTitle });
};
```

---

## 10. Smart Scroll Restoration

**File:** `src/hooks/useScrollRestoration.js`

- **Detail pages** (candidate profile, application detail, job detail): always scroll to top on mount
- **List pages** (job board, pipeline, my applications): restore previous scroll position when navigating back

```js
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Pages that should restore scroll position (list/board pages)
const SCROLL_RESTORE_ROUTES = [
  '/jobs',
  '/candidate/applications',
  '/candidate/saved-jobs',
  '/recruiter/jobs',
  '/recruiter/interviews',
];

// ─── Why sessionStorage instead of Map() ─────────────────────────────────
// A module-scope Map() is cleared on page refresh.
// sessionStorage persists across soft navigations AND page refreshes
// within the same browser tab — so returning to /jobs after a refresh
// still lands the user at their previous scroll position.
export function useScrollRestoration() {
  const { pathname } = useLocation();
  const shouldRestore = SCROLL_RESTORE_ROUTES.some(r => pathname === r);
  const storageKey = `scroll:${pathname}`;

  useEffect(() => {
    if (shouldRestore) {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        window.scrollTo({ top: parseInt(saved, 10), behavior: 'instant' });
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    // Save scroll position when leaving the page
    return () => {
      if (shouldRestore) {
        sessionStorage.setItem(storageKey, String(Math.round(window.scrollY)));
      }
    };
  }, [pathname]);
}
```

---

## 11. Full `App.jsx` Configuration

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ThemeProvider }       from './components/layout/ThemeProvider';
import { AuthProvider }        from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ProtectedRoute }      from './components/layout/ProtectedRoute';
import { ErrorBoundary }       from './components/common/ErrorBoundary';
import { PageSkeleton }        from './components/common/PageSkeleton';
import AppShell                from './components/layout/AppShell';
import ScrollToTop             from './components/layout/ScrollToTop';
import { ROUTES }              from './constants/routes';

// ─── Eager (critical path) ────────────────────────────────────────────────
import HomePage         from './pages/public/HomePage';
import LoginPage        from './pages/public/LoginPage';
import RegisterPage     from './pages/public/RegisterPage';
import NotFoundPage     from './pages/shared/NotFoundPage';
import UnauthorizedPage from './pages/shared/UnauthorizedPage';

// ─── Lazy by role group ───────────────────────────────────────────────────
const JobBoardPage      = lazy(() => import('./pages/public/JobBoardPage'));
const JobDetailPage     = lazy(() => import('./pages/public/JobDetailPage'));
const SearchPage        = lazy(() => import('./pages/public/SearchPage'));

const CandidateDashboard    = lazy(() => import('./pages/candidate/CandidateDashboard'));
const MyApplicationsPage    = lazy(() => import('./pages/candidate/MyApplicationsPage'));
const ApplicationDetailPage = lazy(() => import('./pages/candidate/ApplicationDetailPage'));
const SavedJobsPage         = lazy(() => import('./pages/candidate/SavedJobsPage'));
const CandidateProfilePage  = lazy(() => import('./pages/candidate/CandidateProfilePage'));
const NotificationsPage     = lazy(() => import('./pages/shared/NotificationsPage'));

const RecruiterDashboard  = lazy(() => import('./pages/recruiter/RecruiterDashboard'));
const JobsPage            = lazy(() => import('./pages/recruiter/JobsPage'));
const CreateJobPage       = lazy(() => import('./pages/recruiter/CreateJobPage'));
const EditJobPage         = lazy(() => import('./pages/recruiter/EditJobPage'));
const JobPipelinePage     = lazy(() => import('./pages/recruiter/JobPipelinePage'));
const CandidateDetailPage = lazy(() => import('./pages/recruiter/CandidateDetailPage'));
const InterviewsPage      = lazy(() => import('./pages/recruiter/InterviewsPage'));
const CompanyPage         = lazy(() => import('./pages/recruiter/CompanyPage'));

const HMDashboard           = lazy(() => import('./pages/hiring-manager/HMDashboard'));
const HMJobsPage            = lazy(() => import('./pages/hiring-manager/HMJobsPage'));
const HMJobPipelinePage     = lazy(() => import('./pages/hiring-manager/HMJobPipelinePage'));
const HMCandidateDetailPage = lazy(() => import('./pages/hiring-manager/HMCandidateDetailPage'));

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <BrowserRouter>
            <ScrollToTop />

            {/* ── Public Routes ────────────────────────────────────── */}
            <Routes>
              <Route path={ROUTES.HOME}     element={<HomePage />} />
              <Route path={ROUTES.LOGIN}    element={<LoginPage />} />
              <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

              <Route path={ROUTES.JOBS} element={
                <ErrorBoundary>
                  <Suspense fallback={<PageSkeleton />}>
                    <JobBoardPage />
                  </Suspense>
                </ErrorBoundary>
              } />

              <Route path={ROUTES.JOB_DETAIL} element={
                <Suspense fallback={<PageSkeleton />}><JobDetailPage /></Suspense>
              } />

              <Route path={ROUTES.SEARCH} element={
                <Suspense fallback={<PageSkeleton />}><SearchPage /></Suspense>
              } />

              {/* ── Candidate Routes ───────────────────────────────── */}
              <Route element={
                <ProtectedRoute allowedRoles={['candidate']}>
                  <ErrorBoundary>
                    <AppShell role="candidate" />   {/* AppShell renders <Outlet /> */}
                  </ErrorBoundary>
                </ProtectedRoute>
              }>
                <Route path={ROUTES.CANDIDATE.DASHBOARD}
                  element={<Suspense fallback={<PageSkeleton />}><CandidateDashboard /></Suspense>} />
                <Route path={ROUTES.CANDIDATE.APPLICATIONS}
                  element={<Suspense fallback={<PageSkeleton />}><MyApplicationsPage /></Suspense>} />
                <Route path={ROUTES.CANDIDATE.APPLICATION_DETAIL}
                  element={<Suspense fallback={<PageSkeleton />}><ApplicationDetailPage /></Suspense>} />
                <Route path={ROUTES.CANDIDATE.SAVED_JOBS}
                  element={<Suspense fallback={<PageSkeleton />}><SavedJobsPage /></Suspense>} />
                <Route path={ROUTES.CANDIDATE.PROFILE}
                  element={<Suspense fallback={<PageSkeleton />}><CandidateProfilePage /></Suspense>} />
                <Route path={ROUTES.CANDIDATE.NOTIFICATIONS}
                  element={<Suspense fallback={<PageSkeleton />}><NotificationsPage /></Suspense>} />
              </Route>

              {/* ── Recruiter Routes ───────────────────────────────── */}
              <Route element={
                <ProtectedRoute allowedRoles={['recruiter']}>
                  <ErrorBoundary>
                    <AppShell role="recruiter" />
                  </ErrorBoundary>
                </ProtectedRoute>
              }>
                <Route path={ROUTES.RECRUITER.DASHBOARD}
                  element={<Suspense fallback={<PageSkeleton />}><RecruiterDashboard /></Suspense>} />
                <Route path={ROUTES.RECRUITER.JOBS}
                  element={<Suspense fallback={<PageSkeleton />}><JobsPage /></Suspense>} />
                <Route path={ROUTES.RECRUITER.JOB_NEW}
                  element={<Suspense fallback={<PageSkeleton />}><CreateJobPage /></Suspense>} />
                <Route path={ROUTES.RECRUITER.JOB_EDIT}
                  element={<Suspense fallback={<PageSkeleton />}><EditJobPage /></Suspense>} />
                <Route path={ROUTES.RECRUITER.JOB_PIPELINE}
                  element={<Suspense fallback={<PageSkeleton />}><JobPipelinePage /></Suspense>} />
                <Route path={ROUTES.RECRUITER.CANDIDATE_DETAIL}
                  element={<Suspense fallback={<PageSkeleton />}><CandidateDetailPage /></Suspense>} />
                <Route path={ROUTES.RECRUITER.INTERVIEWS}
                  element={<Suspense fallback={<PageSkeleton />}><InterviewsPage /></Suspense>} />
                <Route path={ROUTES.RECRUITER.COMPANY}
                  element={<Suspense fallback={<PageSkeleton />}><CompanyPage /></Suspense>} />
                <Route path={ROUTES.RECRUITER.NOTIFICATIONS}
                  element={<Suspense fallback={<PageSkeleton />}><NotificationsPage /></Suspense>} />
              </Route>

              {/* ── Hiring Manager Routes ──────────────────────────── */}
              <Route element={
                <ProtectedRoute allowedRoles={['hiring_manager']}>
                  <ErrorBoundary>
                    <AppShell role="hiring_manager" />
                  </ErrorBoundary>
                </ProtectedRoute>
              }>
                <Route path={ROUTES.HM.DASHBOARD}
                  element={<Suspense fallback={<PageSkeleton />}><HMDashboard /></Suspense>} />
                <Route path={ROUTES.HM.JOBS}
                  element={<Suspense fallback={<PageSkeleton />}><HMJobsPage /></Suspense>} />
                <Route path={ROUTES.HM.JOB_PIPELINE}
                  element={<Suspense fallback={<PageSkeleton />}><HMJobPipelinePage /></Suspense>} />
                <Route path={ROUTES.HM.CANDIDATE_DETAIL}
                  element={<Suspense fallback={<PageSkeleton />}><HMCandidateDetailPage /></Suspense>} />
                <Route path={ROUTES.HM.NOTIFICATIONS}
                  element={<Suspense fallback={<PageSkeleton />}><NotificationsPage /></Suspense>} />
              </Route>

              {/* ── Utility Routes ─────────────────────────────────── */}
              <Route path={ROUTES.UNAUTHORIZED} element={<UnauthorizedPage />} />
              <Route path={ROUTES.NOT_FOUND}    element={<NotFoundPage />} />
            </Routes>

          </BrowserRouter>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
```

### AppShell uses `<Outlet />`

```jsx
// components/layout/AppShell.jsx
import { Outlet } from 'react-router-dom';

export default function AppShell({ role }) {
  return (
    <div className="flex h-screen bg-neutral-50 dark:bg-neutral-950">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />   {/* ← React Router v6 renders child route here */}
        </main>
      </div>
    </div>
  );
}
```

---

## 12. ProtectedRoute Implementation

```jsx
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { PageSkeleton } from '../common/PageSkeleton';
import { ROUTES } from '../../constants/routes';

export function ProtectedRoute({ allowedRoles, requiredPermission, children }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageSkeleton />;

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  // Role validation
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  // Finer-grained permission check (pre-wired for V2)
  if (requiredPermission && !user.permissions?.[requiredPermission]) {
    return <Navigate to={ROUTES.UNAUTHORIZED} replace />;
  }

  return children ?? <Outlet />;
}
```

This dynamic signature accepts an optional `requiredPermission` prop, matching the future-ready design. If permissions are enabled, any route specifying `requiredPermission` requires a truthy flag in the user's permissions object.

---

## 13. Post-Login Redirect

```js
// LoginPage.jsx
const ROLE_DASHBOARDS = {
  recruiter:      ROUTES.RECRUITER.DASHBOARD,
  hiring_manager: ROUTES.HM.DASHBOARD,
  candidate:      ROUTES.CANDIDATE.DASHBOARD,
};

const from = location.state?.from?.pathname;
navigate(from || ROLE_DASHBOARDS[user.role], { replace: true });
```

---

## 14. Navigation Hooks

**File:** `src/hooks/useRecruiterNav.js`

```js
export const useRecruiterNav = () => {
  const navigate = useNavigate();
  return {
    toDashboard:         () => navigate(ROUTES.RECRUITER.DASHBOARD),
    toJobs:              () => navigate(ROUTES.RECRUITER.JOBS),
    toNewJob:            () => navigate(ROUTES.RECRUITER.JOB_NEW),
    toEditJob:     (id)  => navigate(buildRoute(ROUTES.RECRUITER.JOB_EDIT, { jobId: id })),
    toPipeline:    (id)  => navigate(buildRoute(ROUTES.RECRUITER.JOB_PIPELINE, { jobId: id })),
    toCandidate:   (id)  => navigate(buildRoute(ROUTES.RECRUITER.CANDIDATE_DETAIL, { candidateId: id })),
  };
};
```

---

## 15. Future: Route-Level Permissions

> Documented now. Not implemented in V1.

Current model: `role = recruiter | hiring_manager | candidate`

V2 will introduce granular **permission flags** per user:

```js
// Future user schema addition
permissions: {
  canCreateJob:    Boolean,
  canEditCompany:  Boolean,
  canViewSalary:   Boolean,
  canManageUsers:  Boolean,
  canExportData:   Boolean,
}

// Future ProtectedRoute extension:
<ProtectedRoute
  allowedRoles={['recruiter']}
  requiredPermission="canCreateJob"   // ← new
>
```

This allows, e.g., a "read-only recruiter" role without restructuring the codebase. The `ProtectedRoute` component is already architected to accept an optional `requiredPermission` prop in V2.

---

## 16. Route Summary Tables

### Public Routes

| Route | Page | Lazy | URL Filters |
|---|---|---|---|
| `/` | HomePage | ❌ | — |
| `/jobs` | JobBoardPage | ✅ | `?department&jobType&location&search&sortBy&page` |
| `/jobs/:jobId` | JobDetailPage | ✅ | — |
| `/login` | LoginPage | ❌ | — |
| `/register` | RegisterPage | ❌ | — |
| `/search` | SearchPage | ✅ | `?q` |

### Candidate Routes

| Route | Page | Lazy | URL Filters |
|---|---|---|---|
| `/candidate/dashboard` | CandidateDashboard | ✅ | — |
| `/candidate/applications` | MyApplicationsPage | ✅ | `?status&sortBy&page` |
| `/candidate/applications/:id` | ApplicationDetailPage | ✅ | — |
| `/candidate/saved-jobs` | SavedJobsPage | ✅ | `?page` |
| `/candidate/profile` | CandidateProfilePage | ✅ | — |
| `/candidate/notifications` | NotificationsPage | ✅ | `?page&isRead` |

### Recruiter Routes

| Route | Page | Lazy | URL Filters |
|---|---|---|---|
| `/recruiter/dashboard` | RecruiterDashboard | ✅ | — |
| `/recruiter/jobs` | JobsPage | ✅ | `?status&page` |
| `/recruiter/jobs/new` | CreateJobPage | ✅ | — |
| `/recruiter/jobs/:jobId/edit` | EditJobPage | ✅ | — |
| `/recruiter/jobs/:jobId` | JobPipelinePage | ✅ | `?status&search&sortBy&page` |
| `/recruiter/candidates/:id` | CandidateDetailPage | ✅ | — |
| `/recruiter/interviews` | InterviewsPage | ✅ | `?status&sortBy&page` |
| `/recruiter/company` | CompanyPage | ✅ | — |
| `/recruiter/notifications` | NotificationsPage | ✅ | `?page&isRead` |

### Hiring Manager Routes

| Route | Page | Lazy | URL Filters |
|---|---|---|---|
| `/hiring-manager/dashboard` | HMDashboard | ✅ | — |
| `/hiring-manager/jobs` | HMJobsPage | ✅ | `?page` |
| `/hiring-manager/jobs/:jobId` | HMJobPipelinePage | ✅ | `?sortBy&page` |
| `/hiring-manager/candidates/:id` | HMCandidateDetailPage | ✅ | — |
| `/hiring-manager/notifications` | NotificationsPage | ✅ | `?page&isRead` |

---

## 17. Backend Route Mounting

**File:** `backend/src/routes/index.js`

All routes mounted under `/api/v1` — consistent throughout the entire project.

```js
// app.js
app.use('/api/v1', router);

// routes/index.js mounts:
router.use('/auth',          authRoutes);         // 3 endpoints
router.use('/users',         userRoutes);         // 5 endpoints
router.use('/company',       companyRoutes);      // 3 endpoints
router.use('/jobs',          jobRoutes);          // 8 endpoints
router.use('/applications',  applicationRoutes);  // 10 endpoints
router.use('/interviews',    interviewRoutes);    // 5 endpoints
router.use('/feedback',      feedbackRoutes);     // 3 endpoints
router.use('/notifications', notificationRoutes); // 4 endpoints
router.use('/dashboard',     dashboardRoutes);    // 3 endpoints
// Total: 44 endpoints
```

---

## 18. Route Security Summary

| Concern | Solution |
|---|---|
| Unauthenticated access | `ProtectedRoute` → `/login` with return URL preserved |
| Wrong role | `ProtectedRoute` → `/unauthorized` (403) |
| Page crash isolation | `ErrorBoundary` wraps each role group independently |
| API protection | `verifyToken` middleware on all protected endpoints |
| API role enforcement | `authorizeRoles(...roles)` per route |
| `recruiterNotes` exposure | Stripped at serializer level — never in HM/candidate responses |
| Cross-candidate data access | Server enforces `candidate === req.user._id` on `/my` routes |
| Soft-deleted resources | All queries filter `{ isDeleted: false }` globally |
| Filter manipulation | All URL filters are sanitized and validated server-side |
| Invalid ObjectId | Validate ID parameters with `mongoose.Types.ObjectId.isValid()` before querying |
| Ownership validation | Recruiters can only access or edit jobs/applications belonging to their company |
| Sensitive fields | Passwords, internal tokens, and private recruiter notes excluded from candidate API responses |

---

> ✅ **Document 10 of 10 — Route Structure (Final)**

---

## 🎉 Documentation Series Complete

| # | Document | Status |
|---|---|---|
| 1 | Product Vision | ✅ |
| 2 | User Personas | ✅ |
| 3 | User Flow | ✅ |
| 4 | Database Schema | ✅ |
| 5 | API Design | ✅ |
| 6 | Folder Structure | ✅ |
| 7 | Tech Stack | ✅ |
| 8 | UI Pages | ✅ |
| 9 | Component Tree | ✅ |
| 10 | Route Structure | ✅ |

**TalentFlow is fully documented and ready to build.**
