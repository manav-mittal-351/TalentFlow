// ─── utils/apiResponse.js ─────────────────────────────────────────────────────
// Standardised response builders — every controller uses these.
// Keeps JSON shape consistent across all 44 endpoints.
// Doc reference: Document 5 — API Design §6 (Global Response Conventions)
//
// Success shape:  { success: true,  message, data }
// Error shape:    { success: false, message, errorCode, errors? }

/**
 * Send a successful JSON response.
 *
 * @param {import('express').Response} res
 * @param {string}  message     - Human-readable success message
 * @param {*}       [data={}]   - Response payload
 * @param {number}  [status=200]- HTTP status code
 */
export const success = (res, message, data = {}, status = 200) => {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error JSON response.
 *
 * @param {import('express').Response} res
 * @param {string}   message         - Human-readable error description
 * @param {string}   [errorCode]     - Machine-readable code (e.g. 'EMAIL_ALREADY_EXISTS')
 * @param {number}   [status=500]    - HTTP status code
 * @param {Array}    [errors=[]]     - Optional validation errors array
 */
export const error = (res, message, errorCode = 'INTERNAL_ERROR', status = 500, errors = []) => {
  const body = {
    success: false,
    message,
    errorCode,
  };

  // Only include errors array when non-empty (validation failures)
  if (errors.length > 0) {
    body.errors = errors;
  }

  return res.status(status).json(body);
};
