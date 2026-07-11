# 📄 Document 7 of 10 — Tech Stack (Final)
> **TalentFlow** | Full-Stack Recruitment Management Platform

---

## Overview

Every technology in TalentFlow was chosen for a specific reason. This document defines the full stack, version targets, rationale, configuration patterns, and design decisions. Nothing is included "just because it's popular" — every tool earns its place.

---

## 1. Backend

### Runtime & Framework

| Technology | Version | Role |
|---|---|---|
| **Node.js** | 20 LTS | JavaScript runtime |
| **Express.js** | 4.x | HTTP server + routing framework |

**Why Express?**
- Minimal and unopinionated — structure is explicit, not magic
- Enormous ecosystem; every needed middleware exists
- Easy to explain in a portfolio/interview context
- Scales to production with proper layering (Document 6 architecture)

---

### Database

| Technology | Version | Role |
|---|---|---|
| **MongoDB** | 7.x | Primary NoSQL database |
| **Mongoose** | 8.x | ODM — schema definition, validation, middleware |

**Why MongoDB + Mongoose?**
- Schema flexibility suits a recruitment platform where fields evolve
- Mongoose adds type safety, validation, and middleware hooks
- Native JSON fit for a JavaScript stack — no ORM translation layer
- Atlas free tier available for deployment

---

### Authentication & Security

| Technology | Version | Role |
|---|---|---|
| **jsonwebtoken** | 9.x | JWT generation and verification |
| **bcryptjs** | 2.x | Password hashing |
| **helmet** | 7.x | Secure HTTP headers |
| **cors** | 2.x | Cross-Origin Resource Sharing |
| **express-rate-limit** | 7.x | Brute-force protection on auth routes |

**Why JWT (not sessions)?**
- Stateless — no server-side session store needed
- Works identically for browser clients and future mobile/API clients
- Simple to implement and explain

**Why bcryptjs (not bcrypt)?**
- Pure JavaScript — no native bindings, no build issues on any OS
- Identical API to `bcrypt`; negligible performance difference for auth use case

---

### Validation

| Technology | Version | Role |
|---|---|---|
| **express-validator** | 7.x | Request body / param / query validation |

**Why express-validator?**
- First-class Express integration — middleware-based, no boilerplate
- Chainable rules: `.isEmail()`, `.isLength()`, `.notEmpty()`, `.matches()`
- Error array format matches the API's `errors[]` response shape exactly

---

### File Handling

| Technology | Version | Role |
|---|---|---|
| **Multer** | 1.x | Multipart form handling + file upload |

**Configuration:**
- Storage: `diskStorage` → `uploads/resumes/` (local, V1)
- `fileFilter`: rejects non-PDF / non-DOCX → `INVALID_FILE_TYPE`
- `limits.fileSize`: 5MB → `FILE_TOO_LARGE`
- V2: storage engine swapped to `multer-storage-cloudinary`

---

### Environment & Validation

| Technology | Version | Role |
|---|---|---|
| **dotenv** | 16.x | `.env` file loader |
| **envalid** | 8.x | Environment variable validation at startup |

**Why envalid?**
- Validates all required env vars on startup — app refuses to start if any are missing or malformed
- Provides type coercion: `str()`, `num()`, `bool()`, `url()`
- Prevents the classic "works locally, broken in prod" env var bug

```js
// src/config/env.js
import { cleanEnv, str, num, url } from 'envalid';

export const env = cleanEnv(process.env, {
  PORT:           num({ default: 5000 }),
  MONGO_URI:      str(),
  JWT_SECRET:     str(),
  JWT_EXPIRES_IN: str({ default: '7d' }),
  CLIENT_URL:     url(),
  NODE_ENV:       str({ choices: ['development', 'production', 'test'] }),
});

// Usage throughout backend: import { env } from '../config/env.js'
```

---

### Middleware & Utilities

