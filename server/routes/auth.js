"use strict";

import express from "express";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import { readUsers, writeUsers, findUserByEmail, findUserById } from "../utils/fileDb.js";
import { isValidEmail, isValidName, isValidDate, PASSWORD_MIN } from "../utils/validation.js";
import { sanitizeUser } from "../utils/userHelpers.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// POST /api/signup
router.post("/signup", async (req, res) => {
  try {
    const { firstName, lastName, dateOfBirth, email, password } = req.body || {};

    // Validate payload data
    if (!isValidName(firstName)) return res.status(400).json({ error: "Invalid first name" });
    if (!isValidName(lastName)) return res.status(400).json({ error: "Invalid last name" });
    if (!isValidDate(dateOfBirth))
      return res.status(400).json({ error: "Invalid dateOfBirth (YYYY-MM-DD)" });
    if (!isValidEmail(email)) return res.status(400).json({ error: "Invalid email" });
    if (typeof password !== "string" || password.length < PASSWORD_MIN)
      return res
        .status(400)
        .json({ error: `Password must be at least ${PASSWORD_MIN} characters` });

    const existing = await findUserByEmail(email);
    if (existing) return res.status(409).json({ error: "Email already registered" });

    const passwordHash = await bcrypt.hash(password, PASSWORD_MIN);

    const newUser = {
      id: randomUUID(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth,
      email: email.toLowerCase().trim(),
      passwordHash,
    };

    const users = await readUsers();
    users.push(newUser);
    await writeUsers(users);

    return res.status(201).json({ message: "Signup successful. Please log in." });
  } catch (err) {
    console.error("/signup error", { message: err?.message });
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!isValidEmail(email) || typeof password !== "string") {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const user = await findUserByEmail(email);
    if (!user) return res.status(404).json({ error: "User not found" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Invalid email or password" });

    // Establish session
    req.session.userId = user.id;

    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("/login error", { message: err?.message });
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/logout
router.post("/logout", requireAuth, (req, res) => {
  try {
    if (!req.session) return res.status(200).json({ message: "Logged out" });
    req.session.destroy((err) => {
      if (err) {
        console.error("/logout error", { message: err?.message });
        return res.status(500).json({ error: "Internal server error" });
      }
      res.clearCookie("sid");
      return res.status(200).json({ message: "Logged out" });
    });
  } catch (err) {
    console.error("/logout catch", { message: err?.message });
    return res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/session
router.get("/session", requireAuth, async (req, res) => {
  try {
    const id = req.session.userId;
    const user = await findUserById(id);
    if (!user) return res.status(401).json({ error: "Unauthorized" });
    return res.status(200).json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error("/session error", { message: err?.message });
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
