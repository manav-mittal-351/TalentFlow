// ─── models/Job.model.js ──────────────────────────────────────────────────────
// Defines the `jobs` collection schema.
// Doc reference: Document 4 — Database Schema §3 (`jobs` collection)
//
// Key design decisions:
// - salaryMax >= salaryMin enforced in pre('save') Mongoose middleware
// - isDeleted: soft-delete — filtered from all public queries
// - applicationCount: denormalized stat updated by Application post('save') hook (Module 5)
// - company + createdBy: both required (createdBy is always the Recruiter user)

import mongoose from 'mongoose';
import {
  DEPARTMENTS,
  JOB_TYPES,
  EXPERIENCE_LEVELS,
  JOB_STATUSES,
} from '../utils/constants.js';

const { Schema } = mongoose;

const jobSchema = new Schema(
  {
    // ── Core Info ──────────────────────────────────────────────────────────────
    title: {
      type:      String,
      required:  [true, 'Job title is required'],
      trim:      true,
      maxlength: [150, 'Job title cannot exceed 150 characters'],
    },

    department: {
      type:     String,
      enum:     {
        values:  DEPARTMENTS,
        message: `Department must be one of: ${DEPARTMENTS.join(', ')}`,
      },
      required: [true, 'Department is required'],
    },

    location: {
      type:      String,
      required:  [true, 'Location is required'],
      trim:      true,
      maxlength: [100, 'Location cannot exceed 100 characters'],
    },

    jobType: {
      type:     String,
      enum:     {
        values:  JOB_TYPES,
        message: `Job type must be one of: ${JOB_TYPES.join(', ')}`,
      },
      required: [true, 'Job type is required'],
    },

    // Separate from jobType — allows future 'hybrid' type without schema change
    isRemote: {
      type:    Boolean,
      default: false,
    },

    experienceLevel: {
      type:    String,
      enum:    {
        values:  EXPERIENCE_LEVELS,
        message: `Experience level must be one of: ${EXPERIENCE_LEVELS.join(', ')}`,
      },
      default: 'mid',
    },

    description: {
      type:      String,
      required:  [true, 'Job description is required'],
      trim:      true,
      maxlength: [10000, 'Description cannot exceed 10000 characters'],
    },

    // ── Salary ─────────────────────────────────────────────────────────────────
    salaryMin: {
      type:    Number,
      default: null,
      min:     [0, 'Minimum salary cannot be negative'],
    },

    salaryMax: {
      type:    Number,
      default: null,
      min:     [0, 'Maximum salary cannot be negative'],
      // salaryMax >= salaryMin enforced in pre('save') below
    },

    // ── Deadline ───────────────────────────────────────────────────────────────
    applicationDeadline: {
      type:    Date,
      default: null,
      // Must be a future date — enforced at controller/service level (Doc 04 §8)
    },

    // ── Status ─────────────────────────────────────────────────────────────────
    status: {
      type:    String,
      enum:    {
        values:  JOB_STATUSES,
        message: `Status must be one of: ${JOB_STATUSES.join(', ')}`,
      },
      default: 'draft',
    },

    // ── Relationships ──────────────────────────────────────────────────────────
    company: {
      type:     Schema.Types.ObjectId,
      ref:      'Company',
      required: [true, 'Company is required'],
    },

    createdBy: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'createdBy (Recruiter) is required'],
    },

    // ── Denormalized stat ──────────────────────────────────────────────────────
    // Incremented by Application post('save') hook in Module 5.
    // Avoids expensive $lookup on dashboard stats.
    applicationCount: {
      type:    Number,
      default: 0,
      min:     0,
    },

    // ── Soft delete ────────────────────────────────────────────────────────────
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
// Doc 04: status + isDeleted — public board query
jobSchema.index({ status: 1, isDeleted: 1 });
// Doc 04: department — HM scoped queries
jobSchema.index({ department: 1 });
// Doc 04: createdAt — sort by newest
jobSchema.index({ createdAt: -1 });
// Doc 04: salaryMin — sort by salary
jobSchema.index({ salaryMin: 1 });
// Recruiter queries — all their jobs
jobSchema.index({ createdBy: 1, isDeleted: 1 });

// ─── Pre-save middleware ───────────────────────────────────────────────────────
// Doc 04 §9: Validate salaryMax >= salaryMin when both are set
jobSchema.pre('save', function (next) {
  if (
    this.salaryMin !== null &&
    this.salaryMin !== undefined &&
    this.salaryMax !== null &&
    this.salaryMax !== undefined &&
    this.salaryMax < this.salaryMin
  ) {
    const err = new Error('salaryMax must be greater than or equal to salaryMin');
    err.statusCode = 400;
    err.errorCode  = 'SALARY_RANGE_INVALID';
    return next(err);
  }
  next();
});

const Job = mongoose.model('Job', jobSchema);

export default Job;