| Technology | Version | Role |
|---|---|---|
| **morgan** | 1.x | HTTP request logger (development) |
| **compression** | 1.x | Gzip response compression |

---

### API Documentation

| Tool | Phase | Role |
|---|---|---|
| **Postman Collection** | V1 | Shared collection exported and versioned in `/docs` |
| **Bruno Collection** | V1 | Open-source alternative to Postman; file-based, Git-friendly |
| **Swagger / OpenAPI** | V2 | Auto-generated interactive docs from route definitions |

**V1 approach:** A Postman/Bruno collection covering all 44 endpoints is committed to the repository under `/docs/api-collection/`. This makes it easy for any team member to test the API immediately.

**V2:** `swagger-jsdoc` + `swagger-ui-express` auto-generates OpenAPI 3.0 docs from JSDoc comments directly above each route.

---

### Backend Install Commands

```bash
# Production dependencies
npm install express mongoose jsonwebtoken bcryptjs \
  helmet cors express-rate-limit express-validator \
  multer morgan compression dotenv envalid

# Dev dependencies
npm install -D nodemon eslint prettier eslint-config-prettier
```

**`package.json` scripts:**
```json
{
  "scripts": {
    "dev":   "nodemon src/server.js",
    "start": "node src/server.js"
  }
}
```

---

## 2. Frontend

### Framework & Build Tool

| Technology | Version | Role |
|---|---|---|
| **React** | 18.x | UI component library |
| **Vite** | 5.x | Build tool + dev server |

**Why React?** Industry standard for portfolio projects. Component model maps cleanly to the role-based UI. Hooks-based state management is interview-friendly.

**Why Vite over CRA?** Dramatically faster dev server (native ESM). CRA is deprecated; Vite is the current community standard.

---

### Routing

| Technology | Version | Role |
|---|---|---|
| **React Router v6** | 6.x | Client-side routing, nested layouts, protected routes |

Key patterns: `<Outlet />` for nested layouts, `useSearchParams` for URL-driven filters, `useNavigate`, `useParams`, `useLocation`.

---

### State Management

| Technology | Version | Role |
|---|---|---|
| **React Context API** | Built-in | Global state (auth, notifications, theme) |
| **TanStack Query (React Query)** | 5.x | Server state — fetching, caching, loading, error, refetch |

**What lives in Context:**
- `AuthContext` — user object, token, login/logout
- `NotificationContext` — unread count, notification list
- `ThemeContext` — current theme (light/dark/system)

**What React Query handles (everything else):**

```js
// Before React Query (manual, verbose):
const [jobs, setJobs] = useState([]);
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => {
  setIsLoading(true);
  fetchJobs()
    .then(setJobs)
    .catch(setError)
    .finally(() => setIsLoading(false));
}, []);

// ─────────────────────────────────────────────────────────

// With React Query (modern, clean):
const { data: jobs, isLoading, error } = useQuery({
  queryKey: ['jobs', { department, status, page }],
  queryFn:  () => getJobs({ department, status, page }),
  staleTime: 1000 * 60 * 5,  // cache for 5 minutes
});
```

**Why React Query in V1 (not V2)?**
- Eliminates 80% of `useEffect` + `useState` boilerplate across 19 pages
- Built-in loading, error, retry, background refetch — for free
- Query key invalidation: update a job → pipeline auto-refreshes
- 80–90% of modern React companies use it
- Teaches a pattern that's immediately applicable in a job

**React Query setup:**
```js
// main.jsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,   // 2 min default
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Wrap App:
<QueryClientProvider client={queryClient}>
  <App />
</QueryClientProvider>
```

---

### HTTP Client

| Technology | Version | Role |
|---|---|---|
| **Axios** | 1.x | HTTP requests — works as the `queryFn` source for React Query |

