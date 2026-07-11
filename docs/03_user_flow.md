# 📄 Document 3 of 10 — User Flow (Final)
> **TalentFlow** | Full-Stack Recruitment Management Platform

---

## Overview

This document maps every meaningful user journey in TalentFlow Version 1.0. Flows are broken into:
1. **Onboarding Flows** — First-time setup per role
2. **Core Task Flows** — Primary actions per role
3. **Cross-Role Flow** — How all 3 roles interact on a single hire
4. **Edge Cases & Redirects**
5. **UI States** — Loading, empty, and error states per major page
6. **Access Rules** — What each role can and cannot do
7. **Route Mapping** — Public, Candidate, Recruiter, and HM routes

---

## 1. Authentication Flows

### 1.1 — Candidate Registration

```
Land on Homepage / Job Board
  └── Click "Sign Up"
        └── Registration Form
              ├── Enter: name, email, password, role = Candidate (auto-assigned)
              ├── Submit
              │     ├── [Success] → Redirect to: Complete Your Profile
              │     └── [Error: email exists] → Show inline error → Login link
              └── Complete Profile
                    ├── Upload resume (Multer / local)
                    ├── Add: phone, location, headline, bio
                    ├── Add (optional): Portfolio URL, GitHub URL, LinkedIn URL
                    └── Save → Redirect to: Candidate Dashboard
```

### 1.2 — Recruiter / Hiring Manager Login

```
Land on Login Page
  └── Enter email + password
        ├── [Success]
        │     ├── Role = Recruiter → Recruiter Dashboard
        │     └── Role = Hiring Manager → HM Dashboard
        └── [Error: invalid credentials] → Inline error message
```

> **Note:** Recruiters and Hiring Managers are created by seeding or direct DB entry in V1.0. Self-registration is Candidate-only.

### 1.3 — Forgot Password (V1 Scope)

```
Login Page → "Forgot Password?"
  └── [V1] → Not implemented → Show message:
        "Please contact your administrator to reset your password."
```

---

## 2. Recruiter Flows

### 2.1 — Set Up Company Information

```
Recruiter Dashboard → Sidebar: Company Information
  └── Company Info Form
        ├── Fields: company name, logo, website, location, description, industry
        ├── Save
        │     ├── [Success] → Toast: "Company information updated"
        │     └── [Error] → Inline validation errors
        └── Preview: how company info appears on public job listings
```

### 2.2 — Create a Job Posting

```
Recruiter Dashboard → Jobs → "Create New Job"
  └── Job Form
        ├── Fields:
        │     ├── Title, Department, Location
        │     ├── Job Type (Full-time / Part-time / Contract / Remote)
        │     ├── Experience Level, Salary Range (optional)
        │     ├── Description (textarea)
        │     └── Status: Draft / Published
        ├── Save as Draft → Saved, not visible to candidates
        ├── Publish → Visible on public job board
        │     ├── [Success] → Redirect to: Job Detail Page
        │     └── [Error: missing required fields] → Inline errors
        └── From Jobs list, Recruiter can:
              ├── Edit → Update any field
              ├── Close → Removed from public board; applications preserved
              └── Archive → Soft-deleted; hidden everywhere; recoverable
```

**Job Statuses:** `Draft` → `Published` → `Closed` → `Archived`

### 2.3 — Review Applications

```
Jobs → Select Job → Candidate Pipeline
  └── Status-based candidate list
        ├── Filter by: status, date applied
        ├── Click candidate row → Candidate Profile
        │     ├── View: name, contact, resume (download)
        │     ├── View: Portfolio URL, GitHub, LinkedIn (if provided)
        │     ├── View: recruiter notes (⚠️ private — visible to Recruiter only)
        │     ├── View: HM feedback scorecard
        │     └── Action buttons:
        │           ├── Update Status (dropdown)
        │           ├── Schedule Interview
        │           └── Hire / Reject (final decision)
```

> ⚠️ **Recruiter Notes are private.** They are only visible to the Recruiter who created them. Hiring Managers and Candidates cannot see recruiter notes.

### 2.4 — Update Candidate Status

