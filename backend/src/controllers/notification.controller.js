// ─── controllers/notification.controller.js ──────────────────────────────────
// Thin controller layer for all notification endpoints.
// No business logic here — all delegated to notification.service.js.
// Doc reference: Document 5 — API Design §15 (Notification Routes)

import * as notificationService from '../services/notification.service.js';
import { success, paginatedSuccess } from '../utils/apiResponse.js';

// ─── GET /api/v1/notifications — Paginated list (All roles) ───────────────────
export const getNotifications = async (req, res, next) => {
  try {
    const { notifications, pagination } = await notificationService.getNotifications(
      req.user.id,
      req.query
    );
    return paginatedSuccess(res, 'Notifications fetched successfully', notifications, pagination);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/v1/notifications/unread-count — (All roles) ─────────────────────
export const getUnreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    return success(res, 'Unread notification count fetched successfully', { count });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/v1/notifications/:id/read — Mark single read (All roles) ─────
export const markAsRead = async (req, res, next) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id, req.user.id);
    return success(res, 'Notification marked as read successfully', notification);
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/v1/notifications/read-all — Mark all read (All roles) ─────────
export const markAllAsRead = async (req, res, next) => {
  try {
    const modifiedCount = await notificationService.markAllAsRead(req.user.id);
    return success(res, 'All notifications marked as read successfully', { modifiedCount });
  } catch (err) {
    next(err);
  }
};
