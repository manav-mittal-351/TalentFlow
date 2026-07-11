// ─── services/auth.service.js ─────────────────────────────────────────────────
// Business logic for authentication.
// Controllers are thin — they call these service functions and send the result.
// Doc reference: Document 5 — API Design §8 (Auth routes)
//                Document 5 — Error codes table
//                Document 4 — Database Schema §1 (users)

import bcrypt from 'bcryptjs';
import User from '../models/User.model.js';
import { generateToken } from '../utils/generateToken.js';

// ─── Helper: build a safe user object to return in responses ─────────────────
// Never includes passwordHash — toJSON transform also ensures this.
const safeUser = (user) => ({
  _id:  user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  profile: user.profile,
  createdAt: user.createdAt,
});

// ─── Register ─────────────────────────────────────────────────────────────────
/**
 * Creates a new user account.
 *
 * @param {{ name: string, email: string, password: string, role?: string }} payload
 * @returns {{ token: string, user: object }}
 * @throws 409 EMAIL_ALREADY_EXISTS — if email is already in use
 */
export const registerUser = async ({ name, email, password, role = 'candidate' }) => {
  // Check for duplicate email before hashing (faster fail path)
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    const err = new Error('An account with this email already exists');
    err.statusCode = 409;
    err.errorCode  = 'EMAIL_ALREADY_EXISTS';
    throw err;
  }

  // Hash password — bcryptjs saltRounds: 12 (good balance of security/speed)
  // Doc note: "min 8 chars enforced at controller level before hashing" (we do it in validator)
  const salt         = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create user document
  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
  });

  // Generate JWT — payload: { id, role }
  const token = generateToken(user._id, user.role);

  return {
    token,
    user: safeUser(user),
  };
};

// ─── Login ────────────────────────────────────────────────────────────────────
/**
 * Authenticates a user by email + password.
 *
 * @param {{ email: string, password: string }} payload
 * @returns {{ token: string, user: object }}
 * @throws 401 INVALID_TOKEN — invalid credentials (generic message prevents email enumeration)
 */
export const loginUser = async ({ email, password }) => {
  // Explicitly select passwordHash (excluded by default via select:false)
  const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

  // Generic error message — does not reveal whether the email exists
  // (prevents user enumeration attacks)
  const credentialError = () => {
    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    err.errorCode  = 'INVALID_TOKEN';
    return err;
  };

  if (!user) throw credentialError();

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) throw credentialError();

  const token = generateToken(user._id, user.role);

  return {
    token,
    user: safeUser(user),
  };
};

// ─── Get Me ───────────────────────────────────────────────────────────────────
/**
 * Returns the full profile of the authenticated user.
 * Called by GET /auth/me — req.user.id comes from verifyToken.
 *
 * @param {string} userId - MongoDB ObjectId string from JWT payload
 * @returns {object} Full user document (minus passwordHash)
 * @throws 404 USER_NOT_FOUND
 */
export const getAuthenticatedUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    err.errorCode  = 'USER_NOT_FOUND';
    throw err;
  }

  return user; // toJSON transform removes passwordHash automatically
};
