# 📄 Document 9 of 10 — Component Tree (Final)
> **TalentFlow** | Full-Stack Recruitment Management Platform

---

## Design Directive

> Every component is built to premium SaaS standard. Visual inspiration: **Linear, Vercel, Stripe Dashboard, Clerk, Notion, Framer**. Each component supports **dark mode**, has **Framer Motion** animation behavior, is **accessible by default**, and is built with **Tailwind CSS + CSS custom properties**. No generic admin dashboard aesthetics.

**Animation library:** Framer Motion
**Chart library:** Recharts
**Icon library:** React Icons
**Dark mode:** `class` strategy — `<html class="dark">`

---

## Component Architecture Overview

```
src/components/
│
├── layout/          # App shell, navigation, theme
├── common/          # Primitives + reusable patterns
├── jobs/            # Job-domain components
├── applications/    # Application pipeline components
├── candidates/      # Candidate profile components
├── interviews/      # Interview and feedback components
├── dashboard/       # Stats, charts, activity feeds
└── notifications/   # Notification panel and items
```

---

## 1. Layout Components

### `AppShell`
**File:** `components/layout/AppShell.jsx`
**Purpose:** Root wrapper for all authenticated pages. Composes Sidebar + Navbar + content area.

```jsx
Props:
  children: ReactNode
```

**Layout:**
```
┌─────────────────────────────────────────┐
│  Navbar (top, full width, sticky)       │
├──────────┬──────────────────────────────┤
│ Sidebar  │  <children />                │
│ (fixed)  │  (scrollable content area)   │
└──────────┴──────────────────────────────┘
```

**Dark mode:** Background `bg-neutral-50 dark:bg-neutral-950`
**Animation:** Content area fades in on route change (`motion.main opacity 0→1, y 8→0`)

---

### `Sidebar`
**File:** `components/layout/Sidebar.jsx`

```jsx
Props:
  role: 'recruiter' | 'hiring_manager' | 'candidate'
  isCollapsed: boolean
  onToggle: () => void
```

**Visual design (Vercel-inspired):**
- Width: `64px` collapsed / `240px` expanded — Framer Motion spring
- Nav items: Icon + label. Collapsed: icon only + tooltip on hover
- Active item: indigo left border accent + subtle background tint
- Bottom: User avatar + name + role badge + logout
- Resizable drag handle on right edge (V2)

**Mobile:** Drawer from left with backdrop overlay (`AnimatePresence`)

**Animation:**
```js
animate={{ width: isCollapsed ? 64 : 240 }}
transition={{ type: 'spring', stiffness: 300, damping: 30 }}
```

**Accessibility:** All nav items have `aria-label`, `aria-current="page"` on active item, keyboard navigable

---

### `Navbar`
**File:** `components/layout/Navbar.jsx`

**Sections:**
- Left: Page title / breadcrumb
- Center: `SearchInput` (triggers `CommandPalette` on click / `Ctrl+K`)
- Right: `ThemeToggle` · `NotificationBell` · `UserMenu`

**Design:** Frosted glass on scroll (`backdrop-blur-md bg-white/80 dark:bg-neutral-950/80`), subtle bottom border

---

### `ThemeProvider`
**File:** `components/layout/ThemeProvider.jsx`
**Purpose:** Manages and persists theme state. Wraps entire application.

```jsx
// ThemeContext.jsx
const ThemeContext = createContext({
  theme: 'system',           // 'light' | 'dark' | 'system'
  resolvedTheme: 'light',    // actual applied theme
  setTheme: () => {}
});

// Usage
const { theme, setTheme, resolvedTheme } = useTheme();
```

**Behaviour:**
- Reads from `localStorage.getItem('tf-theme')` on mount
- Applies `dark` class to `<html>` element when theme resolves to dark
- `system` reads `prefers-color-scheme` media query
- Persists selection to `localStorage`

