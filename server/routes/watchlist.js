"use strict";

import express from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  addSymbolToWatchlist,
  getUserWatchlist,
  removeSymbolFromWatchlist,
  findUserById,
} from "../utils/fileDb.js";
import { isValidSymbol } from "../utils/validation.js";

const router = express.Router();
const WATCHLIST_LIMIT = 5;

// GET /api/watchlist
router.get("/watchlist", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await findUserById(userId);
    if (!user) return res.status(401).json({ error: "Unauthorized" });

    const symbols = await getUserWatchlist(userId);
    return res.status(200).json({ symbols });
  } catch (err) {
    console.error("/watchlist GET error", { message: err?.message });
    return res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/watchlist
router.post("/watchlist", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { symbol } = req.body || {};
    const s = typeof symbol === "string" ? symbol.trim().toUpperCase() : "";
    if (!isValidSymbol(s)) return res.status(400).json({ error: "Invalid symbol" });

    try {
      const symbols = await addSymbolToWatchlist(userId, s, WATCHLIST_LIMIT);
      return res.status(200).json({ symbols });
    } catch (e) {
      if (e && e.code === "DUPLICATE") {
        return res.status(409).json({ error: "Symbol already in watchlist" });
      }
      if (e && e.code === "LIMIT") {
        const current = await getUserWatchlist(userId);
        return res.status(409).json({
          error: "Watchlist limit reached",
          limit: WATCHLIST_LIMIT,
          current: current.length,
        });
      }
      throw e;
    }
  } catch (err) {
    console.error("/watchlist POST error", { message: err?.message });
    return res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/watchlist/:symbol
router.delete("/watchlist/:symbol", requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const symbolParam = (req.params?.symbol || "").trim().toUpperCase();
    if (!isValidSymbol(symbolParam)) return res.status(400).json({ error: "Invalid symbol" });

    const symbols = await removeSymbolFromWatchlist(userId, symbolParam);
    return res.status(200).json({ symbols });
  } catch (err) {
    console.error("/watchlist DELETE error", { message: err?.message });
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