```
Candidate Profile → Status Dropdown
  └── Select new status:
        Applied → Under Review → Shortlisted →
        Interview → Offer → Hired / Rejected
        (Candidate may also move to: Withdrawn — if they self-withdraw)
              ├── [Success] → Status badge updates
              │     └── In-app notification sent to candidate
              └── [Rejected] → Optional: add rejection note (private)
```

**Application Statuses:** `Applied` → `Under Review` → `Shortlisted` → `Interview` → `Offer` → `Hired` / `Rejected` / `Withdrawn`

### 2.5 — Schedule an Interview

```
Candidate Profile → "Schedule Interview"
  └── Interview Form
        ├── Fields: date, time, format (In-person / Video / Phone)
        ├── Interviewer name, notes
        ├── Status: Scheduled (default)
        ├── Submit
        │     ├── [Success] → Interview record created
        │     │     ├── Interview status = Scheduled
        │     │     ├── Candidate status auto-updated to "Interview"
        │     │     ├── In-app notification to Candidate: interview details
        │     │     └── In-app notification to Hiring Manager: candidate assigned
        │     └── [Error] → Inline validation
        └── After interview:
              ├── Mark as Completed → HM can submit feedback
              └── Mark as Cancelled → Candidate notified; can reschedule
```

**Interview Statuses:** `Scheduled` → `Completed` / `Cancelled`

### 2.6 — Make Final Hiring Decision

```
Candidate Profile (status = Offer)
  └── View HM recommendation
        ├── Hire → Status: Hired → Candidate notified
        └── Reject → Status: Rejected → Candidate notified
```

---

## 3. Hiring Manager Flows

### 3.1 — View Assigned Jobs

```
HM Dashboard → My Jobs
  └── Jobs scoped to HM's department
        └── Click job → Candidate list (Shortlisted + Interview stages only)
```

### 3.2 — Review Candidate Profile

```
My Jobs → Select Job → Candidate Row
  └── Candidate Profile (read-only)
        ├── View: resume (download), application
        ├── View: Portfolio URL, GitHub, LinkedIn (if provided)
        ├── View: HM feedback (own previous entries)
        └── ⚠️ Cannot see Recruiter's private notes
```

### 3.3 — Submit Interview Feedback

```
Candidate Profile → "Add Feedback"
  └── Available only when Interview status = Completed
        └── Feedback Scorecard Form
              ├── Overall Rating (1–5 stars)
              ├── Technical Skills (1–5)
              ├── Communication (1–5)
              ├── Culture Fit (1–5)
              ├── Written Comments (textarea)
              ├── Recommendation: Hire / Reject / Hold
              ├── Submit
              │     ├── [Success] → Saved; Recruiter notified
              │     └── [Error] → Inline validation
              └── View / edit own past feedback
```

---

## 4. Candidate Flows

### 4.1 — Browse, Sort, and Save Jobs

```
Public Job Board (no login required)
  └── View all published jobs
        ├── Filter by: job type, location, department
        ├── Sort by: Newest | Salary (High–Low) | Location (A–Z)
        ├── Click job card → Job Detail Page
        │     ├── Read: title, company, description, requirements
        │     ├── "Save Job" (requires login)
        │     │     ├── [Logged in] → Added to Saved Jobs list
        │     │     └── [Not logged in] → Redirect to Login → return to job
        │     └── "Apply Now" (requires login)
        │           ├── [Logged in] → Application Flow
        │           └── [Not logged in] → Redirect to Login → return to job
        └── Saved Jobs → Candidate Dashboard → Saved Jobs tab
```

### 4.2 — Apply for a Job

```
Job Detail Page → "Apply Now"
  └── [Profile complete?]
        ├── [Yes] → Application confirmation screen
        │     ├── Review: name, resume, headline
        │     ├── Optional: cover note (textarea)
        │     └── Submit
        │           ├── [Success] → Status: Applied
        │           │     ├── Notification to Candidate: "Application submitted"
        │           │     └── Notification to Recruiter: "New application"
        │           └── [Already applied] → "You've already applied to this role"
        └── [Incomplete] → "Complete your profile before applying"
              └── Redirect to My Profile → return to job
```

### 4.3 — Withdraw an Application

