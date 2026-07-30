# 🚀 TalentFlow — Applicant Tracking System (ATS)

TalentFlow is a modern, full-stack **Applicant Tracking System (ATS)** built for recruitment teams, hiring managers, and job seekers. It streamlines job posting management, application tracking, interview scheduling, team evaluation feedback, and candidate status updates through a role-based workflow.

---

## 🌟 Key Features

### 👤 Candidate Portal
- **Job Discovery**: Search, filter, and view detailed job postings with salary details, departments, and work types.
- **Application Submission**: One-click application using saved profile resumes or uploading new custom PDF/DOCX files.
- **Application Tracking & Withdrawal**: Real-time status progress tracking with full history. Allows application withdrawal when plans change.
- **Re-Application Support**: Enables candidates to apply again to open positions after withdrawing, preserving full audit history of prior application attempts.

### 💼 Recruiter Dashboard
- **Job Posting Management**: Draft, publish, edit, close, and archive job vacancies.
- **Candidate Pipeline Kanban**: Drag-and-drop or dropdown status updates across hiring stages (`applied`, `under_review`, `shortlisted`, `interview`, `offer`, `hired`, `rejected`).
- **Private Recruiter Notes**: Internal candidate evaluation notes hidden from candidates and external viewers.
- **Interview Scheduler**: Schedule video, in-person, or phone interviews with automated candidate and interviewer notifications.
- **Prior Attempt Tracking**: Clear visual badges and timeline history for candidates who have reapplied.

### 🎯 Hiring Manager Portal
- **Department Pipeline View**: Filter candidates assigned strictly to the hiring manager's department.
- **Evaluation Feedback**: Submit structured interview recommendations (`hire`, `reject`, `hold`) and scorecards.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend Core** | React 18, Vite, React Router DOM v6, TanStack Query (React Query) |
| **Frontend Styling** | TailwindCSS, Lucide React Icons, Framer Motion animations |
| **Backend Core** | Node.js (>=20.0.0), Express.js (ES Modules) |
| **Database & ODM** | MongoDB Atlas, Mongoose v8 (Partial Unique Indexes, Schema Validation) |
| **Security & Utilities**| Helmet, CORS, Express Rate Limit, bcryptjs, JsonWebToken (JWT) |
| **Testing** | ESLint, Integration Test Suite (`test-applications.mjs`) |

---

## 📁 Repository Structure

```
TalentFlow/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection, environment validation
│   │   ├── controllers/     # HTTP request handlers
│   │   ├── middleware/      # Auth JWT, Role RBAC, Upload, Error Handler
│   │   ├── models/          # Mongoose Schema definitions & indexes
│   │   ├── routes/          # Express API route modules
│   │   ├── services/        # Core business logic & database queries
│   │   └── utils/           # Response helpers, constants, validators
│   ├── uploads/             # Local upload storage directory
│   ├── server.js            # Server entrypoint
│   ├── render.yaml          # Render Infrastructure-as-Code manifest
│   ├── .env.example         # Backend environment variable template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components & modals
│   │   ├── pages/           # Candidate, Recruiter, HM & Public pages
│   │   ├── services/        # Axios API client
│   │   └── utils/           # Formatters, validators, helper functions
│   ├── vercel.json          # Vercel SPA routing rewrite rules
│   ├── .env.example         # Frontend environment variable template
│   └── package.json
└── README.md
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Port for Express server | `5000` |
| `NODE_ENV` | Environment mode (`development`, `production`, `test`) | `production` |
| `MONGODB_URI` | MongoDB connection string (Atlas or Local) | `mongodb+srv://user:pass@cluster.mongodb.net/talentflow` |
| `JWT_SECRET` | Secret key for signing JSON Web Tokens | `your_long_random_jwt_secret_key` |
| `JWT_EXPIRES_IN` | JWT expiration duration | `7d` |
| `CLIENT_URL` | Frontend origin(s) for CORS (comma-separated for multi-origin) | `https://talentflow.vercel.app` |

### Frontend (`frontend/.env`)
| Variable | Description | Example / Default |
|---|---|---|
| `VITE_API_URL` | Backend REST API base URL | `https://talentflow-api.onrender.com/api/v1` |

---

## 🚀 Local Quickstart Guide

