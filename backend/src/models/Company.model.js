// ─── models/Company.model.js ──────────────────────────────────────────────────
// Defines the `companies` collection schema.
// Doc reference: Document 4 — Database Schema §2 (`companies` collection)
//
// Design Decision (Doc 04):
//   One company document per platform instance in V1.
//   Multi-tenancy via organizationId is a V2 concern.
//
// Soft delete: isDeleted flag — document is never physically removed.
// createdBy: always a Recruiter user ObjectId.

import mongoose from 'mongoose';

const { Schema } = mongoose;

const companySchema = new Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Company name is required'],
      trim:      true,
      maxlength: [200, 'Company name cannot exceed 200 characters'],
    },

    logoUrl: {
      type:    String,
      default: '',
      // Local path in V1 — e.g. uploads/logos/logo.png
      // V2: Cloudinary URL
    },

    website: {
      type:    String,
      default: '',
      match:   [
        /^(https?:\/\/).+/,
        'Website must start with http:// or https://',
      ],
    },

    location: {
      type:      String,
      default:   '',
      maxlength: [100, 'Location cannot exceed 100 characters'],
      trim:      true,
    },

    industry: {
      type:      String,
      default:   '',
      maxlength: [100, 'Industry cannot exceed 100 characters'],
      trim:      true,
    },

    description: {
      type:      String,
      default:   '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      trim:      true,
    },

    // ── Relationship ──────────────────────────────────────────────────────────
    createdBy: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'createdBy (Recruiter) is required'],
    },

    // ── Soft delete ───────────────────────────────────────────────────────────
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
// Filter deleted companies from all queries
companySchema.index({ isDeleted: 1 });

const Company = mongoose.model('Company', companySchema);

export default Company;
