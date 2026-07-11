# 📄 Document 5 of 10 — API Design (Final)
> **TalentFlow** | Full-Stack Recruitment Management Platform

---

## Overview

TalentFlow's backend exposes a **RESTful JSON API** built with **Node.js + Express.js**.

**Base URL:** `http://localhost:5000/api/v1` (development)
**Production:** `https://api.talentflow.app/api/v1`

> The `/v1` prefix ensures non-breaking future versioning — a v2 can coexist without touching v1 routes.

---

## 1. Request Flow Architecture

Every request travels through a consistent, layered pipeline:

```
Incoming Request
      │
      ▼
Global Middleware
  (helmet, cors, compression, morgan, express.json)
      │
      ▼
Rate Limiter (auth routes only)
      │
      ▼
Router
      │
      ▼
Validation Middleware (express-validator)
      │   └── [Fails] → 400 + errors array returned immediately
      ▼
Auth Middleware (verifyToken)
      │   └── [Fails] → 401 INVALID_TOKEN / TOKEN_EXPIRED
      ▼
Authorization Middleware (authorizeRoles)
      │   └── [Fails] → 403 FORBIDDEN_ROLE
      ▼
Controller
      │   └── Orchestrates the request; calls Service
      ▼
Service Layer
      │   └── Business logic, rules, cross-collection operations
      ▼
Database (Mongoose Models)
      │
      ▼
Response → { success, message, data }
```

---

## 2. Global Middleware Stack

Configured once in `app.js` — applied to every request:

```js
// Security
app.use(helmet())                  // Sets secure HTTP headers
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))

// Performance
app.use(compression())             // Gzip responses

// Logging
app.use(morgan('dev'))             // Request logging in development

// Body Parsing
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
```

### Rate Limiting (Auth Routes)

```js
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 10,                     // max 10 requests per window per IP
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
    errorCode: 'RATE_LIMIT_EXCEEDED'
  }
});

// Applied only to:
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/register', authLimiter);
```

---

## 3. Request Validation (express-validator)

All POST / PUT / PATCH routes run through `express-validator` before the controller executes.

### Pattern

```js
// validators/auth.validator.js
import { body, validationResult } from 'express-validator';

export const registerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

// middleware/validate.js
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errorCode: 'VALIDATION_ERROR',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

// Route usage:
router.post('/register', registerValidator, validate, authController.register);
```

Validators are defined per resource in `backend/validators/` and reused across routes.

---

## 4. Standardized Error Codes

Every error response includes both an HTTP status code and a machine-readable `errorCode`:

| HTTP | Error Code | Meaning |
|---|---|---|
| `400` | `VALIDATION_ERROR` | express-validator failed |
| `400` | `PROFILE_INCOMPLETE` | Candidate must complete profile before applying |
| `400` | `JOB_CLOSED` | Job is not accepting applications |
| `400` | `DEADLINE_PASSED` | Application deadline has passed |
| `400` | `CANNOT_WITHDRAW` | Application is already hired or rejected |
| `400` | `INTERVIEW_NOT_COMPLETED` | Feedback requires completed interview |
| `400` | `FILE_TOO_LARGE` | Resume exceeds 5MB |
| `400` | `INVALID_FILE_TYPE` | Only PDF and DOCX allowed |
| `400` | `SALARY_RANGE_INVALID` | salaryMax < salaryMin |
| `401` | `INVALID_TOKEN` | JWT is malformed |
| `401` | `TOKEN_EXPIRED` | JWT has expired |
| `401` | `NO_TOKEN` | Authorization header missing |
| `403` | `FORBIDDEN_ROLE` | User's role cannot access this resource |
| `404` | `JOB_NOT_FOUND` | Job does not exist or is deleted |
| `404` | `APPLICATION_NOT_FOUND` | Application not found |
| `404` | `USER_NOT_FOUND` | User not found |
| `404` | `INTERVIEW_NOT_FOUND` | Interview not found |
| `409` | `EMAIL_ALREADY_EXISTS` | Email is already registered |
| `409` | `ALREADY_APPLIED` | Candidate already applied to this job |
| `409` | `FEEDBACK_ALREADY_SUBMITTED` | HM already submitted feedback for this interview |
| `429` | `RATE_LIMIT_EXCEEDED` | Too many requests |
| `500` | `INTERNAL_ERROR` | Unexpected server error |

### Error Response Shape
```json
{
  "success": false,
  "message": "You have already applied to this job",
  "errorCode": "ALREADY_APPLIED"
}
```

