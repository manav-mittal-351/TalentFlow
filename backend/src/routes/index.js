// ─── routes/index.js ─────────────────────────────────────────────────────────
// Single mount point for all API route groups.
// Mounted in app.js as: app.use('/api/v1', router)
// Doc reference: Document 5 — API Design §7 (Route Groups)
//                Document 6 — Folder Structure (routes/index.js)
//
// Total documented endpoints: 44
// Active: Module 1 — auth         (3 endpoints)
//         Module 2 — company      (3 endpoints)
//         Module 3 — jobs         (8 endpoints)
//         Module 4 — applications (10 endpoints)
//         Module 5 — interviews   (5 endpoints)
//         Module 6 — feedback     (3 endpoints)
//         Module 7 — notifications(4 endpoints)
// Remaining modules will be uncommented as built.

import { Router } from 'express';
import authRoutes        from './auth.routes.js';
import companyRoutes     from './company.routes.js';
import jobRoutes         from './job.routes.js';
import applicationRoutes from './application.routes.js';
import interviewRoutes   from './interview.routes.js';
import feedbackRoutes    from './feedback.routes.js';
import notificationRoutes from './notification.routes.js';

const router = Router();

// ── Module 1: Authentication (3 endpoints) ────────────────────────────────────
router.use('/auth', authRoutes);

// ── Module 2: Company Profile (3 endpoints) ───────────────────────────────────
router.use('/company', companyRoutes);

// ── Module 3: User / Profile (5 endpoints) ───────────────────────────────────
// router.use('/users', userRoutes);

// ── Module 4: Jobs (8 endpoints) ────────────────────────────────────────────────
router.use('/jobs', jobRoutes);

// ── Module 4: Applications (10 endpoints) ──────────────────────────────────
router.use('/applications', applicationRoutes);

// ── Module 5: Interviews (5 endpoints) ──────────────────────────────────
router.use('/interviews', interviewRoutes);

// ── Module 6: Feedback (3 endpoints) ───────────────────────────────────
router.use('/feedback', feedbackRoutes);

// ── Module 7: Notifications (4 endpoints) ────────────────────────────────────
router.use('/notifications', notificationRoutes);

// ── Module 9: Dashboard (3 endpoints) ────────────────────────────────────────
// router.use('/dashboard', dashboardRoutes);

export default router;
