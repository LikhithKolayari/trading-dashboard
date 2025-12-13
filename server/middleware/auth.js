"use strict";

export function requireAuth(req, res, next) {
  try {
    if (req.session?.userId) return next();
    return res.status(401).json({ error: "Unauthorized" });
  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
