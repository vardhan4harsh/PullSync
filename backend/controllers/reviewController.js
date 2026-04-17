// ============================================================
// controllers/reviewController.js — Submit approve/reject reviews
// OWNER: Harsh Gupta
// This handles POST /api/reviews
// A reviewer can approve a PR (say it's good to merge) or
// reject it (ask for changes). After enough approvals, the PR
// status automatically updates to "approved".
// Reviews are also synced back to GitHub if the PR is linked.
// ============================================================

const store = require("../models/store");
const github = require("../services/githubService");

// POST /api/reviews
// Body: { prId, decision, comment? }
// decision must be either "approve" or "reject"
const addReview = async (req, res, next) => {
  try {
    const { prId, decision, comment = "" } = req.body;

    if (!prId || !decision) {
      return res.status(400).json({ error: "prId and decision are required" });
    }
    if (!["approve", "reject"].includes(decision)) {
      return res.status(400).json({ error: "decision must be 'approve' or 'reject'" });
    }

    const pr = store.findPR(prId);
    if (!pr) return res.status(404).json({ error: "Pull request not found" });

    // You can't review your own PR — that would be pointless
    if (pr.authorId === req.user.id) {
      return res.status(403).json({ error: "Cannot review your own PR" });
    }

    // Save the review — store.js also updates the PR status automatically
    const review = store.addReview({ prId, reviewerId: req.user.id, decision, comment });
    const updatedPR = store.findPR(prId);

    // Sync the review to GitHub if this PR came from a real repo
    if (pr.repoFullName && pr.githubNumber && process.env.GITHUB_TOKEN) {
      github.submitReview(pr.repoFullName, pr.githubNumber, { decision, comment })
        .then(() => console.log(`[GITHUB] Review synced for PR #${pr.githubNumber} (${decision})`))
        .catch((err) => console.warn(`[GITHUB] Review sync failed: ${err.message}`));
    }

    // Notify the PR author in real-time that someone reviewed their PR
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${pr.authorId}`).emit("review_update", {
        prId,
        prNumber: pr.number,
        prTitle: pr.title,
        reviewerId: req.user.id,
        reviewerName: req.user.name,
        decision,
        newStatus: updatedPR.status,
      });
    }

    res.status(201).json({
      data: { ...review, reviewer: req.user, prStatus: updatedPR.status },
      message: `PR ${decision === "approve" ? "approved" : "changes requested"}`,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { addReview };
