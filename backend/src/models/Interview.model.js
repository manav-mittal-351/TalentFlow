// ─── models/Interview.model.js ────────────────────────────────────────────────
// Defines the `interviews` collection schema.
// Doc reference: Document 4 — Database Schema §5 (`interviews` collection)
//
// Key design decisions:
// - job and candidate are denormalized from the application at create time
//   (avoids populate chains on every read; application is the source of truth)
// - interviewer (HM) is optional at scheduling time — can be set later via PATCH
// - candidateInstructions is visible to the candidate on GET /:id (scoped)
// - cancelledReason is only meaningful when status = 'cancelled'
// - No soft-delete on interviews — hard status ('cancelled') serves the same purpose

import mongoose from 'mongoose';
import { INTERVIEW_FORMATS, INTERVIEW_STATUSES } from '../utils/constants.js';

const { Schema } = mongoose;

const interviewSchema = new Schema(
  {
    // ── Relationships ──────────────────────────────────────────────────────────
    application: {
      type:     Schema.Types.ObjectId,
      ref:      'Application',
      required: [true, 'Application reference is required'],
    },

    // Denormalized from application at create time for efficient reads
    job: {
      type:     Schema.Types.ObjectId,
      ref:      'Job',
      required: [true, 'Job reference is required'],
    },

    candidate: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Candidate reference is required'],
    },

    scheduledBy: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Scheduled by (recruiter) is required'],
    },

    // Hiring Manager — optional at scheduling time
    interviewer: {
      type:    Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },

    // ── Schedule ───────────────────────────────────────────────────────────────
    scheduledAt: {
      type:     Date,
      required: [true, 'scheduledAt is required'],
    },

    format: {
      type:     String,
      enum: {
        values:  INTERVIEW_FORMATS,
        message: `Format must be one of: ${INTERVIEW_FORMATS.join(', ')}`,
      },
      required: [true, 'Interview format is required'],
    },

    // Meeting room name or video link
    location: {
      type:      String,
      default:   '',
      maxlength: [300, 'Location cannot exceed 300 characters'],
      trim:      true,
    },

    // Visible to candidate — instructions / joining link
    candidateInstructions: {
      type:      String,
      default:   '',
      maxlength: [1000, 'Candidate instructions cannot exceed 1000 characters'],
      trim:      true,
    },

    // ── Status ─────────────────────────────────────────────────────────────────
    status: {
      type:    String,
      enum: {
        values:  INTERVIEW_STATUSES,
        message: `Status must be one of: ${INTERVIEW_STATUSES.join(', ')}`,
      },
      default: 'scheduled',
    },

    // Populated only when status = 'cancelled'
    cancelledReason: {
      type:      String,
      default:   '',
      maxlength: [500, 'Cancelled reason cannot exceed 500 characters'],
      trim:      true,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt auto-managed
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Doc 04: application — multiple rounds per application
interviewSchema.index({ application: 1 });
// Doc 04: candidate — candidate interview history
interviewSchema.index({ candidate: 1 });
// Doc 04: scheduledAt — sort upcoming interviews
interviewSchema.index({ scheduledAt: 1 });
// Doc 04: status — filter scheduled/completed/cancelled
interviewSchema.index({ status: 1 });

const Interview = mongoose.model('Interview', interviewSchema);

export default Interview;
