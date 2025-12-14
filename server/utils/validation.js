"use strict";

/**
 * Minimum password length
 */
export const PASSWORD_MIN = 14;

/**
 * Validates basic email format.
 * - Max length 254
 * - Simple RFC5322-ish pattern without allowing spaces
 */
export const isValidEmail = (email) =>
  typeof email === "string" && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * Validates a human name string.
 * - Non-empty when trimmed
 * - Max length 100
 */
export const isValidName = (name) =>
  typeof name === "string" && name.trim().length > 0 && name.length <= 100;

/**
 * Validates a date string in YYYY-MM-DD format.
 */
export const isValidDate = (date) => typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date);

/**
 * Validates a trading symbol.
 * - Uppercase A-Z and digits only
 * - Length between 4 and 20
 */
export const isValidSymbol = (symbol) =>
  typeof symbol === "string" && /^[A-Z0-9]{4,20}$/.test(symbol.trim());