**Hierarchy:**
```
ThemeProvider (app root)
  └── ThemeContext.Provider
        └── App → ... → ThemeToggle (consumer)
```

---

### `ThemeToggle`
**File:** `components/layout/ThemeToggle.jsx`

```jsx
Props: none  // reads/writes ThemeContext
```

**Visual:** Icon button cycling `☀️ Light → 🌙 Dark → 💻 System` with smooth rotation animation.
**Accessibility:** `aria-label="Toggle theme"`, keyboard activatable

---

### `CommandPalette`
**File:** `components/layout/CommandPalette.jsx`

```jsx
Props:
  isOpen: boolean
  onClose: () => void
```

**Trigger:** `Ctrl+K` (global `keydown` listener) or click on `SearchInput` in Navbar

**Features:**
- Instant search: Jobs · Candidates · Pages
- Results grouped by category with keyboard navigation (↑↓ + Enter)
- Recent searches (persisted to `localStorage`)
- Esc to close

**Animation:**
```js
initial={{ opacity: 0, scale: 0.95 }}
animate={{ opacity: 1, scale: 1 }}
exit={{ opacity: 0, scale: 0.95 }}
transition={{ duration: 0.15 }}
```

**Accessibility:** `role="dialog"`, `aria-modal="true"`, focus trap inside modal, focus returns to trigger on close

---

### `ProtectedRoute`
**File:** `components/layout/ProtectedRoute.jsx`

```jsx
Props:
  allowedRoles: string[]
  children: ReactNode
```

No token → `/login`. Wrong role → `/unauthorized`. Correct role → renders children.

---

## 2. Common / UI Primitives

### `Button`
**File:** `components/common/Button.jsx`

```jsx
Props:
  variant: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  disabled?: boolean
  onClick?: () => void
  children: ReactNode
```

**Animation:** `whileHover={{ scale: 1.02 }}` `whileTap={{ scale: 0.98 }}`
**Accessibility:** `disabled` attribute when `isLoading`, `aria-busy="true"` during loading, visible focus ring (`focus-visible:ring-2 focus-visible:ring-primary`)

---

### `Input`
**File:** `components/common/Input.jsx`

```jsx
Props:
  label: string
  type?: string
  placeholder?: string
  value: string
  onChange: (e) => void
  error?: string
  helperText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  disabled?: boolean
  required?: boolean
```

**Design:** Floating label animation on focus. Red border + error message on validation fail.
**Accessibility:** `<label>` associated via `htmlFor`/`id`, `aria-describedby` for error + helper text, `aria-invalid="true"` on error

---

### `SearchInput`
**File:** `components/common/SearchInput.jsx`
**Purpose:** Dedicated search field reused across Jobs, Candidates, Applications, and Notifications pages.

```jsx
Props:
  placeholder?: string           // defaults to "Search..."
  value: string
  onChange: (value: string) => void
  onClear?: () => void
  isLoading?: boolean            // shows spinner while searching
  debounceMs?: number            // debounce delay (default: 300ms)
```

**Design:**
- Search icon (left, muted)
- Clear × button (right, appears when value non-empty, click clears + calls `onClear`)
- Spinner replaces search icon when `isLoading=true`
- Rounded-full pill shape
- Subtle inner shadow on focus

**Behaviour:** Built-in debounce via `useEffect` + `setTimeout`. Parent receives debounced value.

**Accessibility:** `role="searchbox"`, `aria-label` from placeholder, `Esc` key clears the field

---

### `Badge`
**File:** `components/common/Badge.jsx`

```jsx
Props:
  label: string
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple'
  size?: 'sm' | 'md'
  dot?: boolean
```

**Status → variant mapping:**
```
applied       → info      hired         → success
under_review  → neutral   rejected      → danger
shortlisted   → purple    withdrawn     → neutral
interview     → warning   published     → success
offer         → warning   draft         → neutral
scheduled     → info      closed        → danger
completed     → success   archived      → neutral
cancelled     → danger
```

