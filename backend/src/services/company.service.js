// ─── services/company.service.js ─────────────────────────────────────────────
// Business logic for company profile management.
// Doc reference: Document 5 — API Design §10 (Company Routes)
//                Document 4 — Database Schema §2 (companies)
//
// V1 design decision: One company document per platform instance.
// GET is public. POST/PATCH are Recruiter-only.
//
// Service functions throw Error objects with statusCode + errorCode
// so the global errorHandler normalises them into the documented shape.

import Company from '../models/Company.model.js';

// ─── GET /company — Public ────────────────────────────────────────────────────
/**
 * Fetches the company profile.
 * Returns null-safe response: if no company exists yet, returns null
 * (the controller sends an empty data object, not a 404).
 *
 * @returns {object|null} Company document or null
 */
export const getCompany = async () => {
  // V1: single company — return the first non-deleted document
  const company = await Company.findOne({ isDeleted: false })
    .populate('createdBy', 'name email'); // show who created it
  return company;
};

// ─── POST /company — Recruiter ────────────────────────────────────────────────
/**
 * Creates the company profile.
 * V1: Only one company is allowed. Returns 409 if one already exists.
 *
 * @param {object} payload  - { name, logoUrl?, website?, location?, industry?, description? }
 * @param {string} userId   - Recruiter's MongoDB _id (from req.user.id)
 * @returns {object}        Created company document
 * @throws 409 COMPANY_ALREADY_EXISTS
 */
export const createCompany = async (payload, userId) => {
  // V1 constraint: single company per platform instance
  const existing = await Company.findOne({ isDeleted: false });
  if (existing) {
    const err = new Error('A company profile already exists. Use PATCH to update it.');
    err.statusCode = 409;
    err.errorCode  = 'COMPANY_ALREADY_EXISTS';
    throw err;
  }

  const company = await Company.create({
    ...payload,
    createdBy: userId,
  });

  return company;
};

// ─── PATCH /company — Recruiter (partial update) ──────────────────────────────
/**
 * Partially updates the company profile.
 * Only provided fields are updated (PATCH semantics — not PUT).
 * Doc: "PATCH for partial updates — Never PUT unless replacing the full document"
 *
 * @param {object} payload  - Partial company fields to update
 * @param {string} userId   - Recruiter's MongoDB _id (for audit — not enforced in V1)
 * @returns {object}        Updated company document
 * @throws 404 COMPANY_NOT_FOUND
 */
export const updateCompany = async (payload, userId) => {
  const company = await Company.findOne({ isDeleted: false });

  if (!company) {
    const err = new Error('No company profile found. Create one first with POST /company.');
    err.statusCode = 404;
    err.errorCode  = 'COMPANY_NOT_FOUND';
    throw err;
  }

  // Apply only the provided fields (partial update)
  // Object.assign ensures undefined fields don't overwrite existing values
  const allowedFields = ['name', 'logoUrl', 'website', 'location', 'industry', 'description'];
  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) {
      company[field] = payload[field];
    }
  });

  await company.save();

  return company;
};
