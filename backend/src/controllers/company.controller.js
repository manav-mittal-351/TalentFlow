// ─── controllers/company.controller.js ───────────────────────────────────────
// Thin controller layer for company endpoints.
// No business logic here — all logic is in company.service.js.
// Doc reference: Document 5 — API Design §10 (Company Routes)

import {
  getCompany,
  createCompany,
  updateCompany,
} from '../services/company.service.js';
import { success } from '../utils/apiResponse.js';

// ─── GET /api/v1/company — Public ─────────────────────────────────────────────
/**
 * Returns the company profile. If no company exists yet, returns empty data.
 * Public — no authentication required.
 *
 * Response 200: { success, message, data: <company> | null }
 */
export const getCompanyProfile = async (req, res, next) => {
  try {
    const company = await getCompany();

    if (!company) {
      // V1: company hasn't been created yet — return null gracefully (not a 404)
      return success(res, 'No company profile found', null);
    }

    return success(res, 'Company profile fetched successfully', company);
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/v1/company — Recruiter ─────────────────────────────────────────
/**
 * Creates the company profile.
 * V1: only one company allowed per platform instance.
 * Validated by createCompanyValidator + validate middleware before this runs.
 *
 * Response 201: { success, message, data: <company> }
 */
export const createCompanyProfile = async (req, res, next) => {
  try {
    const { name, logoUrl, website, location, industry, description } = req.body;
    const company = await createCompany(
      { name, logoUrl, website, location, industry, description },
      req.user.id
    );
    return success(res, 'Company profile created successfully', company, 201);
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/v1/company — Recruiter ────────────────────────────────────────
/**
 * Partially updates the company profile.
 * Only fields included in the request body are updated.
 * Validated by updateCompanyValidator + validate middleware before this runs.
 *
 * Response 200: { success, message, data: <company> }
 */
export const updateCompanyProfile = async (req, res, next) => {
  try {
    const { name, logoUrl, website, location, industry, description } = req.body;
    const company = await updateCompany(
      { name, logoUrl, website, location, industry, description },
      req.user.id
    );
    return success(res, 'Company profile updated successfully', company);
  } catch (err) {
    next(err);
  }
};
