# 📄 Document 4 of 10 — Database Schema (Final)
> **TalentFlow** | Full-Stack Recruitment Management Platform

---

## Overview

TalentFlow uses **MongoDB** with **Mongoose** for schema definition and validation. The database is organized into **7 collections**, each with clear field definitions, relationships, constraints, and validation rules.

**Conventions:**
- `_id` — MongoDB ObjectId (auto-generated)
- `createdAt` / `updatedAt` — Auto-managed via `{ timestamps: true }`
- References use `ObjectId` with `ref` for Mongoose `.populate()`
- Enum values match status flows defined in Document 3
- Soft-deleted documents use `isDeleted: true` and are filtered from all queries

---

## Collection Overview

| Collection | Purpose |
|---|---|
| `users` | All users across all roles |
| `companies` | Company information managed by Recruiter |
| `jobs` | Job postings created by Recruiter |
| `applications` | Candidate applications linked to jobs |
| `interviews` | Interview records linked to applications |
| `feedbacks` | HM scorecards linked to interviews |
| `notifications` | In-app notifications per user |

---

## 1. `users` Collection

```js
{
  _id: ObjectId,

  // Identity
  name:  { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: {
    type: String, required: true, unique: true, lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  passwordHash: { type: String, required: true },   // bcrypt hash; min 8 chars enforced pre-hash

  // Role
  role: {
    type: String,
    enum: ['recruiter', 'hiring_manager', 'candidate'],
    required: true
  },

  // Candidate-only profile
  profile: {
    headline:    { type: String, default: '', maxlength: 150 },
    bio:         { type: String, default: '', maxlength: 1000 },
    phone:       {
      type: String, default: '',
      match: [/^\+?[0-9\s\-().]{7,20}$/, 'Please enter a valid phone number']
    },
    location:    { type: String, default: '', maxlength: 100 },
    resumeUrl:   { type: String, default: '' },        // local path, V2 → Cloudinary URL
    portfolioUrl: {
      type: String, default: '',
      match: [/^(https?:\/\/).+/, 'Portfolio URL must start with http:// or https://']
    },
    githubUrl: {
      type: String, default: '',
      match: [/^(https?:\/\/(www\.)?github\.com\/).+/, 'Must be a valid GitHub URL']
    },
    linkedinUrl: {
      type: String, default: '',
      match: [/^(https?:\/\/(www\.)?linkedin\.com\/).+/, 'Must be a valid LinkedIn URL']
    },
    isProfileComplete: { type: Boolean, default: false },
  },

  // Hiring Manager — department
  department: {
    type: String,
    enum: ['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance', ''],
    default: ''
  },

  // Candidate — saved jobs
  savedJobs: [{ type: ObjectId, ref: 'Job' }],

  timestamps: true
}
```

**Indexes:**
- `email` — unique index
- `role` — query index

**Validation Notes:**
- Password minimum 8 characters enforced at the controller level before hashing
- Email validated via regex on save
- URL fields validated via regex — must begin with `https://`

---

## 2. `companies` Collection

```js
{
  _id: ObjectId,

  name:        { type: String, required: true, trim: true, maxlength: 200 },
  logoUrl:     { type: String, default: '' },
  website:     {
    type: String, default: '',
    match: [/^(https?:\/\/).+/, 'Website must start with http:// or https://']
  },
  location:    { type: String, default: '', maxlength: 100 },
  industry:    { type: String, default: '', maxlength: 100 },
  description: { type: String, default: '', maxlength: 2000 },

  // Relationships
  createdBy:   { type: ObjectId, ref: 'User', required: true },  // Recruiter

  // Soft Delete
  isDeleted:   { type: Boolean, default: false },

  timestamps: true
}
```

**Design Decision:** One company document per platform instance in V1.0. Multi-tenancy via `organizationId` is a V2 concern.

---

## 3. `jobs` Collection

