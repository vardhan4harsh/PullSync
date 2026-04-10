// backend/controllers/adminController.js
// Admin batch operations — called by REST API or shell scripts (curl).
// All routes require role === "owner".

const store = require("../models/store");
const { cache, keys } = require("../services/cache");

// ── Guard: owner only ─────────────────────────────────────────
function ownerOnly(req, res, next) {
  if (req.user?.role !== "owner") {
    return res.status(403).json({ error: "Owner access required for batch operations" });
  }
  next();
}

// POST /api/admin/assign-reviewers
// Body: { prId, reviewerIds: ["u2","u3"] }
const assignReviewers = async (req, res, next) => {
  try {
    const { prId, reviewerIds } = req.body;
    if (!prId || !Array.isArray(reviewerIds)) {
      return res.status(400).json({ error: "prId and reviewerIds[] required" });
    }
    const pr = store.findPR(prId);
    if (!pr) return res.status(404).json({ error: "PR not found" });

    pr.reviewers = [...new Set([...pr.reviewers, ...reviewerIds])];
    pr.updatedAt = new Date();
    await cache.del(keys.prDetail(prId));

    // Notify newly assigned reviewers via socket
    const io = req.app.get("io");
    reviewerIds.forEach((rid) => {
      io?.to(`user:${rid}`).emit("new_pr", {
        prId: pr.id, title: pr.title, number: pr.number, message: "You were assigned as reviewer",
      });
    });

    res.json({ data: pr, message: `Assigned ${reviewerIds.length} reviewer(s) to PR #${pr.number}` });
  } catch (err) { next(err); }
};

// POST /api/admin/close-stale
// Closes PRs not updated in more than `days` days (default 30).
const closeStale = async (req, res, next) => {
  try {
    const { days = 30 } = req.body;
    const cutoff = new Date(Date.now() - days * 864e5);
    const stale = store.pullRequests.filter(
      (p) => p.status === "open" && new Date(p.updatedAt) < cutoff
    );

    stale.forEach((pr) => {
      pr.status = "rejected";
      pr.updatedAt = new Date();
    });

    // Invalidate cache for each stale PR
    await Promise.all([
      ...stale.map((p) => cache.del(keys.prDetail(p.id))),
      cache.delByPrefix("pr:list:"),
    ]);

    res.json({
      data: stale.map((p) => ({ id: p.id, number: p.number, title: p.title })),
      message: `Closed ${stale.length} stale PR(s) (not updated in ${days} days)`,
    });
  } catch (err) { next(err); }
};

// GET /api/admin/report
// Returns summary stats.
const getReport = async (req, res, next) => {
  try {
    const prs = store.pullRequests;
    const report = {
      generatedAt: new Date(),
      total: prs.length,
      byStatus: {
        open:     prs.filter((p) => p.status === "open").length,
        approved: prs.filter((p) => p.status === "approved").length,
        rejected: prs.filter((p) => p.status === "rejected").length,
      },
      totalComments: store.comments.length,
      totalReviews:  store.reviews.length,
      reviewers: store.users
        .filter((u) => u.role === "reviewer")
        .map((u) => ({
          id: u.id, name: u.name,
          reviews: store.reviews.filter((r) => r.reviewerId === u.id).length,
        })),
    };
    res.json({ data: report });
  } catch (err) { next(err); }
};

// POST /api/admin/bulk-update-permissions
// Body: { userId, role }  — update a user's role
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
  } catch (err) { next(err); }
};

module.exports = { ownerOnly, assignReviewers, closeStale, getReport, updatePermissions };
