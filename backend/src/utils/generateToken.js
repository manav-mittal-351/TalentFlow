// ─── utils/generateToken.js ───────────────────────────────────────────────────
// JWT generation helper — called from auth.service.js after successful
// register and login operations.
// Doc reference: Document 6 — Folder Structure (utils/generateToken.js)
//                Document 7 — Tech Stack (jsonwebtoken 9.x)

import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

/**
 * Signs and returns a JWT for the given user.
 *
 * Payload: { id, role }
 *   - id   — MongoDB ObjectId as string (used by verifyToken → req.user.id)
 *   - role — user role (used by authorizeRoles without an extra DB query)
 *
 * @param {string} userId  - MongoDB _id of the user
 * @param {string} role    - One of: recruiter | hiring_manager | candidate
 * @returns {string}       Signed JWT string
 */
export const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId.toString(), role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
};
