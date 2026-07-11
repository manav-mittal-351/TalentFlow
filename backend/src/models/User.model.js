// ─── models/User.model.js ─────────────────────────────────────────────────────
// Defines the `users` collection schema.
// Doc reference: Document 4 — Database Schema §1 (`users` collection)
//
// Key design decisions:
// - passwordHash has select:false — never returned in queries by default
// - toJSON transform removes passwordHash as a safety net
// - profile sub-document is candidate-facing; HMs use department instead
// - savedJobs refs are populated on demand (not auto-populated)

import mongoose from 'mongoose';
import {
  ROLE_VALUES,
  DEPARTMENTS,
} from '../utils/constants.js';

const { Schema } = mongoose;

// ─── Profile sub-document (candidate-only) ────────────────────────────────────
const profileSchema = new Schema(
  {
    headline: {
      type: String,
      default: '',
      maxlength: [150, 'Headline cannot exceed 150 characters'],
      trim: true,
    },
    bio: {
      type: String,
      default: '',
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      match: [
        /^\+?[0-9\s\-().]{7,20}$/,
        'Please enter a valid phone number',
      ],
    },
    location: {
      type: String,
      default: '',
      maxlength: [100, 'Location cannot exceed 100 characters'],
      trim: true,
    },
    resumeUrl: {
      type: String,
      default: '',
      // Local path in V1 — e.g. uploads/resumes/filename.pdf
      // V2: Cloudinary URL
    },
    portfolioUrl: {
      type: String,
      default: '',
      match: [
        /^(https?:\/\/).+/,
        'Portfolio URL must start with http:// or https://',
      ],
    },
    githubUrl: {
      type: String,
      default: '',
      match: [
        /^(https?:\/\/(www\.)?github\.com\/).+/,
        'Must be a valid GitHub URL (github.com/...)',
      ],
    },
    linkedinUrl: {
      type: String,
      default: '',
      match: [
        /^(https?:\/\/(www\.)?linkedin\.com\/).+/,
        'Must be a valid LinkedIn URL (linkedin.com/...)',
      ],
    },
    isProfileComplete: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false } // embedded document — no separate _id needed
);

// ─── Main User schema ─────────────────────────────────────────────────────────
const userSchema = new Schema(
  {
    // ── Identity ──────────────────────────────────────────────────────────────
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // never returned in query results unless explicitly requested
    },

    // ── Role ──────────────────────────────────────────────────────────────────
    role: {
      type: String,
      enum: {
        values: ROLE_VALUES,
        message: 'Role must be one of: recruiter, hiring_manager, candidate',
      },
      required: [true, 'Role is required'],
    },

    // ── Candidate-only profile ─────────────────────────────────────────────────
    // Present on all users but only meaningful for candidates.
    // Hiring managers and recruiters ignore this sub-document.
    profile: {
      type: profileSchema,
      default: () => ({}),
    },

    // ── Hiring Manager — department scope ─────────────────────────────────────
    department: {
      type: String,
      enum: {
        values: [...DEPARTMENTS, ''],
        message: `Department must be one of: ${DEPARTMENTS.join(', ')}`,
      },
      default: '',
    },

    // ── Candidate — saved jobs ─────────────────────────────────────────────────
    // Array of Job ObjectId refs. Populated on demand, not auto-populated.
    savedJobs: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Job',
      },
    ],
  },
  {
    timestamps: true, // createdAt + updatedAt auto-managed by Mongoose
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
// email index is already created by `unique: true` above.
userSchema.index({ role: 1 }); // role-scoped queries (dashboard, pipeline)

// ─── toJSON transform ─────────────────────────────────────────────────────────
// Safety net: removes passwordHash from any JSON serialisation.
// Even if select:false is bypassed (e.g. a .select('+passwordHash') call
// without stripping), this ensures the hash is never sent over the wire.
userSchema.set('toJSON', {
  transform(doc, ret) {
    delete ret.passwordHash;
    return ret;
  },
});

const User = mongoose.model('User', userSchema);

export default User;
