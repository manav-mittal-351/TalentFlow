// ─── utils/paginate.js ────────────────────────────────────────────────────────
// Shared pagination helper — used by all list endpoints.
// Doc reference: Document 5 — API Design §5 (Pagination Convention)
//
// Default: page=1, limit=10. Maximum limit=50.
// Response shape: { total, page, limit, totalPages, hasNextPage, hasPrevPage }

/**
 * Extracts and sanitises page/limit from query params.
 *
 * @param {object} query - req.query object
 * @returns {{ page: number, limit: number, skip: number }}
 */
export const paginate = (query = {}) => {
  const page  = Math.max(1, parseInt(query.page,  10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Builds the pagination metadata object included in every list response.
 *
 * @param {number} total  - Total documents matching the query (from countDocuments)
 * @param {number} page   - Current page number
 * @param {number} limit  - Items per page
 * @returns {object}      Pagination metadata
 */
export const buildPagination = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit) || 1; // at least 1 page even when empty
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