```
My Applications → Application Detail
  └── "Withdraw Application" button (visible if status ≠ Hired / Rejected)
        └── Confirm dialog: "Are you sure you want to withdraw?"
              ├── Confirm → Status: Withdrawn
              │     └── In-app notification to Recruiter: "Candidate withdrew"
              └── Cancel → No change
```

### 4.4 — Track Application Status

```
Candidate Dashboard → My Applications
  └── List: Job Title, Company, Date Applied, Current Status
        └── Click row → Application Detail
              ├── Status history (stage timeline)
              ├── Interview details (if status = Interview):
              │     date, time, format, interviewer, notes
              └── Notifications related to this application
```

### 4.5 — Edit Candidate Profile

```
Candidate Dashboard → My Profile
  └── Edit Form
        ├── Name, phone, location, headline, bio
        ├── Portfolio URL, GitHub URL, LinkedIn URL (optional)
        ├── Replace resume (Multer upload)
        │     └── File rules: PDF / DOCX only, max 5MB
        └── Save
              ├── [Success] → Toast: "Profile updated"
              └── [Error] → Inline validation
```

---

## 5. Cross-Role Flow — Single Hire Lifecycle

```
[Candidate] Applies to Job
      │
      ▼
[Recruiter] Notified → Reviews application
      │
      ├── Early reject → Status: Rejected → Candidate notified
      │
      └── Updates: Under Review → Shortlisted
                │
                ▼
      [Recruiter] Schedules Interview (status: Scheduled)
                │
                ▼
      [Hiring Manager] Notified → Reviews profile (no private notes visible)
                │
                └── Interview conducted
                      │
                [Recruiter] Marks interview: Completed
                      │
                [Hiring Manager] Submits Scorecard + Recommendation
                      │
                      ▼
            [Recruiter] Reviews recommendation
                      │
                      ├── Accepts → Status: Offer → Hired
                      │     └── Candidate notified: "Congratulations"
                      │
                      └── Rejects → Status: Rejected
                            └── Candidate notified: "Thank you"
```

---

## 6. Notification Flows

| Event | Notified Party |
|---|---|
| Candidate submits application | Recruiter |
| Recruiter updates candidate status | Candidate |
| Recruiter schedules interview | Candidate + Hiring Manager |
| Recruiter marks interview Completed | Hiring Manager (prompt to submit feedback) |
| Recruiter marks interview Cancelled | Candidate |
| Hiring Manager submits feedback | Recruiter |
| Candidate is Hired | Candidate |
| Candidate is Rejected | Candidate |
| Candidate withdraws application | Recruiter |

---

## 7. UI States — Per Major Page

Every major page must handle three non-data states:

| Page | Loading State | Empty State | Error State |
|---|---|---|---|
| Public Job Board | Skeleton cards | "No jobs available right now" | "Failed to load jobs. Try again." |
| Job Detail | Spinner | — | "Job not found" → 404 |
| Recruiter Dashboard | Skeleton stats | "No active jobs yet. Create one." | "Failed to load data." |
| Jobs List | Skeleton rows | "No jobs created yet" + CTA button | "Failed to load jobs." |
| Candidate Pipeline | Skeleton rows | "No applications yet for this role" | "Failed to load candidates." |
| Candidate Profile | Spinner | — | "Candidate not found" |
| HM Dashboard | Skeleton stats | "No jobs assigned to your department" | "Failed to load data." |
| Candidate Dashboard | Skeleton rows | "You haven't applied to any jobs yet" + CTA | "Failed to load applications." |
| My Applications | Skeleton rows | "No applications yet" | "Failed to load applications." |
| Saved Jobs | Skeleton cards | "No saved jobs yet. Browse jobs." | "Failed to load saved jobs." |
| Notifications Panel | Spinner | "You're all caught up!" | "Failed to load notifications." |
| Interview Scheduler | Spinner | — | "Failed to schedule interview." |

---

## 8. Edge Cases & Redirects

