// ─── routes/index.js ─────────────────────────────────────────────────────────
// Single mount point for all API route groups.
// Mounted in app.js as: app.use('/api/v1', router)
// Doc reference: Document 5 — API Design §7 (Route Groups)
//                Document 6 — Folder Structure (routes/index.js)
//
// Total documented endpoints: 44
// Active: Module 1 — auth    (3 endpoints)
//         Module 2 — company (3 endpoints)
//         Module 3 — jobs    (8 endpoints)
// Remaining modules will be uncommented as built.

import { Router } from 'express';
import authRoutes    from './auth.routes.js';
import companyRoutes from './company.routes.js';
import jobRoutes     from './job.routes.js';

const router = Router();

// ── Module 1: Authentication (3 endpoints) ────────────────────────────────────
router.use('/auth', authRoutes);

// ── Module 2: Company Profile (3 endpoints) ───────────────────────────────────
router.use('/company', companyRoutes);

// ── Module 3: User / Profile (5 endpoints) ───────────────────────────────────
// router.use('/users', userRoutes);

// ── Module 4: Jobs (8 endpoints) ────────────────────────────────────────────────
router.use('/jobs', jobRoutes);

// ── Module 5: Applications (10 endpoints) ────────────────────────────────────
// router.use('/applications', applicationRoutes);

// ── Module 6: Interviews (5 endpoints) ───────────────────────────────────────
// router.use('/interviews', interviewRoutes);

// ── Module 7: Feedback (3 endpoints) ─────────────────────────────────────────
// router.use('/feedback', feedbackRoutes);

// ── Module 8: Notifications (4 endpoints) ────────────────────────────────────
// router.use('/notifications', notificationRoutes);

// ── Module 9: Dashboard (3 endpoints) ────────────────────────────────────────
// router.use('/dashboard', dashboardRoutes);

export default router;