```js
{
  _id: ObjectId,

  // Core Info
  title:           { type: String, required: true, trim: true, maxlength: 150 },
  department:      {
    type: String,
    enum: ['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance'],
    required: true
  },
  location:        { type: String, required: true, maxlength: 100 },
  jobType:         {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'remote'],
    required: true
  },
  isRemote:        { type: Boolean, default: false },

  experienceLevel: {
    type: String,
    enum: ['entry', 'mid', 'senior', 'lead'],
    default: 'mid'
  },
  description:     { type: String, required: true, maxlength: 10000 },

  // Salary
  salaryMin:       { type: Number, default: null, min: 0 },
  salaryMax:       { type: Number, default: null, min: 0 },
  // Note: salaryMax >= salaryMin enforced in pre-save middleware

  // Deadline
  applicationDeadline: { type: Date, default: null },

  // Status
  status:          {
    type: String,
    enum: ['draft', 'published', 'closed', 'archived'],
    default: 'draft'
  },

  // Relationships
  company:         { type: ObjectId, ref: 'Company', required: true },
  createdBy:       { type: ObjectId, ref: 'User', required: true },   // Recruiter

  // Denormalized stat
  applicationCount: { type: Number, default: 0 },

  // Soft Delete
  isDeleted:       { type: Boolean, default: false },

  timestamps: true
}
```

**Indexes:**
- `status + isDeleted` — public board query
- `department` — HM scoped queries
- `createdAt` — sort by newest
- `salaryMin` — sort by salary

---

## 4. `applications` Collection

```js
{
  _id: ObjectId,

  // Relationships
  job:       { type: ObjectId, ref: 'Job', required: true },
  candidate: { type: ObjectId, ref: 'User', required: true },

  // Application Content
  coverNote: { type: String, default: '', maxlength: 2000 },
  resumeUrl: { type: String, required: true },
  // Snapshot of resume at time of application.
  // Candidate may update their profile resume later without affecting this record.
  // V2: will store Cloudinary URL instead of local path.

  // Apply timestamp (explicit — easier to query than createdAt)
  appliedAt: { type: Date, default: Date.now },

  // Pipeline Status
  status: {
    type: String,
    enum: [
      'applied', 'under_review', 'shortlisted',
      'interview', 'offer', 'hired', 'rejected', 'withdrawn'
    ],
    default: 'applied'
  },

  // Audit Trail
  statusHistory: [
    {
      status:    { type: String },
      changedAt: { type: Date, default: Date.now },
      changedBy: { type: ObjectId, ref: 'User' }
    }
  ],

  // Private recruiter notes — NEVER returned to candidates or HMs in API responses
  recruiterNotes: { type: String, default: '', maxlength: 3000 },

  // Soft Delete
  isDeleted: { type: Boolean, default: false },

  timestamps: true
}
```

**Indexes:**
- `job + candidate` — compound unique index (prevents duplicate applications)
- `job + status` — compound index (recruiter pipeline filtering: job X → shortlisted)
- `candidate` — candidate dashboard queries
- `appliedAt` — sort by date applied

---

## 5. `interviews` Collection

```js
{
  _id: ObjectId,

  // Relationships
  application:  { type: ObjectId, ref: 'Application', required: true },
  job:          { type: ObjectId, ref: 'Job', required: true },
  candidate:    { type: ObjectId, ref: 'User', required: true },
  scheduledBy:  { type: ObjectId, ref: 'User', required: true },   // Recruiter
  interviewer:  { type: ObjectId, ref: 'User', default: null },    // Hiring Manager

  // Schedule
  scheduledAt:  { type: Date, required: true },
  format:       {
    type: String,
    enum: ['in-person', 'video', 'phone'],
    required: true
  },
  location:     { type: String, default: '', maxlength: 300 },     // room or video link

  // Visible to candidate — renamed from 'notes' for clarity
  candidateInstructions: { type: String, default: '', maxlength: 1000 },
  // Examples: "Join 10 minutes early.", "Bring your laptop.", "Video link: meet.google.com/xyz"

  // Status
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled'
  },
  cancelledReason: { type: String, default: '', maxlength: 500 },

  timestamps: true
}
```