---

### `Modal`
**File:** `components/common/Modal.jsx`

```jsx
Props:
  isOpen: boolean
  onClose: () => void
  title: string
  size?: 'sm' | 'md' | 'lg' | 'full'
  children: ReactNode
  footer?: ReactNode
```

**Animation:** Backdrop fade + panel spring from bottom
**Mobile:** Renders as bottom sheet (`fixed bottom-0 rounded-t-3xl`)
**Accessibility:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby` (title id), focus trap, Esc closes, focus returns to trigger on close

---

### `ConfirmDialog`
**File:** `components/common/ConfirmDialog.jsx`
**Purpose:** Dedicated confirmation modal for destructive actions. Replaces ad-hoc `Modal` usage for Delete, Archive, Reject, Withdraw, and Logout.

```jsx
Props:
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  title: string
  description: string
  confirmLabel?: string          // default: "Confirm"
  cancelLabel?: string           // default: "Cancel"
  variant?: 'danger' | 'warning' // controls confirm button color
  isLoading?: boolean
```

**Usage examples:**
```jsx
// Withdraw application
<ConfirmDialog
  isOpen={showWithdraw}
  title="Withdraw Application?"
  description="This will remove your application from consideration. This cannot be undone."
  confirmLabel="Withdraw"
  variant="danger"
  onConfirm={handleWithdraw}
/>

// Archive job
<ConfirmDialog
  isOpen={showArchive}
  title="Archive Job Posting?"
  description="The job will be hidden from all views. You can recover it later."
  confirmLabel="Archive"
  variant="warning"
  onConfirm={handleArchive}
/>
```

**Design:** Compact modal (sm size). Warning/danger icon at top. Description muted. Confirm button takes `variant` color.
**Accessibility:** Focus lands on Cancel button by default (safer default for destructive actions)

---

### `PageHeader`
**File:** `components/common/PageHeader.jsx`
**Purpose:** Consistent page title + description + action buttons. Used on every authenticated page.

```jsx
Props:
  title: string
  description?: string
  badge?: ReactNode          // optional count or status badge
  actions?: ReactNode        // right-aligned buttons/controls
  breadcrumb?: Array<{ label: string, href?: string }>
```

**Usage examples:**
```jsx
// Recruiter Jobs page
<PageHeader
  title="Job Postings"
  description="Manage your open roles and track applications."
  badge={<Badge label="8 active" variant="success" />}
  actions={<Button variant="primary" leftIcon={<PlusIcon />}>Create Job</Button>}
/>

// Candidate Applications page
<PageHeader
  title="My Applications"
  breadcrumb={[{ label: 'Dashboard', href: '/candidate/dashboard' }, { label: 'Applications' }]}
/>
```

**Design:** Title (H1, bold), description (muted, sm), actions right-aligned. Breadcrumb above title if provided. Bottom border divider. Consistent spacing across all pages.

---

### `DataTable`
**File:** `components/common/DataTable.jsx`
**Purpose:** Reusable premium table used by Recruiter, HM, and Candidate pages. Replaces per-page table implementations.

```jsx
Props:
  columns: Array<{
    key: string
    header: string
    render?: (row) => ReactNode   // custom cell renderer
    sortable?: boolean
    width?: string
  }>
  data: Array<Record<string, any>>
  isLoading?: boolean
  emptyState?: ReactNode          // custom EmptyState component
  onRowClick?: (row) => void      // makes rows clickable
  pagination?: {
    currentPage: number
    totalPages: number
    total: number
    limit: number
    onPageChange: (page: number) => void
  }
  toolbar?: ReactNode             // slot for TableToolbar
  rowSelection?: {
    enabled: boolean
    selectedIds: string[]
    onSelectionChange: (ids: string[]) => void
  }
  stickyHeader?: boolean          // default: true
