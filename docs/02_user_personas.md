# 📄 Document 2 of 10 — User Personas (Final)
> **TalentFlow** | Full-Stack Recruitment Management Platform

---

## Overview

TalentFlow has **3 user roles** in Version 1.0. Each role has a distinct experience, permissions set, and set of goals. These personas ground every design and engineering decision in real user needs.

---

## Persona 1 — The Recruiter

> *"I need one place where I can see every open role and every candidate — without switching between five different tools."*

### 👤 Sarah Chen — Talent Recruiter

| Field | Detail |
|---|---|
| **Age** | 29 |
| **Role** | In-house Recruiter at a 60-person tech startup |
| **Tech comfort** | High — uses Notion, Slack, Google Workspace daily |
| **Hiring volume** | 5–10 active roles at any given time |
| **Current tools** | Google Sheets, Gmail, LinkedIn |

### Functional Responsibilities
- Owns the end-to-end hiring process for the company
- Manages company information and maintains public job listings
- Reviews all incoming applications and moves candidates through the pipeline
- Schedules interviews and coordinates with Hiring Managers
- Makes all final hiring and rejection decisions
- Monitors pipeline health via dashboard analytics

### Goals
- Manage all open job postings from a single dashboard
- Quickly see where every candidate is in the pipeline
- Schedule interviews and update candidate statuses without email back-and-forth
- Maintain the company's public job listing page
- Keep hiring managers informed without chasing them for updates

### Pain Points
- Loses track of candidates when using spreadsheets
- Has to manually update multiple places when a status changes
- No visibility into feedback given by hiring managers
- Candidates constantly emailing to ask "Where's my application?"

### How Sarah Uses TalentFlow

**User Flow Diagram**
```
Login
  └── Recruiter Dashboard
        ├── Company Information → Edit company details
        ├── Jobs → Create / Edit / Close job postings
        │     └── Job Detail → View applications
        │           └── Candidate Profile
        │                 ├── Review resume
        │                 ├── Update pipeline status
        │                 ├── Schedule interview
        │                 └── Make final Hire / Reject decision
        └── Notifications → View status alerts & HM feedback
```

### Dashboard Navigation
- **Overview** — Pipeline stats, open roles count, recent activity
- **Jobs** — All job postings (active, closed, draft)
- **Candidates** — All applicants across all jobs
- **Interviews** — Scheduled interviews list
- **Company Information** — Edit company name, logo, location, description
- **Notifications** — In-app alert center

### Key Screens
- Dashboard
- Job Management (list + create/edit)
- Candidate Pipeline (per job)
- Candidate Profile
- Interview Scheduler
- Company Information
- In-App Notifications

### Success Looks Like
- All active candidates visible in one view
- No more "where is my application?" emails from candidates
- Status updates happen in under 60 seconds

---

## Persona 2 — The Hiring Manager

> *"I just want to see the shortlisted candidates for my team and leave my feedback — I don't need to manage the whole process."*

### 👤 David Okafor — Engineering Manager

| Field | Detail |
|---|---|
| **Age** | 36 |
| **Role** | Engineering Manager overseeing 2–3 open roles |
| **Tech comfort** | Medium — comfortable with dashboards, not power users |
| **Hiring involvement** | Reviews shortlisted candidates, conducts interviews, recommends outcomes |
| **Current tools** | Slack, Google Meet, occasional Notion |

### Functional Responsibilities
- Reviews shortlisted candidates assigned to his department
- Conducts technical interviews and logs structured feedback via scorecards
- Recommends candidates for hire or rejection — **does not make the final decision**
- The Recruiter reviews the recommendation and makes the final call
- Gets notified when new candidates are ready for his review

### Goals
- See only the candidates relevant to his team's open roles
- Leave structured feedback after interviews without lengthy forms
- Recommend candidates for hire at the appropriate stage
- Get notified when a new candidate is ready for his review

### Pain Points
- Gets looped into hiring too late — after a candidate has already been waiting a week
- Has no standard way to record interview feedback; writes it in Slack or email
- Can't see the candidate's full history or previous feedback from the recruiter
- Forgets to follow up after interviews

### How David Uses TalentFlow

**User Flow Diagram**
```
Login
  └── Hiring Manager Dashboard
        ├── My Jobs → Roles assigned to his department
        │     └── Shortlisted Candidates
        │           └── Candidate Profile (read-only)
        │                 ├── View resume & recruiter notes
        │                 ├── Log interview feedback scorecard
        │                 └── Submit recommendation (Hire / Reject)
        │                       └── Recruiter notified → makes final decision
        └── Notifications → New shortlist alerts, status updates
```

