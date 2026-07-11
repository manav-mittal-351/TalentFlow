# 📄 Document 8 of 10 — UI Pages (Final)
> **TalentFlow** | Full-Stack Recruitment Management Platform

---

## Design Directive

> **UI quality is a first-class requirement.** Every page must feel like a premium SaaS product — not a CRUD dashboard. Visual inspiration: **Linear, Vercel, Stripe Dashboard, Clerk, Notion, Framer, Arc Browser**. Use modern spacing, rounded cards, soft shadows, beautiful typography, subtle gradients, tasteful Framer Motion animations, responsive layouts, polished tables, elegant forms, meaningful empty states, loading skeletons, and smooth transitions. Avoid generic Tailwind admin templates. TalentFlow has its own distinctive visual identity.

**Styling:** Tailwind CSS + CSS custom properties
**Animations:** Framer Motion throughout
**Charts:** Recharts (animated)
**Dark mode:** First-class — every page supports Light / Dark / System
**Mobile:** Purpose-built mobile experience — not shrunk desktop

---

## Page Index

| # | Page | Route | Access |
|---|---|---|---|
| 1 | Home / Landing | `/` | Public |
| 2 | Job Board | `/jobs` | Public |
| 3 | Job Detail | `/jobs/:jobId` | Public |
| 4 | Login | `/login` | Public |
| 5 | Register | `/register` | Public |
| 6 | Candidate Dashboard | `/candidate/dashboard` | Candidate |
| 7 | My Applications | `/candidate/applications` | Candidate |
| 8 | Application Detail | `/candidate/applications/:id` | Candidate |
| 9 | Saved Jobs | `/candidate/saved-jobs` | Candidate |
| 10 | Candidate Profile | `/candidate/profile` | Candidate |
| 11 | Notifications | `/candidate/notifications` | Candidate |
| 12 | Recruiter Dashboard | `/recruiter/dashboard` | Recruiter |
| 13 | Jobs Management | `/recruiter/jobs` | Recruiter |
| 14 | Create / Edit Job | `/recruiter/jobs/new` & `/edit` | Recruiter |
| 15 | Job Pipeline | `/recruiter/jobs/:jobId` | Recruiter |
| 16 | Candidate Detail | `/recruiter/candidates/:id` | Recruiter |
| 17 | Interviews | `/recruiter/interviews` | Recruiter |
| 18 | Company Info | `/recruiter/company` | Recruiter |
| 19 | HM Dashboard | `/hiring-manager/dashboard` | Hiring Manager |
| 20 | HM Jobs | `/hiring-manager/jobs` | Hiring Manager |
| 21 | HM Candidate Detail | `/hiring-manager/candidates/:id` | Hiring Manager |
| — | 403 Unauthorized | `/unauthorized` | All |
| — | 404 Not Found | `*` | All |

---

## Public Pages

---

### Page 1 — Home / Landing (`/`)

**Purpose:** Premium startup marketing page. First impression — must immediately convey quality, trust, and purpose.

**Design:** Full dark/light dual-mode. Deep indigo-to-purple gradient hero. Glassmorphism on hero content card. Inter font. Generous whitespace. Every section fades in on scroll (Framer Motion `whileInView`).

**Sections:**

#### 1. Hero
- Full-viewport height (`min-h-screen`)
- Background: Subtle animated mesh gradient (indigo → purple → cyan) using CSS `@keyframes`
- **Glassmorphism panel**: frosted card (`backdrop-blur-xl bg-white/10`) containing headline + subheadline + CTAs
- Headline: Large, bold — *"Hire Smarter. Move Faster."*
- Subheadline: 1 sentence value prop
- CTAs: `[Browse Open Roles]` (primary) + `[Post a Job →]` (ghost)
- Right side: Animated mockup of the Recruiter Dashboard pipeline (static screenshot, subtle float animation)
- Scroll indicator: animated chevron bounce

#### 2. Trusted By (Logo Bar)
- *"Trusted by teams at"* — greyscale company logos scrolling in a ticker loop
- Subtle fade masks on left/right edges

#### 3. Features Grid
- Section title: *"Everything your team needs to hire well"*
- 3-column card grid (1-col on mobile)
- Each feature card: Icon in colored rounded square + title + 2-line description
- Cards lift on hover (`whileHover y:-4`)
- Features: Easy Apply · Pipeline Tracking · Interview Scheduling · Status Visibility · Team Collaboration · Role-Based Access

