// ─── controllers/auth.controller.js ──────────────────────────────────────────
// Thin controller layer — parses req, calls the service, sends the response.
// No business logic lives here; all logic is in auth.service.js.
// Doc reference: Document 5 — API Design §8 (Auth routes)
//                Document 6 — Folder Structure (controllers are thin)

import {
  registerUser,
  loginUser,
  getAuthenticatedUser,
} from '../services/auth.service.js';
import { success } from '../utils/apiResponse.js';

// ─── POST /api/v1/auth/register ───────────────────────────────────────────────
/**
 * Public. Rate-limited (10 req / 15 min — configured in app.js).
 * Validated by registerValidator + validate middleware before this runs.
 *
 * Response 201: { success, message, data: { token, user } }
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const data = await registerUser({ name, email, password, role });
    return success(res, 'Registration successful. Welcome to TalentFlow!', data, 201);
  } catch (err) {
    next(err); // forwarded to errorHandler.js
  }
};

// ─── POST /api/v1/auth/login ──────────────────────────────────────────────────
/**
 * Public. Rate-limited (10 req / 15 min — configured in app.js).
 * Validated by loginValidator + validate middleware before this runs.
 *
 * Response 200: { success, message, data: { token, user } }
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const data = await loginUser({ email, password });
    return success(res, 'Login successful', data, 200);
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/v1/auth/me ──────────────────────────────────────────────────────
/**
 * Protected — all authenticated roles.
 * verifyToken middleware runs first; req.user = { id, role } is already set.
 *
 * Response 200: { success, message, data: <full user document> }
 */
export const me = async (req, res, next) => {
  try {
    const user = await getAuthenticatedUser(req.user.id);
    return success(res, 'User profile fetched successfully', user);
  } catch (err) {
    next(err);
  }
};