### Dashboard Navigation
- **Overview** — Assigned roles, candidates pending review, recent feedback
- **My Jobs** — Job listings scoped to his department
- **Candidates** — Shortlisted candidates for his roles
- **Feedback** — All scorecards he has submitted
- **Notifications** — In-app alert center

### Key Screens
- Hiring Manager Dashboard
- Job Pipeline (filtered to his department)
- Candidate Profile (read-only + feedback form)
- Interview Feedback Scorecard
- In-App Notifications

### Success Looks Like
- Never misses a candidate waiting for his review
- Feedback is logged in a consistent, reviewable format
- Recommendation submitted in under 5 minutes

---

## Persona 3 — The Candidate

> *"I applied two weeks ago and I have no idea what's happening. Is anyone even reading my resume?"*

### 👤 Priya Sharma — Job Seeker

| Field | Detail |
|---|---|
| **Age** | 24 |
| **Role** | Recent computer science graduate, actively job hunting |
| **Tech comfort** | High — uses mobile apps primarily |
| **Applying to** | 10–20 jobs simultaneously |
| **Current experience** | Applies via email or forms, hears nothing back for weeks |

### Functional Responsibilities
- Browses and filters available job postings on the public job board
- Saves jobs she's interested in for later review
- Registers, builds her profile, and uploads her resume once
- Submits applications to specific roles
- Monitors her application statuses and views interview details

### Goals
- Find and apply to relevant open roles quickly
- Save interesting jobs to apply later
- Know exactly what's happening with each application
- Upload her resume once, not repeatedly per application
- Know when an interview has been scheduled so she can prepare

### Pain Points
- Applies and never hears back — zero visibility
- Has to re-enter the same information on every application form
- No way to know if she's been rejected or just delayed
- Misses interview invites buried in email spam

### How Priya Uses TalentFlow

**User Flow Diagram**
```
Public Job Board
  ├── Browse & filter jobs
  ├── Save job → Saved Jobs list
  └── Click job → Job Detail Page
        └── Register / Login
              └── Complete Candidate Profile
                    ├── Edit personal info & upload resume
                    └── Submit Application
                          └── Candidate Dashboard
                                ├── My Applications → Status per job
                                │     └── Application Detail
                                │           └── View interview details (if scheduled)
                                ├── Saved Jobs → Bookmarked listings
                                └── Notifications → Status change alerts
```

### Dashboard Navigation
- **Overview** — Applications submitted, statuses at a glance
- **My Applications** — All submitted applications with current status
- **Saved Jobs** — Bookmarked job listings for later review
- **My Profile** — Edit personal info, contact details, upload/replace resume
- **Notifications** — In-app alert center

### Key Screens
- Public Job Board
- Job Detail Page
- Register / Login
- Candidate Profile Setup & Edit
- My Applications (status list)
- Saved Jobs
- Application Detail (status + interview info)
- In-App Notifications

### Success Looks Like
- Knows her application status at any point in time
- Never misses an interview notification
- Applied to a job in under 3 minutes
- Can save and return to interesting roles without losing them

---

## Role Permissions Summary

| Feature | Recruiter | Hiring Manager | Candidate |
|---|---|---|---|
| Manage company information | ✅ | ❌ | ❌ |
| Create / edit / delete jobs | ✅ | ❌ | ❌ |
| View all applications | ✅ | 🔶 Own dept only | ❌ |
| Update pipeline status | ✅ | ❌ | ❌ |
| Make final hire / reject decision | ✅ | ❌ | ❌ |
| Submit hire/reject recommendation | ❌ | ✅ | ❌ |
| Schedule interview | ✅ | ❌ | ❌ |
| Add feedback scorecard | ✅ | ✅ | ❌ |
| Download candidate resume | ✅ | ✅ | ❌ |
| Apply to jobs | ❌ | ❌ | ✅ |
| Save jobs | ❌ | ❌ | ✅ |
| View own applications | ❌ | ❌ | ✅ |
| Edit own profile | ✅ | ✅ | ✅ |
| View interview details | ✅ | ✅ | ✅ (own only) |
| Receive notifications | ✅ | ✅ | ✅ |

> 🔶 = Partial access

---

## Persona-to-Dashboard Mapping

| Persona | Landing Page After Login | Main Nav Items |
|---|---|---|
| Recruiter | Recruiter Dashboard | Overview, Jobs, Candidates, Interviews, Company Information, Notifications |
| Hiring Manager | HM Dashboard | Overview, My Jobs, Candidates, Feedback, Notifications |
| Candidate | Candidate Dashboard | Overview, My Applications, Saved Jobs, My Profile, Notifications |

---

> ✅ **Document 2 of 10 — User Personas (Final)**