**`src/services/api.js`:**
```js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,  // /api/v1
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('tf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('tf_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

---

### Forms & Validation

| Technology | Version | Role |
|---|---|---|
| **react-hook-form** | 7.x | Form state management |
| **zod** | 3.x | Schema-based validation |
| **@hookform/resolvers** | 3.x | Connects Zod schemas to react-hook-form |

**Pattern:**
```js
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const jobSchema = z.object({
  title:      z.string().min(3, 'Title must be at least 3 characters'),
  department: z.enum(['Engineering', 'Design', 'Marketing', 'Sales', 'HR', 'Finance']),
  salaryMin:  z.number().positive('Must be a positive number'),
  salaryMax:  z.number().positive(),
}).refine(d => d.salaryMax >= d.salaryMin, {
  message: 'Max salary must be ≥ min salary',
  path: ['salaryMax'],
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(jobSchema),
});
```

---

### Styling

| Technology | Version | Role |
|---|---|---|
| **Tailwind CSS** | 3.x | Utility-first CSS framework |
| **CSS Custom Properties** | — | Brand tokens — colors, radius, shadows, font scale |
| **@tailwindcss/forms** | 0.5.x | Beautiful default form styles for all inputs |
| **@tailwindcss/typography** | 0.5.x | Rich text rendering (job descriptions) |
| **@tailwindcss/container-queries** | 0.1.x | Component-level responsive design |
| **Google Fonts (Inter)** | — | Primary typeface |

**Why Tailwind?**
- Industry standard in 80–90% of React workplaces
- Purpose-built for TalentFlow's components: dashboards, cards, tables, badges, forms
- JIT compiler ships zero dead CSS in production

**Why CSS custom properties alongside Tailwind?**
- Centralizes brand identity — one change propagates everywhere
- Enables dark mode toggling without touching component files

**Tailwind config:**
```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),
  ],
};
```

**CSS tokens:**
```css
/* src/styles/variables.css */
:root {
  --color-primary:      #4F46E5;
  --color-primary-dark: #4338CA;
  --color-secondary:    #06B6D4;
  --color-success:      #10B981;
  --color-warning:      #F59E0B;
  --color-danger:       #EF4444;
  --font-sans:          'Inter', sans-serif;
  --radius-md:          0.5rem;
  --radius-lg:          0.75rem;
  --shadow-card:        0 1px 3px rgba(0,0,0,0.1);
}
.dark {
  --shadow-card: 0 1px 3px rgba(0,0,0,0.4);
}
```

---

### Theme Management

| Approach | Implementation |
|---|---|
| **ThemeContext** | Context API + `localStorage` + `prefers-color-scheme` |

```js
// ThemeContext — Light / Dark / System
// 1. Reads localStorage on mount
// 2. Falls back to prefers-color-scheme for 'system'
// 3. Applies 'dark' class to <html>
// 4. Persists selection to localStorage

const getResolvedTheme = (theme) => {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark' : 'light';
  }
  return theme;
};
```

**Why not `next-themes`?** `next-themes` is Next.js-specific. For Vite, the custom `ThemeProvider` (Context + localStorage + media query) is the correct pattern — identical behavior, zero extra dependency.

---

### Icons

| Technology | Priority | Role |
|---|---|---|
| **Lucide React** | **Primary** | Modern, consistent icon set used by Vercel, Clerk, Trigger.dev |
| **React Icons** | Fallback | Used only when a specific icon isn't available in Lucide |

**Why Lucide as primary?**
- Clean, consistent 24px stroke design
- Tree-shakeable — only imported icons are bundled
- Used by Linear, Vercel, Clerk, Dub.co, Better Auth — the exact SaaS products TalentFlow is inspired by
- `react-icons` is a large bundle; Lucide is purpose-designed for modern React

```jsx
// Preferred — Lucide
import { Briefcase, Bell, User, Search, ChevronRight } from 'lucide-react';

