// backend/middleware/permissions.js
// Unix-style permission model:
//   Owner  → Full control (create, read, comment, approve, delete)
//   Group  → Read + Comment + Approve (reviewers)
//   Others → Read-Only (viewers) / Deny for mutations

const store = require("../models/store");

// Permission levels (bitmask-style, higher = more access)
const LEVELS = { deny: 0, read: 1, comment: 2, approve: 3, full: 4 };

function resolveLevel(user, pr) {
  if (!user) return LEVELS.deny;
  if (user.role === "owner" || pr?.authorId === user.id) return LEVELS.full;
  if (user.role === "reviewer" || pr?.reviewers?.includes(user.id)) return LEVELS.approve;
  if (user.role === "viewer") return LEVELS.read;
  return LEVELS.deny;
}

/**
 * Require at least `level` permission for the PR in req.params.id (or req.body.prId).
 * Usage:  router.post("/reviews", auth, requirePermission("approve"), addReview)
 */
function requirePermission(level) {
  return (req, res, next) => {
    const prId = req.params.id || req.body.prId;
    const pr = prId ? store.findPR(prId) : null;

    const userLevel = resolveLevel(req.user, pr);
    const required = LEVELS[level] ?? LEVELS.read;

    if (userLevel < required) {
      const msg = {
        deny: "Access denied.",
        read: "You do not have read access to this resource.",
        comment: "You need at least reviewer access to comment.",
        approve: "You need reviewer or owner access to approve/reject.",
        full: "Only the PR author or owner can perform this action.",
      }[level] || "Insufficient permissions.";
      return res.status(403).json({ error: msg, required: level, yourRole: req.user?.role });
    }

    // Attach resolved level to request for controllers to use if needed
    req.permissionLevel = userLevel;
    next();
  };
}

module.exports = { requirePermission, resolveLevel, LEVELS };
