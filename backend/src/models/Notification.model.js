// ─── models/Notification.model.js ─────────────────────────────────────────────
// Defines the `notifications` collection schema.
// Doc reference: Document 4 — Database Schema §7 (`notifications` collection)
//
// Key design decisions:
// - icon maps to UI/UX cues (success, info, warning, error)
// - link helps the frontend route when user clicks on a notification
// - relatedJob and relatedApp are references to help target entity links
// - Indexes: compound recipient+isRead for fast badge count query.
//            compound recipient+createdAt for sorting inbox.

import mongoose from 'mongoose';
import { NOTIFICATION_TYPES, NOTIFICATION_ICONS } from '../utils/constants.js';

const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipient: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Recipient user reference is required'],
    },

    type: {
      type:     String,
      enum: {
        values:  NOTIFICATION_TYPES,
        message: `Type must be one of: ${NOTIFICATION_TYPES.join(', ')}`,
      },
      required: [true, 'Notification type is required'],
    },

    message: {
      type:      String,
      required:  [true, 'Notification message is required'],
      maxlength: [500, 'Notification message cannot exceed 500 characters'],
      trim:      true,
    },

    link: {
      type:    String,
      default: '',
      trim:    true,
    },

    icon: {
      type:    String,
      enum:    NOTIFICATION_ICONS,
      default: 'info',
    },

    // Related entities for deep-linking
    relatedJob: {
      type:    Schema.Types.ObjectId,
      ref:     'Job',
      default: null,
    },

    relatedApp: {
      type:    Schema.Types.ObjectId,
      ref:     'Application',
      default: null,
    },

    isRead: {
      type:    Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // auto-manages createdAt and updatedAt
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Doc 04: recipient + isRead — fast unread badge count query
notificationSchema.index({ recipient: 1, isRead: 1 });

// Doc 04: recipient + createdAt — notification inbox sorted newest-first
notificationSchema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