---

## 5. Pagination Convention

**All list endpoints** in V1 support pagination via query params:

```
?page=1&limit=10
```

**Response shape for paginated lists:**
```json
{
  "success": true,
  "data": [ ],
  "pagination": {
    "total": 84,
    "page": 1,
    "limit": 10,
    "totalPages": 9,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

Default: `page=1`, `limit=10`. Maximum `limit=50`.

---

## 6. Global Response Conventions

### Success
```json
{ "success": true, "message": "Human-readable message", "data": { } }
```

### Error
```json
{ "success": false, "message": "Human-readable error", "errorCode": "ERROR_CODE", "errors": [] }
```

### HTTP Codes Used

| Code | Meaning |
|---|---|
| `200` | OK |
| `201` | Created |
| `204` | No Content (DELETE) |
| `400` | Bad Request / Validation |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not Found |
| `409` | Conflict |
| `429` | Rate Limited |
| `500` | Server Error |

---

## 7. Route Groups

| Prefix | Resource |
|---|---|
| `/api/v1/auth` | Authentication |
| `/api/v1/users` | User profile management |
| `/api/v1/company` | Company information |
| `/api/v1/jobs` | Job postings |
| `/api/v1/applications` | Candidate applications |
| `/api/v1/interviews` | Interview scheduling |
| `/api/v1/feedback` | HM scorecards |
| `/api/v1/notifications` | In-app notifications |
| `/api/v1/dashboard` | Role-specific dashboard data |

---

## 8. Auth Routes — `/api/v1/auth`

### POST `/auth/register` — Public
```json
// Request
{ "name": "Priya Sharma", "email": "priya@example.com", "password": "securePass123" }

// Response 201
{ "success": true, "data": { "token": "<jwt>", "user": { "_id": "", "name": "", "role": "candidate" } } }
```
**Errors:** `EMAIL_ALREADY_EXISTS` | `VALIDATION_ERROR`
**Rate limited:** 10 req / 15 min

---

### POST `/auth/login` — Public
```json
// Request
{ "email": "sarah@company.com", "password": "securePass123" }

// Response 200
{ "success": true, "data": { "token": "<jwt>", "user": { "_id": "", "name": "", "role": "recruiter" } } }
```
**Errors:** `INVALID_TOKEN` | `VALIDATION_ERROR`
**Rate limited:** 10 req / 15 min

---

### GET `/auth/me` — All roles
Returns full authenticated user profile.

---

## 9. User / Profile Routes — `/api/v1/users`

### PUT `/users/profile` — Candidate
Update candidate profile fields (partial update).

### POST `/users/resume` — Candidate
**Multer pipeline:**
```
multipart/form-data
  └── multer({ storage, fileFilter, limits })
        ├── fileFilter: PDF / DOCX only → INVALID_FILE_TYPE
        ├── limits.fileSize: 5MB → FILE_TOO_LARGE
        └── [Pass] → validate → controller → save resumeUrl
