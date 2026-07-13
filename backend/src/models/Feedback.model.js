// ─── models/Feedback.model.js ─────────────────────────────────────────────────
// Defines the `feedbacks` collection schema.
// Doc reference: Document 4 — Database Schema §6 (`feedbacks` collection)
//
// Key design decisions:
// - interview + submittedBy compound unique index: one feedback per interview
//   per HM. This enforces FEEDBACK_ALREADY_SUBMITTED at the DB level.
// - application and candidate are denormalized from the interview at submit time
//   so reads (GET /feedback/application/:id) are simple single-collection queries.
// - All 4 rating sub-fields are required integers 1–5.
// - No soft-delete on feedback — once submitted it is permanent (editable only by HM).

import mongoose from 'mongoose';
import { FEEDBACK_RECOMMENDATIONS } from '../utils/constants.js';

const { Schema } = mongoose;

const feedbackSchema = new Schema(
  {
    // ── Relationships ──────────────────────────────────────────────────────────
    interview: {
      type:     Schema.Types.ObjectId,
      ref:      'Interview',
      required: [true, 'Interview reference is required'],
    },

    application: {
      type:     Schema.Types.ObjectId,
      ref:      'Application',
      required: [true, 'Application reference is required'],
    },

    // Denormalized from interview at submit time for efficient reads
    candidate: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Candidate reference is required'],
    },

    submittedBy: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'submittedBy (HM) is required'],
    },

    // ── Scorecard ──────────────────────────────────────────────────────────────
    // All sub-fields are required integers 1–5. Doc 04 §6.
    ratings: {
      overall: {
        type:     Number,
        min:      [1, 'overall rating must be at least 1'],
        max:      [5, 'overall rating cannot exceed 5'],
        required: [true, 'overall rating is required'],
      },
      technical: {
        type:     Number,
        min:      [1, 'technical rating must be at least 1'],
        max:      [5, 'technical rating cannot exceed 5'],
        required: [true, 'technical rating is required'],
      },
      communication: {
        type:     Number,
        min:      [1, 'communication rating must be at least 1'],
        max:      [5, 'communication rating cannot exceed 5'],
        required: [true, 'communication rating is required'],
      },
      cultureFit: {
        type:     Number,
        min:      [1, 'cultureFit rating must be at least 1'],
        max:      [5, 'cultureFit rating cannot exceed 5'],
        required: [true, 'cultureFit rating is required'],
      },
    },

    // ── Written feedback ───────────────────────────────────────────────────────
    comments: {
      type:      String,
      default:   '',
      maxlength: [3000, 'comments cannot exceed 3000 characters'],
      trim:      true,
    },

    // ── Recommendation ─────────────────────────────────────────────────────────
    recommendation: {
      type:     String,
      enum: {
        values:  FEEDBACK_RECOMMENDATIONS,
        message: `recommendation must be one of: ${FEEDBACK_RECOMMENDATIONS.join(', ')}`,
      },
      required: [true, 'recommendation is required'],
    },

    decisionReason: {
      type:      String,
      default:   '',
      maxlength: [1000, 'decisionReason cannot exceed 1000 characters'],
      trim:      true,
    },
  },
  {
    timestamps: true, // createdAt + updatedAt auto-managed
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// Doc 04: interview — one scorecard per interview per HM
// Compound unique: prevents FEEDBACK_ALREADY_SUBMITTED at DB level
feedbackSchema.index({ interview: 1, submittedBy: 1 }, { unique: true });
// Doc 04: application — aggregate all feedback for a candidate profile
feedbackSchema.index({ application: 1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);

export default Feedback;