#### 4. Hiring Pipeline Illustration
- Full-width section with illustrated pipeline flow diagram
- Shows: Apply → Review → Interview → Hire in a horizontal card flow
- Animated: Each stage card slides in left-to-right on scroll entry
- Background: Subtle dot-grid pattern

#### 5. Latest Jobs
- Section title: *"Currently Hiring"*
- 3 most recent published `JobCard` components in a row
- "See All Jobs →" link

#### 6. Testimonials
- 3-column card grid with quote, avatar, name, role, company
- Subtle star ratings above each quote
- Cards have left border accent in brand indigo

#### 7. FAQ
- Accordion component — question rows expand/collapse with smooth Framer Motion height animation
- 6–8 common questions (What is TalentFlow? How do I apply? etc.)

#### 8. Final CTA Banner
- Full-width indigo gradient section
- *"Ready to build your team?"*
- `[Get Started Free]` button (large, white, rounded-full)

**Components:** `Navbar` (transparent → solid on scroll), `JobCard`, `Button`, `Footer`
**Animations:** Scroll-triggered `whileInView` fade-up per section, hero mesh gradient, logo ticker, pipeline diagram stagger, accordion height animation
**Mobile:** Single column throughout, hero CTA stacks vertically, logo ticker fits narrower viewport

---

### Page 2 — Job Board (`/jobs`)

**Purpose:** Premium job discovery experience. Feels like a modern job platform, not a list page.

**Design:** Clean white/dark background. Filter bar is sticky on scroll. Job cards in a responsive grid with hover lifts.

**Sections:**
- **Sticky filter bar** — Search input (with icon), Department dropdown, Job Type chips (pill toggles), Location input, Sort select (`Newest / Salary / Location`), active filter count badge, "Clear all" link
- **Results header** — "Showing 24 open positions" + view toggle (grid / list)
- **Jobs grid** — 3-col desktop / 2-col tablet / 1-col mobile
- **Pagination bar** — Centered, showing "Page 2 of 9"

**`JobCard` premium design:**
- `rounded-2xl`, `shadow-card`, white background (dark: `neutral-900`)
- Company logo (avatar, 40px) + company name (muted)
- Job title (bold, 18px) + department `Badge`
- Location chip + job type chip + remote badge (if `isRemote`)
- Salary: formatted `$80K – $120K` or `Salary not disclosed`
- Deadline warning (amber badge) if < 7 days remaining
- Bottom row: `X days ago` (left) + bookmark icon — filled/outlined (right)
- Hover: `translateY(-3px)` + deeper shadow (spring transition)

**Empty state:**
```
🔍
No jobs match your filters.
Try adjusting your search or clearing filters.
[Clear Filters]  [Browse All Jobs]
```

**Loading:** 6 skeleton `JobCard` placeholders with shimmer animation
**Error:** ErrorState with retry button

---

### Page 3 — Job Detail (`/jobs/:jobId`)

**Purpose:** Compelling job page that converts browsers into applicants.

**Layout:** Two-column (content left, sticky sidebar right) on desktop. Single column on mobile.

**Sections:**
- **Page header** — Breadcrumb: `Jobs > Engineering > Frontend Developer`
- **Job hero card** — Company logo (64px), company name, job title (H1), department badge, location chip, job type + remote badge, `X days ago`
- **Description** — Rich text rendered with custom typography styles (h2/h3 hierarchy, bullet lists)
- **Sticky right sidebar:**
  - Salary range (large, highlighted)
  - Experience level badge
  - Application deadline (with countdown if < 7 days)
  - `[Apply Now]` button (full-width, primary)
  - `[Save Job]` button (full-width, outline)
  - Company info card: logo, name, industry, website link
- **Related Jobs** — 2 similar jobs at the bottom

**Behaviour:**
- "Apply Now" → Candidate: confirmation modal → submit; Not logged in → login redirect with return URL
- "Save Job" → Immediate feedback (icon fills), toast confirmation

**Animation:** Sticky sidebar smoothly follows scroll. Apply button pulses subtly on hover.
**Loading:** Full-page skeleton with hero + sidebar placeholders
**Error:** "Job not found" with illustrated 404-style treatment + "Back to Jobs" button

---

### Page 4 — Login (`/login`)

**Purpose:** Polished, trust-inspiring authentication. First thing internal users see every day.

