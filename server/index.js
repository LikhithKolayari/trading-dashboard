"use strict";

import express from "express";
import cors from "cors";
import session from "express-session";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";
import authRouter from "./routes/auth.js";
import watchlistRouter from "./routes/watchlist.js";
import { ensureUsersCollection } from "./utils/dbInit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security headers
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        // Allow Vite dev server and API
        "connect-src": ["'self'", "http://localhost:3001", "ws://localhost:*"],
      },
    },
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "100kb" }));

// CORS for frontend dev server
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
  })
);

// Session configuration
const oneDayMs = 24 * 60 * 60 * 1000;
const sessionName = "sid";
const sessionSecret = process.env.SESSION_SECRET || crypto.randomBytes(48).toString("hex");

app.use(
  session({
    name: sessionName,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: oneDayMs,
    },
  })
);

// Health check
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Routes
app.use("/api", authRouter);
app.use("/api", watchlistRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// Error handler
app.use((err, _req, res, _next) => {
  console.error("Server error", { message: err?.message });
  res.status(500).json({ error: "Internal server error" });
});

const PORT = Number(process.env.PORT) || 3001;

(async () => {
  try {
    /**
     * - Initialize database
     * - Setup users collection
     */
    await ensureUsersCollection();
  } catch (err) {
    console.error("Database initialization failed", { message: err?.message });
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Auth server listening on http://localhost:${PORT}`);
    console.log(`CORS origin: ${FRONTEND_ORIGIN}`);
  });
})();
