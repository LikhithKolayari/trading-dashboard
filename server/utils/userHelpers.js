"use strict";

/**
 * User-related helper functions
 */

/**
 * Return a sanitized user object without sensitive fields.
 * Removes passwordHash and any other secret fields if added in the future.
 */
export function sanitizeUser(user) {
  const { passwordHash, ...safe } = user || {};
  return safe;
}