**Indexes:**
- `application` — multiple rounds per application
- `candidate` — candidate interview history
- `scheduledAt` — sorting upcoming
- `status` — filter active/completed/cancelled

---

## 6. `feedbacks` Collection

```js
{
  _id: ObjectId,

  // Relationships
  interview:    { type: ObjectId, ref: 'Interview', required: true },
  application:  { type: ObjectId, ref: 'Application', required: true },
  candidate:    { type: ObjectId, ref: 'User', required: true },
  submittedBy:  { type: ObjectId, ref: 'User', required: true },   // Hiring Manager

  // Scorecard
  ratings: {
    overall:       { type: Number, min: 1, max: 5, required: true },
    technical:     { type: Number, min: 1, max: 5, required: true },
    communication: { type: Number, min: 1, max: 5, required: true },
    cultureFit:    { type: Number, min: 1, max: 5, required: true }
  },

  // Written feedback
  comments:     { type: String, default: '', maxlength: 3000 },

  // Recommendation
  recommendation: {
    type: String,
    enum: ['hire', 'reject', 'hold'],
    required: true
  },

  // Why this recommendation was made
  decisionReason: { type: String, default: '', maxlength: 1000 },
  // Example: "Strong technical skills but communication was unclear under pressure."

  timestamps: true
}
```

**Indexes:**
- `interview` — one scorecard per interview per HM
- `application` — aggregate all feedback for a candidate profile

---

## 7. `notifications` Collection

```js
{
  _id: ObjectId,

  // Recipient
  recipient: { type: ObjectId, ref: 'User', required: true },

  // Content
  type: {
    type: String,
    enum: [
      'application_received',
      'status_updated',
      'interview_scheduled',
      'interview_completed',
      'interview_cancelled',
      'feedback_submitted',
      'application_withdrawn',
      'hired',
      'rejected'
    ],
    required: true
  },

  message:  { type: String, required: true, maxlength: 500 },

  // Navigation on click
  link:     { type: String, default: '' },

  // Icon hint for frontend rendering
  icon: {
    type: String,
    enum: ['success', 'info', 'warning', 'error'],
    default: 'info'
  },
  // success → hired, shortlisted
  // info    → status_updated, interview_scheduled
  // warning → interview_cancelled, application_withdrawn
  // error   → rejected

  // Related entities
  relatedJob: { type: ObjectId, ref: 'Job', default: null },
  relatedApp: { type: ObjectId, ref: 'Application', default: null },

  // State
  isRead:   { type: Boolean, default: false },

  timestamps: true
}
```

**Indexes:**
- `recipient + isRead` — unread count badge query
- `recipient + createdAt` — notification panel sorted by newest

---

## 8. Schema Validation Rules

| Field | Rule |
|---|---|
| `user.email` | Regex: `/^\S+@\S+\.\S+$/` — must be a valid email |
| `user.passwordHash` | Minimum 8 characters enforced at controller before hashing |
| `user.profile.phone` | Regex: `/^\+?[0-9\s\-().]{7,20}$/` — international-safe |
| `user.profile.portfolioUrl` | Must start with `http://` or `https://` |
| `user.profile.githubUrl` | Must match `github.com/` URL pattern |
| `user.profile.linkedinUrl` | Must match `linkedin.com/` URL pattern |
| `company.website` | Must start with `http://` or `https://` |
| `job.salaryMax` | Must be `>= salaryMin` — enforced in `pre('save')` middleware |
| `job.applicationDeadline` | Must be a future date — enforced at controller level |
| Resume upload | File type: PDF or DOCX only — enforced by Multer `fileFilter` |
| Resume upload | Max size: 5MB — enforced by Multer `limits.fileSize` |
| `application.coverNote` | Max 2000 characters |
| `feedback.ratings.*` | Integer between 1 and 5 (inclusive) |

---

