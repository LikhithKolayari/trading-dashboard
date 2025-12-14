"use strict";

import { getDb, hardenDbPerms } from "./dbInit.js";

export async function readUsers() {
  const db = getDb();
  try {
    const data = await db.getData("/users");
    return Array.isArray(data) ? data : [];
  } catch {
    // Setup initial DB structure as failsafe when data is missing or corrupted
    await db.push("/users", [], true);
    return [];
  }
}

export async function writeUsers(users) {
  if (!Array.isArray(users)) throw new Error("users must be an array");
  // Create a shallow copy
  const safeUsers = users.map((u) => ({ ...u }));
  const db = getDb();
  await db.push("/users", safeUsers, true);
  await hardenDbPerms();
}

export async function findUserByEmail(email) {
  if (typeof email !== "string") return null;
  const users = await readUsers();
  return (
    users.find(
      (u) => typeof u?.email === "string" && u.email.toLowerCase() === email.toLowerCase()
    ) || null
  );
}

export async function findUserById(id) {
  const users = await readUsers();
  return users.find((u) => u.id === id) || null;
}

// Watchlist helpers
export async function getUserWatchlist(userId) {
  if (typeof userId !== "string" || !userId) return [];
  const user = await findUserById(userId);
  const list = Array.isArray(user?.watchlist) ? user.watchlist : [];
  // Normalize to uppercase unique symbols
  const set = new Set(list.filter((s) => typeof s === "string").map((s) => s.toUpperCase()));
  return Array.from(set);
}

export async function saveUserWatchlist(userId, symbols) {
  if (!Array.isArray(symbols)) throw new Error("symbols must be an array");
  const users = await readUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) throw new Error("user not found");
  const unique = Array.from(
    new Set(symbols.filter((s) => typeof s === "string").map((s) => s.toUpperCase()))
  );
  users[idx] = { ...users[idx], watchlist: unique };
  await writeUsers(users);
  return unique;
}

export async function addSymbolToWatchlist(userId, symbol, limit = 5) {
  if (typeof symbol !== "string") throw new Error("invalid symbol");
  const s = symbol.trim().toUpperCase();
  const current = await getUserWatchlist(userId);
  if (current.includes(s)) {
    const err = new Error("duplicate");
    err.code = "DUPLICATE";
    throw err;
  }
  if (current.length >= limit) {
    const err = new Error("limit");
    err.code = "LIMIT";
    err.limit = limit;
    throw err;
  }
  const next = [...current, s];
  const saved = await saveUserWatchlist(userId, next);
  return saved;
}

export async function removeSymbolFromWatchlist(userId, symbol) {
  if (typeof symbol !== "string") return await getUserWatchlist(userId);
  const s = symbol.trim().toUpperCase();
  const current = await getUserWatchlist(userId);
  const next = current.filter((x) => x !== s);
  return await saveUserWatchlist(userId, next);
}
