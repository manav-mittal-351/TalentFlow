# 📄 Document 6 of 10 — Folder Structure
> **TalentFlow** | Full-Stack Recruitment Management Platform

---

## Overview

The project is a monorepo with two independent applications: `backend/` and `frontend/`. Each has its own `package.json`, dependencies, and config files. They communicate exclusively via HTTP (the REST API defined in Document 5).

---

## Root Structure

```
TalentFlow/
│
├── backend/                  # Node.js + Express API
├── frontend/                 # React + Vite SPA
├── docs/                     # Architecture documents (this series)
├── screenshots/              # UI screenshots for README
├── .gitignore                # Root gitignore
└── README.md                 # Project overview + setup guide
```

---

## Backend Structure

```
backend/
│
├── src/
│   ├── config/
│   │   ├── db.js                   # MongoDB connection (Mongoose)
│   │   └── env.js                  # Centralised env var access + validation
│   │
│   ├── models/
│   │   ├── User.model.js
│   │   ├── Company.model.js
│   │   ├── Job.model.js
│   │   ├── Application.model.js
│   │   ├── Interview.model.js
│   │   ├── Feedback.model.js
│   │   └── Notification.model.js
│   │
│   ├── routes/
│   │   ├── index.js                # Mounts all route groups under /api/v1
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── company.routes.js
│   │   ├── job.routes.js
│   │   ├── application.routes.js
│   │   ├── interview.routes.js
│   │   ├── feedback.routes.js
│   │   ├── notification.routes.js
│   │   └── dashboard.routes.js
│   │
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── company.controller.js
│   │   ├── job.controller.js
│   │   ├── application.controller.js
│   │   ├── interview.controller.js
│   │   ├── feedback.controller.js
│   │   ├── notification.controller.js
│   │   └── dashboard.controller.js
│   │
│   ├── services/
│   │   ├── auth.service.js         # JWT generation, bcrypt, token validation
│   │   ├── user.service.js         # Profile updates, saved jobs logic
│   │   ├── company.service.js
│   │   ├── job.service.js          # Pagination, filtering, soft-delete logic
│   │   ├── application.service.js  # Pipeline moves, status history, duplicate check
│   │   ├── interview.service.js    # Scheduling, status transitions
│   │   ├── feedback.service.js
│   │   ├── notification.service.js # Notification creation helpers
│   │   └── dashboard.service.js    # Aggregation queries per role
│   │
│   ├── middleware/
│   │   ├── verifyToken.js          # JWT decode → attach req.user
│   │   ├── authorizeRoles.js       # Role-based access control
│   │   ├── validate.js             # express-validator error collector
│   │   ├── uploadResume.js         # Multer config for resume uploads
│   │   └── errorHandler.js         # Global error handler (last middleware)
│   │
│   ├── validators/
│   │   ├── auth.validator.js       # Register + login rules
│   │   ├── user.validator.js       # Profile update rules
│   │   ├── company.validator.js
│   │   ├── job.validator.js        # Salary range, deadline, enum checks
│   │   ├── application.validator.js
│   │   ├── interview.validator.js
│   │   └── feedback.validator.js
│   │
│   ├── utils/
│   │   ├── generateToken.js        # JWT sign helper
│   │   ├── apiResponse.js          # success() and error() response builders
│   │   ├── paginate.js             # Shared pagination query helper
│   │   ├── serializeApplication.js # Strips recruiterNotes for non-recruiters
│   │   └── constants.js            # Enums, status lists, dept list
│   │
│   └── app.js                      # Express app setup + global middleware
│
├── uploads/
│   └── resumes/                    # Local resume file storage (V1)
│                                   # V2: replaced by Cloudinary
│
├── .env                            # Environment variables (not committed)
├── .env.example                    # Template for required env vars
├── .gitignore
├── package.json
└── server.js                       # Entry point — connects DB, starts server
```

### Key File Responsibilities