// Fallback — React Icons (only if Lucide doesn't have the icon)
import { SiLinkedin, SiGithub } from 'react-icons/si';
```

---

### Notifications

| Technology | Version | Role |
|---|---|---|
| **react-hot-toast** | 2.x | Production-grade toast notifications |

**Why react-hot-toast over a custom Toast component?**
- Handles stacking, z-index, dismiss, and accessibility out of the box
- 1.9kB gzipped — negligible bundle cost
- Used by thousands of production React apps

```js
import toast from 'react-hot-toast';

toast.success('Profile updated');
toast.error('Failed to upload resume');
toast.loading('Saving...', { id: 'save' });
toast.dismiss('save');
```

---

### Date Handling

| Technology | Version | Role |
|---|---|---|
| **date-fns** | 3.x | Date formatting, comparison, and relative time |

**Why date-fns?**
- Modular — tree-shakeable, only import what you use
- No global state or prototype mutation (unlike Moment.js)
- Functional API — easy to test and compose

```js
import { formatDistanceToNow, format, isPast } from 'date-fns';

formatDistanceToNow(new Date(job.createdAt), { addSuffix: true });
// → "3 days ago"

format(new Date(interview.scheduledAt), 'MMM d, yyyy · h:mm a');
// → "Jul 15, 2025 · 10:30 AM"

isPast(new Date(job.applicationDeadline));
// → true/false for deadline warning
```

---

### Utilities

| Technology | Version | Role |
|---|---|---|
| **clsx** | 2.x | Conditional class name builder |
| **tailwind-merge** | 2.x | Merges conflicting Tailwind classes safely |

**Combined `cn()` utility — used in every component:**
```js
// src/utils/cn.js
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Usage:
<div className={cn('rounded-xl p-4 bg-white', isActive && 'ring-2 ring-primary', className)}>
```

---

### Animations & Charts

| Technology | Version | Role |
|---|---|---|
| **Framer Motion** | 11.x | Animations throughout — page transitions, modals, sidebars, cards |
| **Recharts** | 2.x | Animated charts — donut, area, bar, sparkline |

---

### Frontend Install Commands

```bash
# Core
npm install react react-dom react-router-dom axios

# Server state
npm install @tanstack/react-query

# Forms + validation
npm install react-hook-form zod @hookform/resolvers

# Styling utilities
npm install clsx tailwind-merge

# Icons
npm install lucide-react react-icons

# Notifications
npm install react-hot-toast

# Animations + Charts
npm install framer-motion recharts

# Date handling
npm install date-fns

# Tailwind init
npx tailwindcss init -p
```

### Dev Dependencies

```bash
npm install -D vite @vitejs/plugin-react \
  tailwindcss postcss autoprefixer \
  @tailwindcss/forms @tailwindcss/typography @tailwindcss/container-queries \
  eslint prettier eslint-plugin-react eslint-config-prettier
```

**`package.json` scripts:**
```json
{
  "scripts": {
    "dev":     "vite",
    "build":   "vite build",
    "preview": "vite preview"
  }
}
```

---

## 3. Accessibility

> Every interactive component must be accessible. Interviewers and users notice.

| Requirement | Implementation |
|---|---|
| **Keyboard navigation** | All interactive elements reachable via `Tab`. Arrow keys for menus/tables. `Enter`/`Space` activate buttons. |
| **Visible focus rings** | `focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2` on all interactive elements |
| **ARIA labels** | Icon-only buttons have `aria-label`. Modals have `role="dialog"` + `aria-modal`. Dropdowns have `aria-expanded`. |
| **Esc closes modals** | `keydown` listener on all overlays (Modal, CommandPalette, NotificationPanel) |
| **Screen reader support** | `aria-live="polite"` on toasts and status updates. `aria-busy="true"` on loading states. |
| **Color contrast** | All text meets WCAG AA (4.5:1 normal, 3:1 large). Status badges pair color with text label. |
| **Focus trap** | All modals and dialogs trap focus inside and return it to the trigger on close. |
| **Semantic HTML** | `<nav>`, `<main>`, `<aside>`, `<article>`, `<section>` used appropriately. Single `<h1>` per page. |

---

## 4. Responsive Design

> **Mobile-first.** Tailwind utility classes are written for mobile by default and scaled up with breakpoints.

### Breakpoints

| Breakpoint | Min Width | Target |
|---|---|---|
| (default) | 0px | Mobile portrait |
| `sm` | 640px | Mobile landscape / small tablet |
| `md` | 768px | Tablet |
| `lg` | 1024px | Laptop / tablet landscape |
| `xl` | 1280px | Desktop |
| `2xl` | 1536px | Wide desktop |

### Layout Behaviour

| Element | Mobile | `md` | `lg` | `xl` |
|---|---|---|---|---|
| Sidebar | Hidden (drawer) | Hidden | Fixed collapsed | Fixed expanded |
| Bottom nav | Visible | Hidden | Hidden | Hidden |
| Job grid | 1 col | 2 col | 3 col | 3 col |
| Stats row | 1 col | 2 col | 4 col | 4 col |
| Forms | 1 col | 2 col | 2 col | 2 col |
| Modal | Bottom sheet | Centered | Centered | Centered |
| DataTable | Horizontal scroll | Scroll | Full | Full |

**Mobile-first class example:**
```jsx
// Grid: 1 col on mobile → 2 on md → 4 on lg
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