```

### POST `/users/saved-jobs/:jobId` — Candidate
### DELETE `/users/saved-jobs/:jobId` — Candidate
### GET `/users/saved-jobs` — Candidate

**Query params:** `?page=1&limit=10`

---

## 10. Company Routes — `/api/v1/company`

### GET `/company` — Public
### POST `/company` — Recruiter
### PATCH `/company` — Recruiter (partial update)

---

## 11. Job Routes — `/api/v1/jobs`

### GET `/jobs` — Public (paginated)

**Query params:**
```
?page=1&limit=10
?department=Engineering
?jobType=remote
?location=Bangalore
?isRemote=true
?sortBy=newest | salary | location
?search=frontend developer
```

### GET `/jobs/:jobId` — Public
### POST `/jobs` — Recruiter
### PATCH `/jobs/:jobId` — Recruiter (partial update)
### PATCH `/jobs/:jobId/status` — Recruiter
```json
{ "status": "published" }   // draft | published | closed | archived
```
### DELETE `/jobs/:jobId` — Recruiter (soft-delete)
### GET `/jobs/recruiter/all` — Recruiter (paginated, all statuses)
### GET `/jobs/hiring-manager/assigned` — Hiring Manager (dept-scoped, paginated)

---

## 12. Application Routes — `/api/v1/applications`

### POST `/applications/:jobId` — Candidate
**Errors:** `ALREADY_APPLIED` | `PROFILE_INCOMPLETE` | `JOB_CLOSED` | `DEADLINE_PASSED`

---

### GET `/applications/my` — Candidate (paginated)
```
?page=1&limit=10
?status=shortlisted
?sortBy=latest | oldest
```

### GET `/applications/my/:applicationId` — Candidate
### PATCH `/applications/:id/withdraw` — Candidate
**Errors:** `CANNOT_WITHDRAW`

---

### GET `/applications/job/:jobId` — Recruiter (paginated)

Full pipeline view with search and sorting:
```
?page=1&limit=10
?status=shortlisted
?search=manav              → searches candidate name or email
?sortBy=latest | oldest | status
```
> ⚠️ `recruiterNotes` included in this response (Recruiter only — stripped at serializer level for all other roles)

---

### GET `/applications/job/:jobId/hm` — Hiring Manager (paginated)

Scoped to Shortlisted + Interview stages only. No `recruiterNotes`.
```
?page=1&limit=10
?sortBy=latest | oldest
```

---

### GET `/applications/:id` — Recruiter / Hiring Manager
Full application detail including feedback array.

### PATCH `/applications/:id/status` — Recruiter
```json
{ "status": "shortlisted" }
```

### PATCH `/applications/:id/notes` — Recruiter
```json
{ "recruiterNotes": "Strong candidate. Follow up next week." }
```

### GET `/applications/:id/resume` — Recruiter / Hiring Manager
File stream download (`Content-Disposition: attachment`).

---

## 13. Interview Routes — `/api/v1/interviews`

### POST `/interviews` — Recruiter
```json
{
  "applicationId": "",
  "scheduledAt": "2025-08-15T10:00:00Z",
  "format": "video",
  "location": "https://meet.google.com/xyz",
  "candidateInstructions": "Join 10 minutes early. Bring your laptop.",
  "interviewerId": ""
}
```

### GET `/interviews` — Recruiter (paginated)
```
?page=1&limit=10
?status=scheduled | completed | cancelled
?sortBy=upcoming | latest
```

### GET `/interviews/:id` — All roles (scoped)
### PATCH `/interviews/:id` — Recruiter (partial update)
> Changed from PUT → PATCH: only provided fields are updated, not the full document.

### PATCH `/interviews/:id/status` — Recruiter
```json
{ "status": "completed" }
// or
{ "status": "cancelled", "cancelledReason": "Candidate unavailable" }
```

---

## 14. Feedback Routes — `/api/v1/feedback`

### POST `/feedback` — Hiring Manager
```json
{
  "interviewId": "", "applicationId": "",
  "ratings": { "overall": 4, "technical": 5, "communication": 3, "cultureFit": 4 },
  "comments": "Strong technical background.",
  "recommendation": "hire",
  "decisionReason": "Top performer in technical round."
}
```
**Errors:** `INTERVIEW_NOT_COMPLETED` | `FEEDBACK_ALREADY_SUBMITTED`

### GET `/feedback/application/:applicationId` — Recruiter / HM (paginated)
### PATCH `/feedback/:id` — Hiring Manager (own only, partial update)

---

## 15. Notification Routes — `/api/v1/notifications`

### GET `/notifications` — All roles (paginated)
```
?page=1&limit=20
?isRead=false
```

### GET `/notifications/unread-count` — All roles
```json
{ "success": true, "data": { "count": 3 } }
```

### PATCH `/notifications/:id/read` — All roles
### PATCH `/notifications/read-all` — All roles

---

## 16. Dashboard Routes — `/api/v1/dashboard`

Dedicated aggregation endpoints — one request per role replaces multiple separate fetches.

### GET `/dashboard/recruiter` — Recruiter
```json
{
  "success": true,
  "data": {
    "stats": {
      "openJobs": 8,
      "totalApplications": 142,
      "scheduledInterviews": 5,
      "hiredThisMonth": 3
    },
    "recentApplications": [
      { "_id": "", "candidate": { "name": "" }, "job": { "title": "" }, "status": "", "appliedAt": "" }
    ],
    "upcomingInterviews": [
      { "_id": "", "scheduledAt": "", "format": "", "candidate": { "name": "" }, "job": { "title": "" } }
    ],
    "pipelineBreakdown": {
      "applied": 40, "under_review": 28, "shortlisted": 18,
      "interview": 12, "offer": 9, "hired": 3, "rejected": 32, "withdrawn": 0
    },
    "unreadNotifications": 4
  }
}
```

---

### GET `/dashboard/candidate` — Candidate
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalApplications": 6,
      "activeApplications": 4,
      "interviews": 1,
      "savedJobs": 12
    },
    "recentApplications": [
      { "_id": "", "job": { "title": "", "company": { "name": "" } }, "status": "", "appliedAt": "" }
    ],
    "upcomingInterview": {
      "scheduledAt": "", "format": "", "candidateInstructions": "", "job": { "title": "" }
    },
    "unreadNotifications": 2
  }
}
```

