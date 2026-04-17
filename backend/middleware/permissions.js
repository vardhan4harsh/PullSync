// ============================================================
// middleware/permissions.js — Controls what each user can do
// OWNER: Gaurav Parashar
// Permission levels (lowest to highest):
//   deny    → No access at all
//   read    → Can view PRs and comments
//   comment → Can also post comments
//   approve → Can also approve or reject PRs
//   full    → Can do everything (owner or PR author)
//
// Roles map to permission levels like this:
//   owner   → full
//   reviewer → approve
//   viewer  → read
// ============================================================

const store = require("../models/store");
const PullRequest = require("../../database/models/PullRequest");

// Numeric values for each permission level (higher = more access)
const LEVELS = { deny: 0, read: 1, comment: 2, approve: 3, full: 4 };

// Figure out what permission level a user has for a specific PR
function resolveLevel(user, pr) {
  if (!user) return LEVELS.deny;

  // Owners always have full access to everything
  if (user.role === "owner") return LEVELS.full;

  // The person who created the PR has full control over it
  if (pr && pr.authorId) {
    const authorId = pr.authorId.toString ? pr.authorId.toString() : pr.authorId;
    const userId = user.id.toString ? user.id.toString() : user.id;
    if (authorId === userId) return LEVELS.full;
  }

  // Reviewers can approve or reject PRs
  if (user.role === "reviewer") return LEVELS.approve;

  // Check if this user is specifically assigned as a reviewer on this PR
  if (pr && pr.reviewers) {
    const userIdStr = user.id.toString ? user.id.toString() : user.id;
    const reviewers = pr.reviewers.map((r) => (r.toString ? r.toString() : r));
    if (reviewers.includes(userIdStr)) return LEVELS.approve;
  }

  // Viewers can only read, not write anything
  if (user.role === "viewer") return LEVELS.read;

  return LEVELS.deny;
}

// Middleware factory — call this with a permission level string to protect a route
// Example: router.post("/reviews", auth, requirePermission("approve"), addReview)
function requirePermission(level) {
  return async (req, res, next) => {
    // Get the PR ID from the URL params or the request body
    const prId = req.params.id || req.body.prId;
    let pr = null;

    if (prId) {
      // Try to find the PR in MongoDB first
      try {
        pr = await PullRequest.findById(prId);
      } catch (e) {
        // If the ID isn't a MongoDB ID format, that's fine — check store next
      }

      // If not in MongoDB, check the in-memory store
      if (!pr) {
        pr = store.findPR(prId);
      }
    }

    const userLevel = resolveLevel(req.user, pr);
    const required = LEVELS[level] ?? LEVELS.read;

    // If the user doesn't have enough permission, send a 403 error
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

    // Store the resolved level on the request in case a controller needs it
    req.permissionLevel = userLevel;
    next();
  };
}

module.exports = { requirePermission, resolveLevel, LEVELS };