**Layout:** **Split-screen** — Left panel (60%) + Right card (40%)

**Left panel:**
- Brand indigo gradient background
- TalentFlow logo (large)
- Tagline: *"Your hiring command center"*
- 3 feature highlights with checkmark icons:
  - ✓ Manage your entire pipeline in one place
  - ✓ Real-time candidate status updates
  - ✓ Role-based access for your whole team
- Decorative: Blurred gradient orbs (glassmorphism aesthetic)
- Bottom: Screenshot or illustration of the dashboard

**Right panel:**
- Clean white (dark: `neutral-950`) card
- `"Welcome back"` heading
- Email + password inputs (floating labels)
- "Forgot password?" link (greyed out, tooltip: "Contact your admin")
- `[Sign In]` button (full-width, primary, spinner on loading)
- Divider + `"New candidate? Create an account"` link → `/register`

**Animation:** Left panel: subtle orb float animation. Form fields: floating label on focus. Button: scale on hover/tap.
**Mobile:** Single column — left panel collapses to a minimal brand header bar above the form

---

### Page 5 — Register (`/register`)

**Purpose:** Friction-free candidate registration.

**Layout:** Centered card (max-w-md), same glassmorphism background as Login (single-panel version).

**Sections:**
- TalentFlow logo + "Create your account"
- Form: Full name, Email, Password (strength indicator bar), Confirm password
- `[Create Account]` button (full-width)
- "Already have an account? Sign in" link
- Terms micro-copy: "By registering you agree to our Terms of Service"

**Password strength indicator:** Animated progress bar — Weak (red) → Fair (amber) → Strong (green)
**Animation:** Form card entrance: `scale(0.95) → scale(1)` on mount
**Mobile:** Full-width form, generous padding

---

## Candidate Pages

**Layout shell:** `AppShell` — Sidebar (left) + Navbar (top)
**Mobile:** Bottom navigation bar (5 icons: Overview · Applications · Saved · Profile · Notifications). Sidebar hidden on mobile.

---

### Page 6 — Candidate Dashboard (`/candidate/dashboard`)

**Purpose:** Beautiful personal command center for the job seeker.

**Design:** Clean, spacious. Warm greeting. Glanceable stats. Cards lift on hover.

**Sections:**
- **Greeting** — *"Good morning, Priya 👋"* with current date
- **Stats row** — 4 animated `StatCard` components (Stripe-style):
  - Total Applications (indigo icon)
  - Active Applications (cyan icon)
  - Interviews Scheduled (amber icon)
  - Saved Jobs (green icon)
  - Each: large count-up number + trend indicator (↑ / ↓) + mini description
- **Upcoming Interview card** — If scheduled: glassmorphism card with date, time, format chip, job title, `candidateInstructions`. Countdown timer if < 24h. CTA: "View Details"
- **Recent Applications** — Last 5 as `ApplicationCard` rows with status badges. "View All" link.
- **Quick Actions** — Two ghost buttons: `[Browse Jobs]` + `[Update Profile]`

**Empty state (no applications):**
```
🚀
Your job search starts here.
Browse open roles and submit your first application.
[Browse Jobs]  [Complete Profile]
```

**Loading:** Skeleton stats row + skeleton cards
**Animations:** Stats count up on mount (staggered). Cards fade in with stagger delay. Interview card subtle glow pulse.

---

### Page 7 — My Applications (`/candidate/applications`)

**Purpose:** Complete application history with status visibility.

**Design:** Premium table — rounded, hover rows, status color coding, sticky header.

**Sections:**
- **Page header** — "My Applications" (H1) + total count badge
- **Filter bar** — Status filter dropdown + sort (Latest / Oldest)
- **Applications table:**
  - Sticky header row (blurred backdrop on scroll)
  - Columns: Job · Company · Department · Date Applied · Status · Actions
  - Row hover: subtle `bg-neutral-50/dark:bg-neutral-800` highlight
  - Alternating row subtle tint
  - Status cell: colour-coded `Badge` with dot
  - Actions: "View Details" link (right-arrow icon, appears on row hover)
  - Entire row clickable
  - Rounded corners on first/last row
- **Pagination**

**Empty state:**
```
📋
No applications yet.
Start exploring open roles and apply to positions that interest you.
[Browse Jobs]
```

**Loading:** Skeleton table rows (5)
**Animations:** Table rows fade in staggered. Row hover is instant (no delay).

---

