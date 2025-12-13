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
