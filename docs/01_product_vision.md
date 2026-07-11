# 📄 Document 1 of 10 — Product Vision (Final)
> **TalentFlow** | Full-Stack Recruitment Management Platform

---

## 1. Executive Summary

**TalentFlow** is a **Full-Stack Recruitment Management Platform** built on the MERN stack, designed to demonstrate production-quality software engineering for a developer portfolio.

It solves a real problem — fragmented, spreadsheet-driven hiring workflows — by giving small to mid-sized teams a centralized place to manage job postings, track candidates through a pipeline, schedule interviews, and coordinate feedback.

This is a portfolio-grade, incrementally buildable application. Clean, well-structured, role-aware full-stack engineering — built to be extended.

---

## 2. Problem Statement

> Small hiring teams waste hours per week juggling spreadsheets, email threads, and sticky notes to track candidates.

| Pain Point | Reality |
|---|---|
| No central system | Candidate data lives across emails and sheets |
| No pipeline visibility | Recruiters don't know where each candidate stands |
| Inconsistent feedback | No structured way to collect interview notes |
| Manual status updates | Candidates have no visibility into their application |
| Disorganized job listings | No single place to manage open roles |

---

## 3. The Solution — TalentFlow

A clean, role-aware recruitment dashboard covering the core hiring workflow end-to-end.

| Pillar | What It Does |
|---|---|
| 📋 **Job Management** | Create, edit, publish, and close job postings |
| 🗂️ **Candidate Pipeline** | Status-based stages: Applied → Under Review → Shortlisted → Interview → Offer → Hired / Rejected |
| 👤 **Candidate Profiles** | Resume upload, contact info, notes, and status history |
| 📝 **Interview Scheduling** | Schedule interviews and log structured feedback per round |
| 🔔 **In-App Notifications** | Real-time in-app alerts for status changes and updates |
| 📊 **Dashboard & Stats** | Open roles, active candidates, pipeline stage counts |
| 🔐 **Role-Based Access** | Recruiter, Hiring Manager, Candidate |

---

## 4. Who It's For

### Recruiters
- Manage company profile and all open roles
- Review applications and move candidates through pipeline stages
- Schedule interviews and track hiring progress

### Hiring Managers
- View pipeline for their assigned roles
- Add structured interview feedback
- Approve or reject candidates at offer stage

### Candidates
- Register, complete their profile, and upload a resume
- Browse open roles and submit applications
- Track their own application status and view interview details

---

## 5. User Flow

### Recruiter Flow
```
Login → Dashboard → Company Profile → Create Job →
Receive Applications → Review Candidate →
Schedule Interview → Update Status
```

### Candidate Flow
```
Register → Complete Profile → Browse Jobs →
Apply → Track Application Status → View Interview Details
```

---

## 6. MVP Feature Scope

These are the **only** features in scope for Version 1.0:

**Authentication & Users**
- [x] Register / Login with JWT
- [x] Roles: Recruiter, Hiring Manager, Candidate

**Company & Jobs**
- [x] Recruiter manages company profile
- [x] Create, edit, delete, and close job postings
- [x] Public job listing page for candidates

**Applications**
- [x] Candidate applies via public form
- [x] Resume upload via Multer (local file storage)
- [x] Application linked to a specific job

**Pipeline**
- [x] Status-based pipeline view per job
- [x] Stages: Applied → Under Review → Shortlisted → Interview → Offer → Hired / Rejected
- [x] Recruiter/Hiring Manager updates status manually

**Interview & Feedback**
- [x] Schedule interviews (date, time, format, notes)
- [x] Structured feedback scorecard (rating + comments)

**Notifications**
- [x] In-app notification center (status changes, interview scheduled)

**Dashboard**
- [x] Stats: open jobs, total candidates, pipeline stage breakdown

**Responsive Design**
- [x] Mobile-aware layout for all key screens

**Out of Scope for Version 1.0**
- ❌ Drag-and-drop Kanban board → Version 2.0
- ❌ Email notifications (Nodemailer) → Version 2.0
- ❌ Cloudinary file storage → Version 2.0
- ❌ Calendar / scheduling integrations → Version 2.0
- ❌ Admin role → Version 2.0
- ❌ AI features → Version 2.0
- ❌ SSO / OAuth → Version 2.0

---

## 7. Version Roadmap

### Version 1.0 — Current Portfolio Build
| Feature | Status |
|---|---|
| Authentication (JWT) | ✅ In Scope |
| Recruiter Dashboard | ✅ In Scope |
| Hiring Manager Dashboard | ✅ In Scope |
| Candidate Dashboard | ✅ In Scope |
| Job CRUD | ✅ In Scope |
| Applications | ✅ In Scope |
| Resume Upload (local/Multer) | ✅ In Scope |
| Interview Scheduling | ✅ In Scope |
| Status Tracking | ✅ In Scope |
| In-App Notifications | ✅ In Scope |
| Responsive Design | ✅ In Scope |

### Version 2.0 — Future Enhancements
| Feature | Notes |
|---|---|
| Drag-and-drop Kanban | Visual pipeline upgrade |
| Email Notifications | Nodemailer transactional emails |
| Cloudinary Storage | Cloud resume & file hosting |
| Calendar Integration | Interview scheduling with Google/Outlook |
| Team Collaboration | Comments, @mentions, shared notes |
| Admin Role | User management, org settings |
| AI Features | Resume ranking, job description suggestions |

---

## 8. Tech Stack (Preview)

> Full breakdown in Document 7 — Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite + React Router v6 |
| Styling | Vanilla CSS (custom design system) |
| State Management | React Context API |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose |
| Auth | JWT + bcrypt |
| File Uploads | Multer (local storage) |
| Email | ❌ Not in V1 |
| Deployment | Render (backend) + Vercel (frontend) |

---

## 9. Success Metrics (Portfolio Context)

| Metric | Target |
|---|---|
| Pages / Screens built | 10+ |
| API endpoints | 20+ |
| Role types supported | 3 |
| Core features working end-to-end | 100% |
| Mobile responsiveness | ✅ |
| README quality | Production-grade |

---

## 10. Design Philosophy

- **Clarity over cleverness** — Code should be easy to read and explain in an interview
- **Role-aware UI** — Each user sees only what's relevant to their role
- **Progressive enhancement** — Core features first, then polish
- **Consistent structure** — Predictable folder layout, naming, and patterns throughout

---

## 11. Guiding Principles

1. **MERN from scratch** — No boilerplates, every file intentional
2. **JWT everywhere** — Stateless auth, middleware-protected routes
3. **Mongoose schemas** — Typed, validated, relational-like references
4. **Component-driven frontend** — Reusable, role-aware React components
5. **Clean REST API** — Predictable endpoints, consistent response shapes

---

> ✅ **Document 1 of 10 — Product Vision (Final)**