### Page 8 — Application Detail (`/candidate/applications/:id`)

**Purpose:** Deep, transparent view of a single application journey.

**Design:** Timeline-focused. Feels like tracking a delivery — always know where you stand.

**Sections:**
- **Job summary card** — Company logo, title, department badge, location
- **Current status** — Large colour-coded `Badge` + last updated timestamp
- **Interactive Status Timeline (GitHub Actions-style):**
  - Vertical track with connecting line
  - Each stage has an icon:
    - Completed: ✅ filled green circle + date + changed by
    - Current: 🔵 pulsing animated ring
    - Future: ○ muted empty circle
  - Smooth staggered entrance animation per node
  - Dates shown in relative format ("3 days ago")
- **Interview card** — If scheduled: frosted card with date, time, format badge, `candidateInstructions`, interviewer name (first name only)
- **Cover note** — Collapsible card with the submitted cover note
- **Withdraw button** — Danger ghost button, bottom of page. Opens confirm `Modal` with warning copy. Hidden if status = Hired / Rejected.

**Loading:** Full skeleton
**Error:** "Application not found" with illustrated empty state + "Back to Applications"

---

### Page 9 — Saved Jobs (`/candidate/saved-jobs`)

**Purpose:** Personal job wishlist.

**Design:** Same `JobCard` grid as Job Board. Clean, browsable.

**Sections:**
- **Page header** — "Saved Jobs" + count
- **Jobs grid** — `JobCard` × N with "Unsave" bookmark button (filled, click to remove with undo toast)
- **Pagination**

**Empty state:**
```
🔖
No saved jobs yet.
Bookmark roles you're interested in and come back to apply when you're ready.
[Browse Jobs]
```

---

### Page 10 — Candidate Profile (`/candidate/profile`)

**Purpose:** Profile management — the data that powers every application.

**Design:** Clean form layout. Profile completeness prominent and motivating.

**Sections:**
- **Profile header card** — Avatar (initials, coloured background), name (large), headline, location. Edit button (pencil icon, top-right of card).
- **Profile completeness bar** — Animated progress bar (0–100%). Shows which fields are missing. Gates the "Apply" action if < 100%.
  - `"Your profile is 60% complete. Add your resume and phone number to apply."`
- **Personal Info form** — Name, phone, location, headline, bio (all `Input` components with floating labels)
- **Social Links form** — Portfolio URL, GitHub URL, LinkedIn URL — each with brand icon prefix in input
- **Resume section** — Current file card: file icon + filename + upload date + size. "Replace Resume" button triggers file input. Rules shown: `PDF or DOCX · Max 5MB`
- **Save button** — Sticky bottom bar on mobile; inline on desktop. Shows spinner on save.

**Animation:** Progress bar animates to current value on mount.
**Upload error:** Inline message (red, below file input)

---

### Page 11 — Notifications (`/candidate/notifications`)

**Purpose:** Full notification history — grouped, readable, actionable.

**Design:** Clean list. Grouped by date. Icon-coded by type.

**Sections:**
- **Page header** — "Notifications" + unread count badge + "Mark all read" button (right)
- **Groups:** Today · Yesterday · Earlier
- **`NotificationItem` rows:**
  - Left: Coloured icon circle (success/info/warning/error)
  - Center: Message (bold if unread) + relative time
  - Right: Unread blue dot
  - Hover: subtle tint
  - Click: marks read + navigates to linked page
- **Pagination**

**Empty state:**
```
🎉
You're all caught up!
No new notifications at the moment.
```

---

## Recruiter Pages

**Layout shell:** `AppShell` — Sidebar + Navbar
**Sidebar design:** Vercel-inspired — icons + labels (collapsed: icons only with tooltips), smooth spring animation, active item: indigo left border accent, resizable drag handle
**Mobile:** Drawer sidebar (slides from left), backdrop overlay

---

### Page 12 — Recruiter Dashboard (`/recruiter/dashboard`)

**Purpose:** Hiring command center. The most important page in the app.

**Design:** Rich, data-dense but not overwhelming. Stripe-quality stat cards. Animated charts. Real-time feel.

**Sections:**
- **Header** — "Dashboard" + current date + "Create Job" quick-action button (right)
- **Stats row** — 4 animated `StatCard` (glassmorphism on dashboard widgets):
  - Open Jobs (indigo) · Total Candidates (cyan) · Interviews This Week (amber) · Hired This Month (green)
  - Each: icon (colored square) + large count-up number + `↑ 14%` trend + mini sparkline