```

**Features:**
- **Sticky header** — blurred backdrop on scroll
- **Sortable columns** — click header to sort asc/desc, animated sort icon
- **Row hover** — subtle tint + cursor pointer (if `onRowClick`)
- **Row selection** — checkbox per row + select-all checkbox in header
- **Loading state** — skeleton rows (5 by default), shimmer animation
- **Empty state** — renders `emptyState` prop or default `EmptyState`
- **Responsive** — horizontal scroll on `sm`/`md`, condensed columns
- **Rounded corners** — first and last visible rows get rounded corners

**Accessibility:** `<table>` with `role="grid"`, `aria-sort` on sortable headers, `aria-selected` on rows, keyboard navigation between rows (↑↓), Enter to activate `onRowClick`

---

### `TableToolbar`
**File:** `components/common/TableToolbar.jsx`
**Purpose:** Reusable search + filter + sort toolbar. Used above `DataTable` on all recruiter and HM pages.

```jsx
Props:
  searchProps?: {
    value: string
    onChange: (value: string) => void
    placeholder?: string
  }
  filters?: Array<{
    key: string
    label: string
    options: Array<{ label: string, value: string }>
    value: string
    onChange: (value: string) => void
  }>
  sortProps?: {
    value: string
    options: Array<{ label: string, value: string }>
    onChange: (value: string) => void
  }
  onExport?: () => void          // shows export button if provided
  onClearAll?: () => void        // "Clear filters" link
  activeFilterCount?: number     // badge on filter button
  rightSlot?: ReactNode          // extra controls (e.g. view toggle)
```

**Usage example:**
```jsx
// Job Pipeline page
<TableToolbar
  searchProps={{ value: search, onChange: setSearch, placeholder: "Search by name or email..." }}
  filters={[{ key: 'status', label: 'Stage', options: APPLICATION_STATUSES, value: status, onChange: setStatus }]}
  sortProps={{ value: sort, options: SORT_OPTIONS, onChange: setSort }}
  onClearAll={handleClearAll}
  activeFilterCount={activeFilters}
/>
```

**Design:** Horizontal bar, `SearchInput` left, filter dropdowns center, sort + export right. On mobile: collapses to `SearchInput` + "Filters" button (opens filter drawer).

---

### `LoadingOverlay`
**File:** `components/common/LoadingOverlay.jsx`
**Purpose:** Full-screen or container-level loading overlay for page-level async operations.

```jsx
Props:
  isVisible: boolean
  message?: string               // e.g. "Saving your profile..."
  blur?: boolean                 // blurs background content (default: true)
```

**Usage:**
- Initial auth check on app load
- Profile save / resume upload
- Submission of long-running forms

**Design:**
- Backdrop: `backdrop-blur-sm bg-white/60 dark:bg-neutral-950/60`
- Center: `Spinner` (lg) + optional message below
- Layered above all content via `fixed inset-0 z-50`

**Animation:** Fade in/out with `AnimatePresence`

---

### `EmptyState`
**File:** `components/common/EmptyState.jsx`

```jsx
Props:
  icon: ReactNode
  title: string
  description: string
  primaryAction?: { label: string, onClick: () => void }
  secondaryAction?: { label: string, onClick: () => void }
```

---

### `ErrorState`
**File:** `components/common/ErrorState.jsx`

```jsx
Props:
  message?: string
  onRetry?: () => void
```

---

### `Skeleton`
**File:** `components/common/Skeleton.jsx`

```jsx
Props:
  width?: string
  height?: string
  className?: string
  variant?: 'text' | 'card' | 'avatar' | 'stat' | 'table-row'
```

Animated shimmer gradient. Matches exact shape of real content.

---

### `Toast`
**File:** `components/common/Toast.jsx`
Global portal-mounted toast. `useToast()` hook. Slides from right, stacks vertically, auto-dismiss with progress bar.

---

### `Pagination`
**File:** `components/common/Pagination.jsx`

```jsx
Props:
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  total: number
  limit: number