| File | Responsibility |
|---|---|
| `server.js` | Entry point. Connects to MongoDB, starts HTTP server |
| `app.js` | Configures Express: global middleware, mounts routes |
| `routes/index.js` | Single mount point: `app.use('/api/v1', router)` |
| `controllers/*.js` | Thin layer: parse req, call service, send response |
| `services/*.js` | Business logic, validation rules, DB operations |
| `middleware/errorHandler.js` | Catches all unhandled errors, returns standard error response |
| `utils/serializeApplication.js` | Removes `recruiterNotes` unless caller is Recruiter |
| `utils/paginate.js` | Reusable `{ skip, limit, page, total }` query builder |
| `uploads/resumes/` | Local disk storage; gitignored; V2 moves to Cloudinary |

### Environment Variables (`.env.example`)

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/talentflow
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

---

## Frontend Structure

```
frontend/
│
├── public/
│   ├── favicon.ico
│   └── logo.svg
│
├── src/
│   │
│   ├── assets/
│   │   ├── images/              # Static images (logo, hero, etc.)
│   │   └── icons/               # Custom SVG icons (if not using a library)
│   │
│   ├── styles/
│   │   ├── index.css            # Global CSS reset + design tokens
│   │   ├── variables.css        # CSS custom properties (colors, spacing, fonts)
│   │   └── utilities.css        # Shared utility classes
│   │
│   ├── context/
│   │   ├── AuthContext.jsx      # Current user, token, login/logout actions
│   │   └── NotificationContext.jsx  # Unread count, notification list, mark-read
│   │
│   ├── hooks/
│   │   ├── useAuth.js           # Shortcut to AuthContext
│   │   ├── useNotifications.js  # Shortcut to NotificationContext
│   │   └── usePagination.js     # Page/limit state + navigation helpers
│   │
│   ├── services/
│   │   ├── api.js               # Axios instance + base config + interceptors
│   │   ├── auth.service.js      # login(), register(), getMe()
│   │   ├── user.service.js      # updateProfile(), uploadResume(), savedJobs()
│   │   ├── company.service.js
│   │   ├── job.service.js       # getJobs(), getJob(), createJob(), etc.
│   │   ├── application.service.js
│   │   ├── interview.service.js
│   │   ├── feedback.service.js
│   │   ├── notification.service.js
│   │   └── dashboard.service.js
│   │
│   ├── components/
│   │   │
│   │   ├── common/              # Shared across all roles
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Badge.jsx           # Status badges (colour-coded)
│   │   │   ├── Avatar.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Spinner.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── ErrorState.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── ProtectedRoute.jsx  # Role-aware route guard
│   │   │
│   │   ├── jobs/
│   │   │   ├── JobCard.jsx         # Card shown on public job board
│   │   │   ├── JobFilters.jsx      # Filter + sort controls
│   │   │   ├── JobForm.jsx         # Create / edit job form
│   │   │   └── JobStatusBadge.jsx  # Draft / Published / Closed / Archived
│   │   │
│   │   ├── applications/
│   │   │   ├── ApplicationCard.jsx
│   │   │   ├── ApplicationRow.jsx  # Row in recruiter pipeline list
│   │   │   ├── StatusDropdown.jsx  # Update pipeline stage
│   │   │   └── StatusTimeline.jsx  # Visual status history
│   │   │
│   │   ├── candidates/
│   │   │   ├── CandidateProfile.jsx
│   │   │   ├── ResumeViewer.jsx
│   │   │   └── RecruiterNotesForm.jsx  # Private notes (Recruiter only)
│   │   │
│   │   ├── interviews/
│   │   │   ├── InterviewForm.jsx
│   │   │   ├── InterviewCard.jsx
│   │   │   └── InterviewStatusBadge.jsx
│   │   │
│   │   ├── feedback/
│   │   │   ├── FeedbackForm.jsx    # HM scorecard
│   │   │   └── FeedbackCard.jsx    # Display submitted scorecard
│   │   │
│   │   ├── dashboard/
│   │   │   ├── StatCard.jsx        # Single metric (count + label)
│   │   │   ├── PipelineChart.jsx   # Application stage breakdown
│   │   │   └── RecentActivity.jsx  # Latest applications / interviews
│   │   │
│   │   └── notifications/
│   │       ├── NotificationPanel.jsx  # Dropdown panel
│   │       └── NotificationItem.jsx   # Single notification row
│   │
│   ├── pages/
│   │   │
│   │   ├── public/
│   │   │   ├── HomePage.jsx
│   │   │   ├── JobBoardPage.jsx
│   │   │   ├── JobDetailPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   │
│   │   ├── candidate/
│   │   │   ├── CandidateDashboard.jsx
│   │   │   ├── MyApplicationsPage.jsx
│   │   │   ├── ApplicationDetailPage.jsx
│   │   │   ├── SavedJobsPage.jsx
│   │   │   └── CandidateProfilePage.jsx
│   │   │
│   │   ├── recruiter/
│   │   │   ├── RecruiterDashboard.jsx
│   │   │   ├── JobsPage.jsx
│   │   │   ├── CreateJobPage.jsx
│   │   │   ├── EditJobPage.jsx
│   │   │   ├── JobPipelinePage.jsx
│   │   │   ├── CandidateDetailPage.jsx
│   │   │   ├── InterviewsPage.jsx
│   │   │   └── CompanyPage.jsx
│   │   │
│   │   ├── hiring-manager/
│   │   │   ├── HMDashboard.jsx
│   │   │   ├── HMJobsPage.jsx
│   │   │   ├── HMCandidateDetailPage.jsx
│   │   │   └── HMFeedbackPage.jsx
│   │   │
│   │   └── shared/
│   │       ├── NotificationsPage.jsx
│   │       ├── NotFoundPage.jsx       # 404
│   │       └── UnauthorizedPage.jsx   # 403
│   │
│   ├── utils/
│   │   ├── formatDate.js         # Date formatting helpers
│   │   ├── formatSalary.js       # "$80,000 – $120,000" formatter
│   │   ├── getStatusColor.js     # Status → CSS class mapping
│   │   ├── getNotificationIcon.js # Icon type → component mapping
│   │   └── validators.js         # Client-side form validation helpers
│   │
│   ├── constants/
│   │   ├── roles.js              # RECRUITER, HIRING_MANAGER, CANDIDATE
│   │   ├── statuses.js           # APPLICATION_STATUSES, JOB_STATUSES, etc.
│   │   └── routes.js             # Route path constants (avoid magic strings)
│   │
│   ├── App.jsx                   # Root: router + context providers
│   └── main.jsx                  # Vite entry point
│
├── index.html
├── vite.config.js
├── .env
├── .env.example
├── .gitignore
└── package.json
```

