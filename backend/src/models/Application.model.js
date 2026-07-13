// ─── models/Application.model.js ─────────────────────────────────────────────
// Defines the `applications` collection schema.
// Doc reference: Document 4 — Database Schema §4 (`applications` collection)
//
// Key design decisions:
// - job + candidate compound unique index = prevents duplicate applications (DB-level)
// - resumeUrl: snapshot of resume at apply time (not live from candidate profile)
// - recruiterNotes: select:false + toJSON transform — NEVER leaked to candidates/HMs
// - statusHistory: append-only audit trail — never modified, only pushed to
// - appliedAt: explicit Date field for reliable sorting (cleaner than createdAt)
// - isDeleted: soft-delete flag — V1 doesn't expose delete to users (admin only future)

import mongoose from 'mongoose';
import { APPLICATION_STATUSES } from '../utils/constants.js';

const { Schema } = mongoose;

// ─── Status History sub-document ──────────────────────────────────────────────
const statusHistorySchema = new Schema(
  {
    status:    { type: String, required: true },
    changedAt: { type: Date,   default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false } // embedded sub-doc — no separate _id
);

// ─── Application Schema ────────────────────────────────────────────────────────
const applicationSchema = new Schema(
  {
    // ── Relationships ──────────────────────────────────────────────────────────
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

    // ── Application Content ────────────────────────────────────────────────────
    // Doc 04: field name is coverNote (not coverLetter)
    coverNote: {
      type:      String,
      default:   '',
      maxlength: [2000, 'Cover note cannot exceed 2000 characters'],
      trim:      true,
    },

    // Resume snapshot at time of application.
    // Candidate may update their profile resume later without affecting this record.
    // V2: will store Cloudinary URL instead of local path.
    resumeUrl: {
      type:     String,
      required: [true, 'Resume is required to apply'],
      trim:     true,
    },

    // Explicit apply timestamp — easier to sort/query than relying on createdAt
    appliedAt: {
      type:    Date,
      default: Date.now,
    },

    // ── Pipeline Status ────────────────────────────────────────────────────────
    status: {
      type:    String,
      enum:    {
        values:  APPLICATION_STATUSES,
        message: `Status must be one of: ${APPLICATION_STATUSES.join(', ')}`,
      },
      default: 'applied',
    },

    // ── Audit Trail ───────────────────────────────────────────────────────────
    // Append-only — new entries are pushed on every status change.
    // Never modified after creation. createdBy is stored per entry.
    statusHistory: [statusHistorySchema],

    // ── Recruiter Private Notes ────────────────────────────────────────────────
    // CRITICAL: select: false + toJSON transform — NEVER returned to candidates or HMs.
    // Doc 05 §18: "recruiterNotes never leaked — Stripped at serializer level for all non-recruiter roles"
    recruiterNotes: {
      type:      String,
      default:   '',
      maxlength: [3000, 'Recruiter notes cannot exceed 3000 characters'],
      select:    false, // excluded from all queries unless explicitly .select('+recruiterNotes')
    },

    // ── Soft Delete ────────────────────────────────────────────────────────────
    isDeleted: {
      type:    Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt auto-managed
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Doc 04: job + candidate compound unique — DB-level duplicate application prevention
applicationSchema.index({ job: 1, candidate: 1 }, { unique: true });
// Doc 04: job + status — recruiter pipeline filter (job X → shortlisted candidates)
applicationSchema.index({ job: 1, status: 1 });
// Doc 04: candidate — candidate dashboard queries
applicationSchema.index({ candidate: 1, isDeleted: 1 });
// Doc 04: appliedAt — sort by date applied
applicationSchema.index({ appliedAt: -1 });

// ─── toJSON transform ─────────────────────────────────────────────────────────
// The primary guard is `select: false` on recruiterNotes.
// This means recruiterNotes is excluded from ALL queries unless the service
// explicitly adds .select('+recruiterNotes'). No toJSON stripping needed —
// the field simply won't exist in results unless explicitly fetched.
// Service layer is responsible for only fetching recruiterNotes for recruiter endpoints.


const Application = mongoose.model('Application', applicationSchema);

export default Application;