```

Shows: `"Showing 11–20 of 84 results"`. Ellipsis for large ranges.
**Accessibility:** `aria-label="Pagination"`, `aria-current="page"` on current page button

---

### `Avatar`
**File:** `components/common/Avatar.jsx`

```jsx
Props:
  name: string
  src?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  online?: boolean
```

---

### `Spinner`
**File:** `components/common/Spinner.jsx`
SVG spinner, brand indigo color, smooth rotation.

---

### `Divider`
**File:** `components/common/Divider.jsx`
Horizontal rule with optional centered label.

---

## 3. Job Components

### `JobCard`
**File:** `components/jobs/JobCard.jsx`

```jsx
Props:
  job: { _id, title, department, location, jobType, isRemote,
         salaryMin, salaryMax, applicationDeadline,
         applicationCount, company: { name, logoUrl }, createdAt }
  onSave?: () => void
  isSaved?: boolean
  showSaveButton?: boolean
```

**Design:** `rounded-2xl`, `shadow-card`, hover `translateY(-3px)` spring. Deadline warning badge if < 7 days.
**Accessibility:** `article` element, bookmark button has `aria-label="Save job: {title}"`, `aria-pressed={isSaved}`

---

### `JobFilters`
**File:** `components/jobs/JobFilters.jsx`
Horizontal pill-filter bar. Active filters fill. "Clear all" link. Collapses to "Filters" button on mobile.

---

### `JobForm`
**File:** `components/jobs/JobForm.jsx`
Two-column form + live preview card. Section headers with dividers.

---

### `JobStatusBadge`
**File:** `components/jobs/JobStatusBadge.jsx`
Thin wrapper around `Badge` with job-specific color mapping.

---

## 4. Application Components

### `ApplicationCard`
**File:** `components/applications/ApplicationCard.jsx`
Horizontal card. Status badge right. Full card clickable. Hover: tint + arrow appears.

---

### `ApplicationRow`
**File:** `components/applications/ApplicationRow.jsx`
Used inside `DataTable` as a custom row renderer. Avatar + Name/Headline · Status badge · Date · Actions (appear on hover).

---

### `StatusDropdown`
**File:** `components/applications/StatusDropdown.jsx`
Custom dropdown. Current status as badge. Valid next stages only. Invalid stages greyed out. Animated open/close.
**Accessibility:** `role="listbox"`, `aria-expanded`, keyboard navigable options

---

### `StatusTimeline`
**File:** `components/applications/StatusTimeline.jsx`

```jsx
Props:
  history: Array<{ status, changedAt, changedBy: { name } }>
  currentStatus: string
```

**Design (GitHub Actions-inspired):**
- Vertical connecting line
- Completed: ✅ filled green + date + actor name
- Current: 🔵 pulsing ring
- Future: ○ muted
- Staggered entrance animation

**Accessibility:** `role="list"`, each item `role="listitem"` with `aria-label` describing the stage and date

---

## 5. Candidate Components

### `CandidateProfile`
**File:** `components/candidates/CandidateProfile.jsx`

```jsx
Props:
  candidate: User
  application: Application
  mode: 'recruiter' | 'hiring_manager'