- **Pipeline Breakdown:**
  - **Animated Donut Chart** (Recharts) — stage distribution, center label: total
  - **Animated Funnel Bars** — each stage: label + count + animated width fill on mount
- **Monthly Applications Trend** — `AreaChart` (Recharts): Applications vs Hired, 6 months, gradient fill, hover tooltip
- **Recent Applications** — Last 5 as premium table rows: avatar + name + job + status badge + time. "View All" link.
- **Upcoming Interviews** — Next 3 as mini cards: candidate, job, date/time, format chip. "View All" link.
- **Recent Notifications** — Last 3 unread notification items. "View All" link.

**Loading:** Skeleton stats + skeleton charts + skeleton table
**Empty state (no jobs):**
```
📋
Your hiring pipeline is empty.
Create your first job posting to start receiving applications.
[Create Job]  [Learn More]
```

**Animations:** Stats count up (staggered). Chart bars animate on mount. Donut chart spins in. Table rows stagger in.

---

### Page 13 — Jobs Management (`/recruiter/jobs`)

**Purpose:** Full CRUD control over all job postings.

**Design:** Clean table with status tabs. Premium table treatment — sticky header, hover rows.

**Sections:**
- **Page header** — "Job Postings" + `[+ Create New Job]` button (right)
- **Status tab bar** — All · Published · Draft · Closed · Archived (tab switches with animated underline indicator)
- **Jobs table:**
  - Sticky blurred header
  - Columns: Job Title · Department · Applications · Status · Posted Date · Actions
  - Status column: `JobStatusBadge`
  - Applications: count with arrow icon (click → Job Pipeline)
  - Actions column: `⋯` menu → Edit · Publish/Close · Archive
  - Row hover highlight + cursor pointer
  - Rounded corners top/bottom rows
- **Pagination**

**Empty state per tab:**
```
[Draft tab empty]
📝
No draft jobs.
Start building a new job posting.
[Create Job]
```

**Animations:** Tab indicator slides between tabs. Table rows stagger in on tab switch.

---

### Page 14 — Create / Edit Job (`/recruiter/jobs/new` & `/:jobId/edit`)

**Purpose:** Polished job creation/editing experience.

**Design:** Two-column layout: form (left, 65%) + live preview card (right, 35%, sticky)

**Form sections (with section headers + dividers):**
1. **Basic Info** — Title (large input), Department (select), Experience Level (pill toggle: Entry · Mid · Senior · Lead)
2. **Location & Type** — Location input, Job Type (pill toggle: Full-time · Part-time · Contract · Remote), `isRemote` toggle switch
3. **Compensation** — Salary Min + Max (side-by-side inputs with `$` prefix), currency select, Application Deadline (date picker with calendar popup)
4. **Description** — Large textarea with character counter (bottom-right), placeholder: `"Describe the role, responsibilities, and what success looks like..."`
5. **Publishing** — Status toggle: `Draft` ↔ `Published` (with explanation: Draft = not visible to candidates)

**Live preview card (right):** Updates in real-time as recruiter types — shows exactly how the `JobCard` will appear on the public board.

**Action bar (sticky bottom):**
- `[Save as Draft]` (outline) + `[Publish Job]` (primary) — or `[Save Changes]` in edit mode
- Validation errors shown inline per field + summary toast on failed submit

**Animations:** Preview card updates with subtle fade. Form field focus: label floats up.

---

### Page 15 — Job Pipeline (`/recruiter/jobs/:jobId`)

**Purpose:** The best page in the app — full candidate pipeline for a specific job.

**Design:** Power-user table. Fast, scannable, actionable. Every row is a decision.

**Sections:**
- **Job header** — Title (H1) + status badge + application count + "Edit Job" link (right)
- **Filter + search bar:**
  - Search input: *"Search by name or email..."* with live filtering
  - Status filter: dropdown (all stages listed)
  - Sort: Latest · Oldest · Status
  - Results count: *"Showing 12 of 34 candidates"*
- **Candidates table:**
  - **Sticky header** (blurred on scroll)
  - Columns: Candidate · Stage · Applied · Rating (avg HM score if any) · Actions
  - Candidate cell: Avatar + Name + Headline (muted)
  - Stage cell: colour-coded `Badge`
  - Actions cell (appears on row hover): `[View Profile]` + `[Update Status]` dropdown
  - Entire row clickable (→ Candidate Detail)
  - Hover: highlight + slide-in actions