// Sidebar: hidden on mobile, visible on lg
<aside className="hidden lg:flex lg:w-16 xl:w-60">

// Bottom nav: visible on mobile, hidden on lg
<nav className="fixed bottom-0 lg:hidden">
```

---

## 5. Bundle Optimization

**Code splitting via `React.lazy` + `Suspense`:**
```js
// Lazy-loaded by role group — candidates don't download recruiter bundles
const RecruiterDashboard = lazy(() => import('./pages/recruiter/RecruiterDashboard'));
```

**Image lazy loading:**
```jsx
<img src={logoUrl} alt={companyName} loading="lazy" decoding="async" />
```

**Tree shaking:**
- Lucide React: named imports only — unused icons are excluded from the bundle
- date-fns: import individual functions — `import { format } from 'date-fns'`
- Recharts: import specific chart types — no full-library import

**Dynamic imports:**
```js
// Heavy component loaded only when needed
const CommandPalette = lazy(() => import('./components/layout/CommandPalette'));
```

**Vite production build:**
```bash
npm run build
# Output: dist/
# Automatic chunk splitting, minification, CSS purging via Tailwind JIT
```

**Bundle size targets (approximate):**
| Chunk | Target |
|---|---|
| Initial JS | < 100kB gzipped |
| Per-role lazy chunk | < 60kB gzipped |
| CSS (Tailwind JIT) | < 20kB gzipped |

---

## 6. Database Hosting

| Environment | Service |
|---|---|
| Development | Local MongoDB `mongodb://localhost:27017/talentflow` |
| Production | MongoDB Atlas M0 (free, 512MB) |

---

## 7. File Storage

| Version | Storage | Notes |
|---|---|---|
| V1 | Local disk (`uploads/resumes/`) | Multer `diskStorage` |
| V2 | Cloudinary | Swap storage engine — no other code changes |

---

## 8. Deployment

| Layer | Platform | Plan |
|---|---|---|
| **Backend** | Render | Free tier, auto-deploys from `main` |
| **Frontend** | Vercel | Free tier, auto-deploys from `main` |
| **Database** | MongoDB Atlas | Free M0 cluster |

**Frontend → Backend communication:**
```
VITE_API_BASE_URL=https://talentflow-api.onrender.com/api/v1
      ↓
Axios reads at runtime via import.meta.env
      ↓
All API requests target the live backend automatically
```

The same frontend codebase works in both dev (`localhost:5000`) and production (`onrender.com`) by swapping a single environment variable.

**Environment variables:**
```bash
# Backend (Render dashboard)
PORT, MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN, CLIENT_URL, NODE_ENV

# Frontend (Vercel dashboard)
VITE_API_BASE_URL
```