### Key File Responsibilities

| File | Responsibility |
|---|---|
| `src/services/api.js` | Axios instance with base URL, JWT header injection, 401 interceptor |
| `src/context/AuthContext.jsx` | Global auth state: user object, token, login/logout |
| `src/components/common/ProtectedRoute.jsx` | Checks role before rendering; redirects to `/unauthorized` |
| `src/styles/variables.css` | All CSS custom properties — single source of truth for design tokens |
| `src/constants/routes.js` | Named route constants to avoid magic strings across the app |
| `src/utils/getStatusColor.js` | Maps `application.status` → colour class for Badge component |

### Environment Variables (`.env.example`)

```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

---

## Naming Conventions

| Type | Convention | Example |
|---|---|---|
| React components | PascalCase | `JobCard.jsx`, `StatusBadge.jsx` |
| JS utilities/hooks | camelCase | `formatDate.js`, `useAuth.js` |
| CSS files | kebab-case | `job-card.css` (if component-scoped) |
| Backend files | camelCase + suffix | `job.controller.js`, `auth.service.js` |
| Models | PascalCase + `.model.js` | `Job.model.js` |
| Routes | camelCase + `.routes.js` | `job.routes.js` |
| Environment vars | SCREAMING_SNAKE_CASE | `JWT_SECRET`, `MONGO_URI` |
| MongoDB collections | lowercase plural | `jobs`, `applications`, `users` |

---

## Co-location Rule

> Components own their styles. If a component has a dedicated stylesheet, it lives next to the component file:
```
components/jobs/
  ├── JobCard.jsx
  └── JobCard.css     ← scoped to JobCard only
```
Shared/global styles live in `src/styles/`.

---

> ✅ **Document 6 of 10 Complete — Folder Structure**
> ⏳ **Awaiting your approval to proceed to Document 7: Tech Stack**