- **Pagination**

**Empty state:**
```
👥
No applications yet for this role.
Share the job link to start receiving candidates.
[Copy Job Link]  [Back to Jobs]
```

**Animations:** Row hover is instant. Actions slide in on hover. Status dropdown animates open/closed.

---

### Page 16 — Candidate Detail (`/recruiter/candidates/:id`)

**Purpose:** Full recruiter view of a candidate. Central decision-making page.

**Layout:** Two-column — candidate info (left, 60%) + actions panel (right, 40%, sticky)

**Left column:**
- **Candidate header card** — Avatar (64px), Name (H1), Headline, Location, Email, Phone
- **Social links row** — Portfolio icon · GitHub icon · LinkedIn icon (open in new tab)
- **Resume card** — File icon + filename + upload date + `[Download Resume]` button
- **Status Timeline** — Interactive GitHub Actions-style timeline (see Document 9 for detail)
- **Application notes** — Collapsible cover note card

**Right column (sticky):**
- **Current status panel** — Stage badge (large) + `StatusDropdown` to update
- **Quick actions** — `[Schedule Interview]` button (opens `InterviewForm` modal) · `[Hire]` (green) · `[Reject]` (red) — with confirm dialogs
- **Recruiter Notes** — Private textarea with lock icon. Autosave (debounced). "Saved ✓" indicator. ⚠️ labeled "Visible to you only"
- **HM Feedback** — All submitted `FeedbackCard` components (read-only for recruiter). Shows average rating.
- **Interview history** — All `InterviewCard` components for this candidate

**Modal:** `InterviewForm` rendered in `Modal` when scheduling

**Loading:** Full-page skeleton
**Animations:** Status badge updates with scale animation. Notes autosave indicator fades in/out.

---

### Page 17 — Interviews (`/recruiter/interviews`)

**Purpose:** Single list of all interviews across all jobs.

**Design:** Clean table. Status-coded rows. Date-grouped.

**Sections:**
- **Page header** — "Interviews" + count + `[Schedule Interview]` (from here too, with job selector in modal)
- **Filter bar** — Status (Scheduled / Completed / Cancelled), Sort (Upcoming / Latest)
- **Interviews table:**
  - Columns: Candidate · Job · Date & Time · Format · Interviewer · Status · Actions
  - Format cell: chip — 🎥 Video · 📍 In-person · 📞 Phone
  - Status: `InterviewStatusBadge`
  - Actions: `[Mark Complete]` · `[Cancel]` (only on Scheduled rows)
  - Hover highlight
- **Pagination**

**Empty state:**
```
📅
No interviews scheduled.
Schedule interviews from a candidate's profile page.
[Go to Pipeline]
```

---

### Page 18 — Company Information (`/recruiter/company`)

**Purpose:** Control how TalentFlow presents the company to candidates.

**Design:** Settings-style page. Form left, live preview right.

**Sections:**
- **Section header** — "Company Information"
- **Form** — Company name, Logo URL (with preview thumbnail), Website, Location, Industry, Description (textarea)
- **Live preview** — Right panel shows how company info appears on a `JobCard` and on Job Detail pages
- **`[Save Changes]`** — Sticky bottom or inline. Toast on success.

---

## Hiring Manager Pages

**Layout shell:** `AppShell` — scoped Sidebar + Navbar
**Mobile:** Bottom navigation (Overview · My Jobs · Notifications)

---

### Page 19 — HM Dashboard (`/hiring-manager/dashboard`)

**Purpose:** Focused view — only what the HM needs to act on.

**Design:** Intentionally simpler than Recruiter Dashboard. Less data, more signal.

**Sections:**
- **Greeting** — Name + role badge
- **Stats row** — 4 `StatCard`: Assigned Jobs · Candidates Pending Review · Feedback Submitted · Upcoming Interviews
- **Pending Review list** — Shortlisted candidates waiting for HM feedback. Premium table rows: Candidate + Job + Date Shortlisted + "Review Now →" action. Pulsing amber dot if any pending > 3 days.
- **Upcoming Interviews** — Next 2 interview cards
- **Recent Notifications** — Last 3

**Empty state (nothing pending):**
```
✅
You're all caught up!
No candidates pending your review right now.
[View My Jobs]
```

---