---

### GET `/dashboard/hiring-manager` — Hiring Manager
```json
{
  "success": true,
  "data": {
    "stats": {
      "assignedJobs": 3,
      "pendingReview": 7,
      "feedbackSubmitted": 12,
      "scheduledInterviews": 2
    },
    "candidatesPendingReview": [
      { "_id": "", "candidate": { "name": "" }, "job": { "title": "" }, "status": "shortlisted" }
    ],
    "upcomingInterviews": [ ],
    "unreadNotifications": 1
  }
}
```

---

## 17. Complete Endpoint Summary

| Method | Route | Role | Paginated |
|---|---|---|---|
| POST | `/auth/register` | Public | — |
| POST | `/auth/login` | Public | — |
| GET | `/auth/me` | All | — |
| PUT | `/users/profile` | Candidate | — |
| POST | `/users/resume` | Candidate | — |
| POST | `/users/saved-jobs/:jobId` | Candidate | — |
| DELETE | `/users/saved-jobs/:jobId` | Candidate | — |
| GET | `/users/saved-jobs` | Candidate | ✅ |
| GET | `/company` | Public | — |
| POST | `/company` | Recruiter | — |
| PATCH | `/company` | Recruiter | — |
| GET | `/jobs` | Public | ✅ |
| GET | `/jobs/:jobId` | Public | — |
| POST | `/jobs` | Recruiter | — |
| PATCH | `/jobs/:jobId` | Recruiter | — |
| PATCH | `/jobs/:jobId/status` | Recruiter | — |
| DELETE | `/jobs/:jobId` | Recruiter | — |
| GET | `/jobs/recruiter/all` | Recruiter | ✅ |
| GET | `/jobs/hiring-manager/assigned` | HM | ✅ |
| POST | `/applications/:jobId` | Candidate | — |
| GET | `/applications/my` | Candidate | ✅ |
| GET | `/applications/my/:id` | Candidate | — |
| PATCH | `/applications/:id/withdraw` | Candidate | — |
| GET | `/applications/job/:jobId` | Recruiter | ✅ |
| GET | `/applications/job/:jobId/hm` | HM | ✅ |
| GET | `/applications/:id` | Recruiter / HM | — |
| PATCH | `/applications/:id/status` | Recruiter | — |
| PATCH | `/applications/:id/notes` | Recruiter | — |
| GET | `/applications/:id/resume` | Recruiter / HM | — |
| POST | `/interviews` | Recruiter | — |
| GET | `/interviews` | Recruiter | ✅ |
| GET | `/interviews/:id` | All (scoped) | — |
| PATCH | `/interviews/:id` | Recruiter | — |
| PATCH | `/interviews/:id/status` | Recruiter | — |
| POST | `/feedback` | HM | — |
| GET | `/feedback/application/:id` | Recruiter / HM | ✅ |
| PATCH | `/feedback/:id` | HM | — |
| GET | `/notifications` | All | ✅ |
| GET | `/notifications/unread-count` | All | — |
| PATCH | `/notifications/:id/read` | All | — |
| PATCH | `/notifications/read-all` | All | — |
| GET | `/dashboard/recruiter` | Recruiter | — |
| GET | `/dashboard/candidate` | Candidate | — |
| GET | `/dashboard/hiring-manager` | HM | — |

**Total: 44 endpoints**

---

## 18. API Design Principles

1. **`/api/v1` prefix** — Enables non-breaking versioning; v2 can coexist
2. **PATCH for partial updates** — Never PUT unless replacing the full document
3. **Pagination everywhere** — All list endpoints default to `page=1, limit=10`
4. **`recruiterNotes` never leaked** — Stripped at serializer level for all non-recruiter roles
5. **Soft deletes filtered globally** — All queries append `{ isDeleted: false }` as standard
6. **Dedicated dashboard endpoints** — Aggregated data in one request per role
7. **Consistent error codes** — Frontend maps `errorCode` to user-facing messages
8. **Rate limiting on auth** — Prevents brute-force without heavy infrastructure
9. **express-validator** — Validation runs before auth; bad requests never hit the DB

---

> ✅ **Document 5 of 10 — API Design (Final)**
