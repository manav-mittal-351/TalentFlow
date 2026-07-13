// ─── services/notification.service.js ─────────────────────────────────────────
// Core notification business logic.
// Doc reference: Document 5 — API Design §15 (Notification Routes)
//                Document 4 — Database Schema §7 (notifications)

import Notification from '../models/Notification.model.js';
import { paginate, buildPagination } from '../utils/paginate.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const throwNotFound = () => {
  const err = new Error('Notification not found');
  err.statusCode = 404;
  err.errorCode  = 'NOTIFICATION_NOT_FOUND';
  throw err;
};

const throwForbidden = () => {
  const err = new Error('You are not authorized to access this notification');
  err.statusCode = 403;
  err.errorCode  = 'FORBIDDEN_ROLE';
  throw err;
};

// ─── Create (internal helper for modules integration) ─────────────────────────
/**
 * Internal service helper to dispatch notifications.
 * Never throws Express-facing errors since it is invoked asynchronously in lifecycle hooks.
 * Just catches and logs to console.error to avoid crashing user flows if notification fails.
 *
 * @param {object} payload - { recipient, type, message, link, icon, relatedJob, relatedApp }
 * @returns {Promise<object|null>} The created notification or null on error
 */
export const createNotification = async (payload) => {
  try {
    const notification = await Notification.create(payload);
    return notification;
  } catch (err) {
    console.error('💥 Failed to create notification:', err.message);
    return null;
  }
};

// ─── GET /notifications — Paginated list ──────────────────────────────────────
/**
 * Returns all notifications for the recipient.
 * Supports optional `isRead` query filter, paginated, sorted newest-first.
 *
 * @param {string} recipientId
 * @param {object} query - req.query
 * @returns {Promise<{ notifications: Array, pagination: object }>}
 */
export const getNotifications = async (recipientId, query) => {
  const { page, limit, skip } = paginate({ ...query, limit: query.limit || 20 }); // Doc 05 lists default limit 20 for notifications

  const filter = { recipient: recipientId };
  if (query.isRead !== undefined) {
    filter.isRead = query.isRead === 'true';
  }

  const [notifications, total] = await Promise.all([
    Notification.find(filter)
      .populate('relatedJob', 'title company')
      .populate('relatedApp', 'status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
  ]);

  return { notifications, pagination: buildPagination(total, page, limit) };
};

// ─── GET /notifications/unread-count ─────────────────────────────────────────
/**
 * Returns count of unread notifications for a user.
 *
 * @param {string} recipientId
 * @returns {Promise<number>}
 */
export const getUnreadCount = async (recipientId) => {
  const count = await Notification.countDocuments({ recipient: recipientId, isRead: false });
  return count;
};

// ─── PATCH /notifications/:id/read — Mark single read ──────────────────────────
/**
 * Marks a notification as read. Owner check enforced.
 *
 * @param {string} notificationId
 * @param {string} recipientId
 * @returns {Promise<object>}
 */
export const markAsRead = async (notificationId, recipientId) => {
  const notification = await Notification.findById(notificationId);
  if (!notification) throwNotFound();

  if (notification.recipient.toString() !== recipientId) {
    throwForbidden();
  }

  notification.isRead = true;
  await notification.save();
  return notification;
};

// ─── PATCH /notifications/read-all — Mark all read ────────────────────────────
/**
 * Marks all unread notifications for a recipient as read.
 *
 * @param {string} recipientId
 * @returns {Promise<number>} Number of notifications modified
 */
export const markAllAsRead = async (recipientId) => {
  const result = await Notification.updateMany(
    { recipient: recipientId, isRead: false },
    { $set: { isRead: true } }
  );
  return result.modifiedCount;
};
