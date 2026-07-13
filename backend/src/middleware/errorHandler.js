// ─── middleware/errorHandler.js ───────────────────────────────────────────────
// Global error handler — registered as the LAST middleware in app.js.
// Catches all errors passed via next(err) from controllers and services.
// Doc reference: Document 5 — API Design §4 (Error Response Shape)
//                Document 6 — Folder Structure (middleware/errorHandler.js)
//
// Error shape returned:
// {
//   success: false,
//   message: "Human-readable error",
//   errorCode: "MACHINE_READABLE_CODE",
//   stack: "..." (development only)
// }

import { env } from '../config/env.js';

/**
 * Global Express error handler.
 * All services throw plain Error objects with optional statusCode and errorCode
 * properties; this middleware normalises them into the documented response shape.
 *
 * @param {Error & { statusCode?: number, errorCode?: string }} err
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  // Only log genuine unexpected server errors (5xx).
  // Intentional 4xx paths (bad credentials, CastError, ValidationError) are
  // normal client errors — logging them as "server errors" pollutes dev output.
  const isCastOrValidation = err.name === 'CastError' || err.name === 'ValidationError';
  const is4xx = err.statusCode && err.statusCode < 500;
  if (env.NODE_ENV === 'development' && !is4xx && !isCastOrValidation) {
    console.error('💥 Server error:', err);
  }

  // Mongoose duplicate key error (code 11000)
  // Different unique constraints map to different documented error codes.
  if (err.code === 11000) {
    const keyValue = err.keyValue || {};
    const keys     = Object.keys(keyValue);

    // job + candidate compound index → candidate already applied
    if (keys.includes('job') && keys.includes('candidate')) {
      return res.status(409).json({
        success:   false,
        message:   'You have already applied to this job',
        errorCode: 'ALREADY_APPLIED',
      });
    }

    // email unique index → duplicate user registration
    const field = keys[0] || 'field';
    return res.status(409).json({
      success:   false,
      message:   `An account with this ${field} already exists`,
      errorCode: 'EMAIL_ALREADY_EXISTS',
    });
  }


  // Mongoose validation error (schema-level)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message).join(', ');
    return res.status(400).json({
      success:   false,
      message:   messages,
      errorCode: 'VALIDATION_ERROR',
    });
  }

  // Mongoose CastError (e.g. invalid ObjectId in URL param)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success:   false,
      message:   `Invalid value for ${err.path}: "${err.value}"`,
      errorCode: 'VALIDATION_ERROR',
    });
  }

  // All other errors — services throw these with statusCode + errorCode attached
  const statusCode = err.statusCode || 500;
  const errorCode  = err.errorCode  || 'INTERNAL_ERROR';
  const message    = err.message    || 'An unexpected error occurred';

  const body = { success: false, message, errorCode };

  // Only expose stack trace in development
  if (env.NODE_ENV === 'development') {
    body.stack = err.stack;
  }

  return res.status(statusCode).json(body);
};