### 1. Prerequisites
- Node.js >= 20.0.0
- npm >= 9.0.0
- MongoDB instance (Local or MongoDB Atlas cluster)

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env and supply your MONGODB_URI and JWT_SECRET
npm run dev
```
Backend will start at `http://localhost:5000` (Health check at `http://localhost:5000/health`).

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if backend runs on a non-default port
npm run dev
```
Frontend will start at `http://localhost:5173`.

---

## 🌐 Production Deployment Steps

### Recommended Deployment Order

```
┌────────────────────────┐      ┌────────────────────────┐      ┌────────────────────────┐
│  1. MongoDB Atlas      │ ───► │  2. Render Backend     │ ───► │  3. Vercel Frontend    │
│  Create DB & Cluster   │      │  Deploy API & Env Vars │      │  Deploy React SPA App  │
└────────────────────────┘      └────────────────────────┘      └────────────────────────┘
                                             │                              │
                                             ▼                              ▼
                                ┌────────────────────────┐      ┌────────────────────────┐
                                │  4. Verify /health     │ ───► │  5. Sync CORS Settings │
                                │  Check API status      │      │  Set CLIENT_URL        │
                                └────────────────────────┘      └────────────────────────┘
```

#### Step 1: MongoDB Atlas Setup
1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a Database User with read/write access.
3. Network Access: Whitelist IP `0.0.0.0/0` to allow Render server access.
4. Copy the connection string (`MONGODB_URI`).

#### Step 2: Backend Deployment (Render)
1. Push repository to GitHub.
2. Create a new **Web Service** on [Render](https://render.com).
3. Connect your GitHub repository and select the `backend` directory.
4. Set Build Command: `npm install`
5. Set Start Command: `npm start`
6. Add Environment Variables:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<your_atlas_connection_string>`
   - `JWT_SECRET`: `<your_secret_key>`
   - `JWT_EXPIRES_IN`: `7d`
   - `CLIENT_URL`: `http://localhost:5173` (Will update after Vercel step)

#### Step 3: Health Check Verification
Verify backend health endpoint:
```bash
curl https://talentflow-api.onrender.com/health
```
Expected response:
```json
{
  "status": "ok",
  "environment": "production",
  "uptime": 14.52,
  "timestamp": "2026-07-30T21:00:00.000Z"
}
```

#### Step 4: Frontend Deployment (Vercel)
1. Import repository on [Vercel](https://vercel.com).
2. Select Root Directory: `frontend`.
3. Framework Preset: **Vite**.
4. Set Environment Variable:
   - `VITE_API_URL`: `https://talentflow-api.onrender.com/api/v1`
5. Click **Deploy**.

#### Step 5: CORS Environment Variable Sync
Update `CLIENT_URL` on Render to your live Vercel domain (e.g., `https://talentflow.vercel.app`). Render will automatically restart with updated CORS whitelisting.

---

## 📁 File Uploads & Cloud Storage Note

TalentFlow automatically creates and writes local file uploads to `backend/uploads/resumes/`. Local file storage is fully functional for development and single-instance deployments.

> [!NOTE]  
> Because Render hosting uses an ephemeral filesystem, local uploads are reset on service redeploys. For multi-instance enterprise production hosting, resume uploads can be backed by persistent cloud storage (such as Cloudinary or AWS S3).

---

## 🧪 Comprehensive End-to-End Smoke Test Checklist

- [x] **Candidate Registration & Authentication**
- [x] **Recruiter Registration & Authentication**
- [x] **Hiring Manager Registration & Authentication**
- [x] **Job Opening Creation & Editing**
- [x] **Public Job Search & Filters**
- [x] **Job Application with Resume Upload**
- [x] **Application Withdrawal**
- [x] **Re-Application After Withdrawal**
- [x] **Recruiter Candidate Detail & Status Updates**
- [x] **Interview Scheduling**
- [x] **Notification Dispatch & Unread Counts**
- [x] **Candidate Profile Management**
- [x] **Company Profile Management**
- [x] **Client-Side Protected Route Reloads**

---

## 📸 Screenshots & Live Demo Placeholders

### Live Demo Links
- **Web Application**: `https://talentflow.vercel.app` (Placeholder)
- **API Health Check**: `https://talentflow-api.onrender.com/health` (Placeholder)

### Interface Mockups
```
[ Recruiter Dashboard & Kanban Pipeline Preview ]
[ Candidate Job Detail & Apply Modal Preview ]
```

---

## 📄 License

This project is licensed under the MIT License.