```

Recruiter mode: includes `RecruiterNotesForm`. HM mode: `RecruiterNotesForm` not rendered, not imported.

---

### `RecruiterNotesForm`
**File:** `components/candidates/RecruiterNotesForm.jsx`
Private textarea. Autosave debounced 1.5s. "Saved ✓" indicator. Lock icon header. **Never rendered outside recruiter context.**

---

### `ResumeViewer`
**File:** `components/candidates/ResumeViewer.jsx`
File card: icon + filename + date + "Download" button. Opens in new tab or triggers download.

---

## 6. Interview & Feedback Components

### `InterviewForm`
**File:** `components/interviews/InterviewForm.jsx`
Date picker + time + format select + location + interviewer select + `candidateInstructions`. Rendered inside `Modal`.

---

### `InterviewCard`
**File:** `components/interviews/InterviewCard.jsx`
Card: candidate + job + date/time + format chip + interviewer + `InterviewStatusBadge` + action buttons.

---

### `InterviewStatusBadge`
**File:** `components/interviews/InterviewStatusBadge.jsx`
Wrapper around `Badge` for interview status.

---

### `FeedbackForm`
**File:** `components/interviews/FeedbackForm.jsx`
Interactive star ratings (4 categories) + comments textarea + recommendation pill toggle + decision reason. Elegant card layout.
**Accessibility:** Stars are radio inputs (`role="radio"` group), keyboard navigable

---

### `FeedbackCard`
**File:** `components/interviews/FeedbackCard.jsx`
Display submitted scorecard. Filled stars + recommendation pill + comments + decision reason. Optional "Edit" link.

---

## 7. Dashboard Components

### `StatCard`
**File:** `components/dashboard/StatCard.jsx`

```jsx
Props:
  label: string
  value: number | string
  icon: ReactNode
  trend?: { value: number, direction: 'up' | 'down', label: string }
  color?: 'indigo' | 'cyan' | 'green' | 'amber'
  isLoading?: boolean
```

**Design:** Glassmorphism on dashboard widgets. Count-up animation. Trend indicator (`↑ 14%`). Icon in colored square.

---

### `MetricCard`
**File:** `components/dashboard/MetricCard.jsx`
**Purpose:** Extended stat card with mini sparkline graph. Used for pipeline, trend, and analytics views.

```jsx
Props:
  label: string
  value: number | string
  previousValue?: number         // for % change calculation
  sparklineData?: number[]       // mini chart data points
  icon: ReactNode
  color?: string
  unit?: string                  // "%" | "$" | "days"
  isLoading?: boolean
```

**Design:**
- Same card shell as `StatCard`
- Bottom section: 40px tall mini sparkline (Recharts `LineChart`, no axes, no tooltip)
- Automatically calculates `% change` from `value` vs `previousValue`
- Sparkline color matches card `color` prop

**Accessibility:** `aria-label` describing the metric and current value

---

### `PipelineChart`
**File:** `components/dashboard/PipelineChart.jsx`

```jsx
Props:
  data: Record<ApplicationStatus, number>
```

- **Animated donut chart** (Recharts `PieChart`), center label: total
- **Animated funnel bars**: stage → count → animated width fill on mount
- Color-coded matching `Badge` variant colors

---

### `TrendGraph`
**File:** `components/dashboard/TrendGraph.jsx`

```jsx
Props:
  data: Array<{ month: string, applications: number, hired: number }>
```

Recharts `AreaChart`. Two areas (indigo + green). Gradient fill. Smooth curve. Responsive.

---

### `RecentActivity`
**File:** `components/dashboard/RecentActivity.jsx`
Timeline feed. Avatar + event + relative time. Staggered entrance animation.

---

## 8. Notification Components

### `NotificationBell`
**File:** `components/notifications/NotificationBell.jsx`
Bell icon. Unread count badge (pulsing). Click opens `NotificationPanel`.
**Accessibility:** `aria-label="Notifications, X unread"`, `aria-haspopup="true"`, `aria-expanded` state

---

### `NotificationPanel`
**File:** `components/notifications/NotificationPanel.jsx`
Dropdown panel. Grouped (Today / Earlier). Scroll. "Mark all read" header link. "View All" footer link.
**Accessibility:** `role="menu"`, focus trap when open, Esc closes

---

### `NotificationItem`
**File:** `components/notifications/NotificationItem.jsx`
Icon circle + message + timestamp + unread dot. Hover tint. Click: mark read + navigate.
**Accessibility:** `role="menuitem"`, `aria-label` with full message text

---

## 9. Page-Level Component Composition

### Public: Job Board
```
JobBoardPage
  ├── Navbar (public)
  ├── PageHeader (title + result count)
  ├── TableToolbar (search + filters + sort)
  ├── [loading] → Skeleton cards × 6
  ├── [empty]   → EmptyState
  ├── [error]   → ErrorState
  ├── JobCard × N (grid)
  ├── Pagination
  └── Footer