---

## 9. Development Tooling

| Tool | Role |
|---|---|
| **VS Code** | Primary editor |
| **ESLint** | JavaScript linting — catches errors and enforces code style |
| **Prettier** | Code formatter — consistent style across all files |
| **Nodemon** | Auto-restart backend on file changes |
| **Vite HMR** | Hot module replacement for frontend |
| **MongoDB Compass** | GUI for inspecting local database |
| **Postman / Bruno** | API testing during development |
| **Git + GitHub** | Version control + CI/CD trigger |
| **GitHub Issues** | Bug tracking and feature requests |
| **GitHub Projects** | Kanban board for development task management |

**ESLint + Prettier setup:**
```bash
# Backend
npm install -D eslint prettier eslint-config-prettier

# Frontend
npm install -D eslint prettier eslint-plugin-react eslint-config-prettier
```

> **Future (V2):** Husky + lint-staged — enforces linting on every commit as a pre-commit hook.

---

## 10. Complete Tech Stack Summary

### Backend
| Technology | Role |
|---|---|
| Node.js 20 LTS | Runtime |
| Express.js 4 | HTTP framework |
| MongoDB 7 + Mongoose 8 | Database + ODM |
| jsonwebtoken | JWT auth |
| bcryptjs | Password hashing |
| helmet | Secure headers |
| cors | Cross-origin policy |
| express-rate-limit | Brute-force protection |
| express-validator | Request validation |
| multer | File uploads |
| morgan | Request logging |
| compression | Gzip responses |
| dotenv | Env file loader |
| envalid | Env var validation at startup |

### Frontend
| Technology | Role |
|---|---|
| React 18 | UI library |
| Vite 5 | Build tool + dev server |
| Tailwind CSS 3 | Utility-first styling |
| CSS Custom Properties | Brand design tokens |
| @tailwindcss/forms | Styled form inputs |
| @tailwindcss/typography | Rich text rendering |
| @tailwindcss/container-queries | Component-level responsive design |
| React Router v6 | Client-side routing |
| **TanStack Query v5** | **Server state — cache, loading, error, refetch** |
| Axios | HTTP client + interceptors |
| react-hook-form | Form state management |
| zod | Schema validation |
| @hookform/resolvers | Connects zod ↔ react-hook-form |
| Framer Motion | Animations |
| Recharts | Charts and data visualization |
| react-hot-toast | Toast notifications |
| Lucide React | Primary icon set |
| React Icons | Fallback icon set |
| clsx | Conditional class names |
| tailwind-merge | Tailwind class merging |
| date-fns | Date formatting and comparison |

### Dev Tools
| Tool | Role |
|---|---|
| ESLint | Linting |
| Prettier | Formatting |
| Nodemon | Backend auto-restart |
| MongoDB Compass | Database GUI |
| Postman / Bruno | API testing |
| VS Code | Editor |
| GitHub Issues | Bug/feature tracking |
| GitHub Projects | Development kanban |

---

## 11. Version 2 Enhancements

| Technology | Purpose |
|---|---|
| **Winston** | Structured production logging — replaces Morgan for persistent, levelled logs |
| **Swagger / OpenAPI** | Auto-generated interactive API docs from JSDoc annotations |
| **Cloudinary** | Cloud file storage — swap Multer disk storage engine |
| **Nodemailer** | Email notifications |
| **Jest + Supertest** | Backend unit + integration testing |
| **Vitest + React Testing Library** | Frontend component testing |
| **Husky + lint-staged** | Pre-commit hooks — lint + format before every commit |
| **TypeScript** | Type safety — can be layered incrementally |

> **Testing note:** Automated testing is outside the MVP scope. The architecture is deliberately designed for testability — Controller/Service separation on the backend, and custom hooks on the frontend, make both sides independently testable when the test suite is added in V2.

---

> ✅ **Document 7 of 10 Complete — Tech Stack (Final)**
