// ============================================================
// controllers/adminController.js — Admin-only batch operations
// OWNER: Gaurav Parashar
// These routes can only be used by someone with the "owner" role.
// They let the owner do bulk actions like:
//   - Assigning reviewers to a PR
//   - Auto-closing PRs that haven't been updated in a long time
//   - Viewing a summary report of all PRs
//   - Changing a user's role/permission level
// ============================================================

const store = require("../models/store");
const { cache, keys } = require("../services/cache");

// Check if the logged-in user is an owner — used as middleware
function ownerOnly(req, res, next) {
  if (req.user?.role !== "owner") {
    return res.status(403).json({ error: "Owner access required for batch operations" });
  }
  next();
}

// POST /api/admin/assign-reviewers
// Body: { prId, reviewerIds: ["u2", "u3"] }
// Adds the given users as reviewers on the specified PR
const assignReviewers = async (req, res, next) => {
  try {
    const { prId, reviewerIds } = req.body;

    if (!prId || !Array.isArray(reviewerIds)) {
      return res.status(400).json({ error: "prId and reviewerIds[] required" });
    }

    const pr = store.findPR(prId);
    if (!pr) return res.status(404).json({ error: "PR not found" });

    // Merge the new reviewer IDs with existing ones (no duplicates)
    pr.reviewers = [...new Set([...pr.reviewers, ...reviewerIds])];
    pr.updatedAt = new Date();

    // Clear the cached version of this PR so the next request gets fresh data
    await cache.del(keys.prDetail(prId));

    // Notify newly assigned reviewers via WebSocket
    const io = req.app.get("io");
    reviewerIds.forEach((rid) => {
      io?.to(`user:${rid}`).emit("new_pr", {
        prId: pr.id,
        title: pr.title,
        number: pr.number,
        message: "You were assigned as reviewer",
      });
    });

    res.json({ data: pr, message: `Assigned ${reviewerIds.length} reviewer(s) to PR #${pr.number}` });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/close-stale
// Body: { days? } — defaults to 30 days
// Marks all open PRs that haven't been updated in `days` days as rejected
const closeStale = async (req, res, next) => {
  try {
    const { days = 30 } = req.body;
    const cutoff = new Date(Date.now() - days * 864e5); // 864e5 = milliseconds in one day

    // Find PRs that are still open but haven't been touched since the cutoff date
    const stale = store.pullRequests.filter(
      (p) => p.status === "open" && new Date(p.updatedAt) < cutoff
    );

    // Close all of them
    stale.forEach((pr) => {
      pr.status = "rejected";
      pr.updatedAt = new Date();
    });

    // Clear their cached entries
    await Promise.all([
      ...stale.map((p) => cache.del(keys.prDetail(p.id))),
      cache.delByPrefix("pr:list:"),
    ]);

    res.json({
      data: stale.map((p) => ({ id: p.id, number: p.number, title: p.title })),
      message: `Closed ${stale.length} stale PR(s) (not updated in ${days} days)`,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/report
// Returns overall stats: total PRs, breakdown by status, reviewer activity
const getReport = async (req, res, next) => {
  try {
    const prs = store.pullRequests;

    const report = {
      generatedAt: new Date(),
      total: prs.length,
      byStatus: {
        open: prs.filter((p) => p.status === "open").length,
        approved: prs.filter((p) => p.status === "approved").length,
        rejected: prs.filter((p) => p.status === "rejected").length,
      },
      totalComments: store.comments.length,
      totalReviews: store.reviews.length,
      // For each reviewer, show how many reviews they've submitted
      reviewers: store.users
        .filter((u) => u.role === "reviewer")
        .map((u) => ({
          id: u.id,
          name: u.name,
          reviews: store.reviews.filter((r) => r.reviewerId === u.id).length,
        })),
    };

    res.json({ data: report });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/bulk-update-permissions
// Body: { userId, role }
// Changes a user's role to owner, reviewer, or viewer
const updatePermissions = async (req, res, next) => {
  try {
    const { userId, role } = req.body;

    if (!["owner", "reviewer", "viewer"].includes(role)) {
      return res.status(400).json({ error: "role must be owner, reviewer, or viewer" });
    }

    const user = store.findUser(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.role = role;
    res.json({ data: user, message: `Updated ${user.name}'s role to ${role}` });
  } catch (err) {
    next(err);
  }
};

module.exports = { ownerOnly, assignReviewers, closeStale, getReport, updatePermissions };
