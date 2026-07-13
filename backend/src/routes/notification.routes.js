// ─── routes/notification.routes.js ────────────────────────────────────────────
// Notification route definitions — 4 endpoints.
// Doc reference: Document 5 — API Design §15 (Notification Routes)
//
// ⚠️  Route order is critical — static routes before parametric:
//
//   GET    /unread-count    All roles (badge count)
//   PATCH  /read-all        All roles (bulk mark read)
//   PATCH  /:id/read        All roles (single mark read)
//   GET    /                All roles (paginated list)

import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
} from '../controllers/notification.controller.js';
import { getNotificationsValidator } from '../validators/notification.validator.js';
import { validate }                  from '../middleware/validate.js';
import { verifyToken }               from '../middleware/verifyToken.js';

const router = Router();

// Apply verifyToken to all notification endpoints (all require authentication)
router.use(verifyToken);

// GET /api/v1/notifications/unread-count — All roles (static before general)
router.get('/unread-count', getUnreadCount);

// PATCH /api/v1/notifications/read-all — All roles (static before parametric)
router.patch('/read-all', markAllAsRead);

// PATCH /api/v1/notifications/:id/read — All roles (parametric status change)
router.patch('/:id/read', markAsRead);

// GET /api/v1/notifications — All roles (paginated list, general GET)
router.get('/', getNotificationsValidator, validate, getNotifications);

export default router;