## 9. Mongoose Middleware / Hooks

```
// Application — pre('save')
// Push new status into statusHistory when status changes
applicationSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      changedBy: this._changedBy   // set on the document before save
    });
  }
  next();
});

// Job — pre('save')
// Validate salaryMax >= salaryMin when both are set
jobSchema.pre('save', function (next) {
  if (this.salaryMin && this.salaryMax && this.salaryMax < this.salaryMin) {
    return next(new Error('salaryMax must be greater than or equal to salaryMin'));
  }
  next();
});

// Application — post('save')
// Increment or decrement applicationCount on the parent Job
applicationSchema.post('save', async function (doc) {
  await Job.findByIdAndUpdate(doc.job, { $inc: { applicationCount: 1 } });
});

// Notification — post('save') [Future / V2]
// Emit a WebSocket event to the notification recipient
notificationSchema.post('save', function (doc) {
  // io.to(doc.recipient.toString()).emit('new_notification', doc);
  // Uncomment when Socket.IO is integrated in V2
});
```

> **Design Note:** Middleware keeps business logic co-located with the schema rather than scattered across service files. The WebSocket hook is documented now so the pattern is established when V2 is built.

---

## 10. Relationship Diagram

```
User (candidate)
  │
  ├── savedJobs[]  ──────────────────────── Job
  │
  └── Application ── (job) ─────────────── Job ── Company
            │
            ├── statusHistory[]
            │
            ├── (recruiterNotes — private)
            │
            └── Interview ── (interviewer) ── User (hiring_manager)
                    │
                    └── Feedback
                          └── (submittedBy) ── User (hiring_manager)

User (any role)
  └── Notification[]
```

---

## 11. Enum Reference

| Field | Values |
|---|---|
| `user.role` | `recruiter`, `hiring_manager`, `candidate` |
| `user.department` | `Engineering`, `Design`, `Marketing`, `Sales`, `HR`, `Finance` |
| `job.status` | `draft`, `published`, `closed`, `archived` |
| `job.jobType` | `full-time`, `part-time`, `contract`, `remote` |
| `job.experienceLevel` | `entry`, `mid`, `senior`, `lead` |
| `application.status` | `applied`, `under_review`, `shortlisted`, `interview`, `offer`, `hired`, `rejected`, `withdrawn` |
| `interview.format` | `in-person`, `video`, `phone` |
| `interview.status` | `scheduled`, `completed`, `cancelled` |
| `feedback.recommendation` | `hire`, `reject`, `hold` |
| `notification.type` | 9 types — see collection above |
| `notification.icon` | `success`, `info`, `warning`, `error` |

---

## 12. Design Decisions

| Decision | Reason |
|---|---|
| Department as enum | Prevents inconsistent string values across users and jobs |
| `isRemote` boolean separate from `jobType` | Allows future `hybrid` type without schema redesign |
| `applicationDeadline` on Job | Professional UX; candidates see deadline on job cards |
| `appliedAt` explicit field | Easier to query and sort than relying on `createdAt` |
| `candidateInstructions` vs `notes` | More descriptive; clearly scoped to the candidate's view |
| `decisionReason` on Feedback | Gives Recruiter context beyond a single recommendation word |
| `icon` on Notification | Eliminates frontend conditional logic for icon mapping |
| `isDeleted` soft delete | Standard practice; preserves data integrity and audit history |
| `recruiterNotes` in Application | Simple access control — omit from non-recruiter API responses |
| `statusHistory` embedded | Audit trail co-located; avoids separate collection in V1 |
| `applicationCount` denormalized | Avoids expensive `$lookup` on dashboard stats |
| `resumeUrl` on Application | Snapshot at apply time; independent of profile updates |
| Saved jobs on User | Simple for V1; extractable to collection in V2 |
| V2 note: Cloudinary | Resume uploads currently use Multer + local storage; Cloudinary replaces in V2 |

---

> ✅ **Document 4 of 10 — Database Schema (Final)**
