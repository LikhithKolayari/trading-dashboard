"use strict";

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { JsonDB, Config } from "node-json-db";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DB paths
const dataDir = path.resolve(__dirname, "../data");
const dbBasePath = path.join(dataDir, "db");
const dbJsonPath = `${dbBasePath}.json`;

let dbInstance = null;

export async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true, mode: 0o700 }).catch(() => {});
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = new JsonDB(new Config(dbBasePath, true, true, "/"));
  }
  return dbInstance;
}

export async function ensureUsersCollection() {
  await ensureDataDir();
  const db = getDb();

  // Ensure users array exists using exists() to avoid throwing
  try {
    const exists = await db.exists("/users");
    if (!exists) {
      await db.push("/users", [], true);
    } else {
      const v = await db.getData("/users");
      if (!Array.isArray(v)) await db.push("/users", [], true);
    }
  } catch {
    // If any error occurs, force initialize
    await db.push("/users", [], true);
  }

  await hardenDbPerms();
}

export async function hardenDbPerms() {
  try {
    await fs.chmod(dbJsonPath, 0o600);
  } catch {
    // ignore
  }
}