```

### Recruiter: Job Pipeline
```
JobPipelinePage
  ├── AppShell
  └── main
      ├── PageHeader (job title + status + "Edit Job" action)
      ├── TableToolbar (search + status filter + sort)
      ├── DataTable
      │     ├── [loading] → skeleton rows
      │     ├── [empty]   → EmptyState
      │     └── ApplicationRow × N
      ├── Pagination (inside DataTable)
      └── Modal → InterviewForm
```

### Candidate: Application Detail
```
ApplicationDetailPage
  ├── AppShell
  └── main
      ├── PageHeader (job title + breadcrumb)
      ├── StatusBadge (large)
      ├── StatusTimeline
      ├── InterviewCard (conditional)
      ├── CoverNoteCard (collapsible)
      └── ConfirmDialog (withdraw — triggered by danger Button)
```

---

## 10. Animation System Summary

| Animation | Component | Behavior |
|---|---|---|
| Page transition | `AppShell` | Fade + slide up (0.2s) on route change |
| Sidebar collapse | `Sidebar` | Spring width (stiffness 300, damping 30) |
| Drawer open (mobile) | `Sidebar` | Slide from left + backdrop fade |
| Command palette | `CommandPalette` | Scale 0.95→1 + fade (0.15s) |
| Modal open/close | `Modal` | Spring from bottom (y 20→0) |
| Bottom sheet (mobile) | `Modal` | Slide up from `bottom-0` |
| Notification panel | `NotificationPanel` | Scale 0.95 + y -8 dropdown |
| Card hover | `JobCard`, `StatCard`, `MetricCard` | `translateY(-3px)` spring |
| Button press | `Button` | `scale(0.98)` tap |
| Stat counter | `StatCard`, `MetricCard` | Count-up from 0 on mount |
| Timeline entrance | `StatusTimeline` | Staggered fade-in per node (0.08s delay) |
| Skeleton shimmer | `Skeleton` | Gradient sweep left→right |
| Toast slide | `Toast` | Slide from right, stack vertically |
| Notification bell | `NotificationBell` | Shake + badge scale pulse on new notification |
| Table rows | `DataTable` | Stagger fade-in on data load |
| Chart bars/donut | `PipelineChart`, `TrendGraph` | Animate on mount (Recharts `isAnimationActive`) |
| Empty state | `EmptyState` | Fade + scale up on mount |
| Loading overlay | `LoadingOverlay` | Fade in/out with `AnimatePresence` |
| Accordion | FAQ on Landing | Height animate with `motion.div` + `overflow-hidden` |

---

## 11. Accessibility Standards

> **Every interactive component must be accessible.** Interviewers and users notice.

### Keyboard Navigation
- All interactive elements reachable via `Tab` key
- Logical tab order matches visual reading order
- `Shift+Tab` moves backward
- `Esc` closes all modals, dialogs, dropdowns, and command palette
- `Enter` / `Space` activate buttons and links
- Arrow keys navigate `DataTable` rows, `StatusDropdown` options, and `NotificationPanel` items
- `Ctrl+K` opens `CommandPalette` from anywhere

### ARIA Labels
| Component | ARIA Usage |
|---|---|
| `Button` (icon-only) | `aria-label="..."` |
| `SearchInput` | `role="searchbox"`, `aria-label` |
| `Modal` | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| `ConfirmDialog` | Same as Modal + `aria-describedby` for description |
| `NotificationBell` | `aria-label="Notifications, 3 unread"`, `aria-haspopup` |
| `NotificationPanel` | `role="menu"`, `aria-label` |
| `StatusTimeline` | `role="list"`, items `role="listitem"` |
| `DataTable` | `role="grid"`, `aria-sort` on headers, `aria-selected` on rows |
| `ThemeToggle` | `aria-label="Toggle theme"` |
| `Sidebar` nav items | `aria-current="page"` on active |
| `FeedbackForm` stars | `role="radiogroup"` + `role="radio"` |
| `Pagination` | `aria-label="Pagination"`, `aria-current="page"` |

### Focus Management
- **Visible focus rings** on all interactive elements: `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`
- **Focus trap** inside all modals and dialogs
- **Focus return** — when modal closes, focus returns to the element that opened it
- **Skip link** — `"Skip to main content"` at top of page (visually hidden, visible on focus)

### Color Contrast
- All text meets WCAG AA minimum (4.5:1 for normal text, 3:1 for large text)
- Status badges use text + background combinations that pass contrast checks in both light and dark mode
- Never rely on color alone to convey meaning — always pair with text label or icon

### Screen Reader Support
- Meaningful `alt` text on all images and icons
- `aria-live="polite"` on toast notifications and status updates
- `aria-busy="true"` on loading states
- Form errors announced via `aria-describedby` linking input to error message

---

## 12. Responsive Breakpoints

TalentFlow uses Tailwind's default breakpoint system consistently across all components:

| Breakpoint | Min Width | Target Devices | Alias |
|---|---|---|---|
| (default) | 0px | Mobile portrait | `xs` (implicit) |
| `sm` | 640px | Mobile landscape, small tablet | small |
| `md` | 768px | Tablet portrait | medium |
| `lg` | 1024px | Tablet landscape, small laptop | large |
| `xl` | 1280px | Desktop | extra-large |
| `2xl` | 1536px | Wide desktop | 2x extra-large |

### Layout Breakpoint Behaviour

| Element | Default (0px) | `sm` (640px) | `md` (768px) | `lg` (1024px) | `xl`+ |
|---|---|---|---|---|---|
| Sidebar | Hidden | Hidden | Hidden | Fixed left (collapsed) | Fixed left (expanded) |
| Bottom nav | Visible | Visible | Hidden | Hidden | Hidden |
| Job grid | 1 column | 1 column | 2 columns | 3 columns | 3 columns |
| Dashboard stats | 1 column | 2 columns | 2 columns | 4 columns | 4 columns |
| Forms | 1 column | 1 column | 2 columns | 2 columns | 2 columns |
| DataTable | Scroll | Scroll | Full | Full | Full |
| Modal | Bottom sheet | Bottom sheet | Centered | Centered | Centered |
| Navbar | Hamburger + logo | Hamburger + logo | Full | Full | Full |

### Component-level Breakpoint Examples
```jsx
// Job grid
<div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

// Dashboard stats
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

// Form layout
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">

// Sidebar width
<aside className="hidden lg:flex lg:w-16 xl:w-60 flex-col">

// Bottom nav (mobile only)
<nav className="fixed bottom-0 left-0 right-0 lg:hidden">
```

---

## 13. Dark Mode Implementation

**Strategy:** Tailwind `class` strategy — `dark` class on `<html>` managed by `ThemeProvider`.

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        // ... extend with CSS custom properties
      }
    }
  }
}
```

**Pattern per component:**
```jsx
<div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100">
```

**CSS custom properties update in dark mode:**
```css
.dark {
  --color-neutral-50:  #0A0A0A;
  --color-neutral-900: #F9FAFB;
  --shadow-card: 0 1px 3px rgba(0,0,0,0.4);
}
```

---

> ✅ **Document 9 of 10 — Component Tree (Final)**
> ⏳ **Awaiting your approval to proceed to Document 10: Route Structure**