### Page 20 — HM Jobs (`/hiring-manager/jobs`)

**Purpose:** Jobs scoped to HM's department. Clean, focused.

**Sections:**
- **Page header** — "My Jobs" + department badge
- **Jobs table** — Title · Applications · Shortlisted (amber badge if any) · Status · "View Candidates →"
- **Click row** → filtered pipeline (Shortlisted + Interview only)

---

### Page 21 — HM Candidate Detail (`/hiring-manager/candidates/:id`)

**Purpose:** Read-only candidate view + feedback submission. The HM's primary action page.

**Design:** Same two-column layout as Recruiter Candidate Detail — but right panel shows `FeedbackForm` instead of management actions.

**Left column:**
- Candidate header (avatar, name, headline, location, social links)
- Resume download card
- Status timeline (read-only — no `StatusDropdown`)
- Cover note card
- ⚠️ **Recruiter Notes section: NOT rendered. Not fetched. Not in API response.**

**Right column:**
- **Current Status** — Read-only badge (no dropdown)
- **Feedback section:**
  - If no feedback submitted yet → `FeedbackForm` (star ratings, comments, recommendation, decision reason)
  - If feedback submitted → `FeedbackCard` (own submission, with "Edit" option)
- **My past feedback** — Scrollable if multiple rounds

---

## Shared / Utility Pages

### 403 Unauthorized (`/unauthorized`)
- **Design:** Centered, minimal. Large illustrated lock icon (brand indigo).
- *"Access Denied"* — H1
- *"You don't have permission to view this page."*
- `[Go to Dashboard]` button (routes correctly by role)
- Subtle background: dot-grid pattern

### 404 Not Found (`*`)
- **Design:** Centered, personality-rich. Illustrated confused robot or broken page graphic.
- Large "404" in brand gradient text
- *"Page not found"*
- *"The page you're looking for doesn't exist or has been moved."*
- `[Go Home]` + `[Browse Jobs]` buttons

---

## Global Mobile Experience

> **Rule:** Do NOT simply shrink the desktop layout. Mobile is purpose-built.

| Element | Desktop | Mobile |
|---|---|---|
| Sidebar | Fixed left, collapsible | Hidden; drawer (swipe or hamburger) |
| Navigation | Sidebar nav items | Bottom tab bar (5 icons) |
| Tables | Full columns | Condensed: 2–3 key columns, swipe for more |
| Forms | Two-column grid | Single column |
| Modals | Centered overlay | Bottom sheet (slides up) |
| Dashboard stats | 4-column row | 2×2 grid |
| Job cards | 3-column grid | Single column |
| Sticky actions | Inline | Floating action button (FAB) bottom-right |

**Bottom navigation items (candidates):** 🏠 Home · 📋 Applications · 🔖 Saved · 👤 Profile · 🔔 Notifications

---

## Global UI State System

Every page with async data implements:

| State | Treatment |
|---|---|
| **Loading** | Skeleton placeholders with shimmer — match exact shape of real content |
| **Empty** | Illustrated `EmptyState`: large icon/emoji + bold title + description + primary CTA + optional secondary CTA |
| **Error** | `ErrorState`: warning icon + message + "Try Again" button |
| **Submitting** | Button: spinner + disabled; form fields: disabled |
| **Success** | Toast notification slides in from right (4s, with progress bar) |

---

## Design System Quick Reference

| Token | Value | Usage |
|---|---|---|
| Primary | `#4F46E5` (Indigo) | Buttons, active states, links |
| Secondary | `#06B6D4` (Cyan) | Accents, highlights |
| Success | `#10B981` (Green) | Hired, completed, success |
| Warning | `#F59E0B` (Amber) | Interview, pending, deadlines |
| Danger | `#EF4444` (Red) | Rejected, cancelled, errors |
| Neutral bg | `#F9FAFB` / `#0A0A0A` | Page background |
| Card bg | `#FFFFFF` / `#111827` | Card backgrounds |
| Border | `#E5E7EB` / `#1F2937` | Subtle borders |
| Font | Inter (Google Fonts) | All typography |
| Radius | `rounded-2xl` (16px) | Cards, modals, buttons |
| Shadow | `0 1px 3px rgba(0,0,0,0.1)` | Default card shadow |

---

> ✅ **Document 8 of 10 — UI Pages (Final)**
> ⏳ **Awaiting your approval to proceed to Document 10: Route Structure**