| Scenario | Behavior |
|---|---|
| Unauthenticated user accesses dashboard | Redirect to Login |
| Candidate visits Recruiter URL | 403 Forbidden page |
| Recruiter visits Candidate URL | 403 Forbidden page |
| Candidate applies to same job twice | "You've already applied to this role" |
| Recruiter closes a job | Hidden from public board; applications preserved |
| Recruiter archives a job | Soft-deleted; hidden everywhere; recoverable |
| Candidate profile incomplete on apply | Prompt to complete profile first |
| Candidate withdraws application | Status → Withdrawn; Recruiter notified |
| Resume file > 5MB | "File must be under 5MB" |
| Invalid file type uploaded | "Only PDF and DOCX files are allowed" |
| Page not found | Custom 404 page with "Go Home" link |
| HM tries to access recruiter notes | Field not rendered; not sent in API response |

---

## 9. Access Rules

### ✅ Recruiter — Can Do
- Create, edit, close, and archive job postings
- View all applications across all jobs
- Update any candidate's pipeline status
- Schedule, complete, and cancel interviews
- Write private recruiter notes (visible to self only)
- Make final hire/reject decisions
- Manage company information
- Download any candidate's resume
- Receive all platform notifications

### 🚫 Recruiter — Cannot Do
- Apply to jobs
- Submit a candidate scorecard as Hiring Manager

---

### ✅ Hiring Manager — Can Do
- View jobs assigned to their department
- View Shortlisted and Interview-stage candidates
- Download candidate resumes
- Submit and edit their own feedback scorecards
- Submit hire/reject recommendations (not final)
- Receive notifications for assigned roles

### 🚫 Hiring Manager — Cannot Do
- Create, edit, or close job postings
- Update pipeline status (no stage moves)
- See recruiter private notes
- Make final hiring decisions
- Manage company information

---

### ✅ Candidate — Can Do
- Browse and sort the public job board
- Save jobs for later
- Register and build a profile (with Portfolio URL, GitHub, LinkedIn)
- Upload and replace their resume
- Apply to any published job
- Withdraw their own application
- View their own application status and interview details
- Edit their own profile
- Receive in-app notifications about their applications

### 🚫 Candidate — Cannot Do
- View other candidates' profiles or applications
- View recruiter notes or HM scorecards
- Update pipeline status
- Access recruiter or HM dashboards

---

## 10. Route Mapping

### Public Routes (no auth required)

| Route | Page |
|---|---|
| `/` | Homepage / Job Board |
| `/jobs` | All published jobs (filterable, sortable) |
| `/jobs/:jobId` | Job Detail Page |
| `/login` | Login Page |
| `/register` | Candidate Registration |

### Candidate Routes (auth: Candidate only)

| Route | Page |
|---|---|
| `/candidate/dashboard` | Candidate Dashboard |
| `/candidate/applications` | My Applications list |
| `/candidate/applications/:applicationId` | Application Detail + status history |
| `/candidate/saved-jobs` | Saved Jobs |
| `/candidate/profile` | Edit Candidate Profile |
| `/candidate/notifications` | Notification Center |

### Recruiter Routes (auth: Recruiter only)

| Route | Page |
|---|---|
| `/recruiter/dashboard` | Recruiter Dashboard |
| `/recruiter/jobs` | Job Listings (manage) |
| `/recruiter/jobs/new` | Create Job Form |
| `/recruiter/jobs/:jobId` | Job Detail + Candidate Pipeline |
| `/recruiter/jobs/:jobId/edit` | Edit Job Form |
| `/recruiter/candidates/:candidateId` | Candidate Profile |
| `/recruiter/interviews` | All Scheduled Interviews |
| `/recruiter/company` | Company Information |
| `/recruiter/notifications` | Notification Center |

### Hiring Manager Routes (auth: Hiring Manager only)

| Route | Page |
|---|---|
| `/hiring-manager/dashboard` | HM Dashboard |
| `/hiring-manager/jobs` | Assigned Jobs |
| `/hiring-manager/jobs/:jobId` | Job Pipeline (scoped) |
| `/hiring-manager/candidates/:candidateId` | Candidate Profile (read-only + feedback) |
| `/hiring-manager/notifications` | Notification Center |

### Shared / Utility Routes

| Route | Page |
|---|---|
| `/unauthorized` | 403 Forbidden Page |
| `*` | 404 Not Found Page |

---

> ✅ **Document 3 of 10 — User Flow (Final)**
