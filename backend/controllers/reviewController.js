// controllers/reviewController.js
const store = require("../models/store");

const addReview = async (req, res, next) => {
  try {
    const { prId, decision, comment = "" } = req.body;
    if (!prId || !decision) return res.status(400).json({ error: "prId and decision are required" });
    if (!["approve", "reject"].includes(decision)) return res.status(400).json({ error: "decision must be 'approve' or 'reject'" });

    const pr = store.findPR(prId);
    if (!pr) return res.status(404).json({ error: "Pull request not found" });
    if (pr.authorId === req.user.id) return res.status(403).json({ error: "Cannot review your own PR" });

    const review = store.addReview({ prId, reviewerId: req.user.id, decision, comment });
    const updatedPR = store.findPR(prId);

    // Emit socket event to PR author
    const io = req.app.get("io");
    if (io) {
      io.to(`user:${pr.authorId}`).emit("review_update", {
        prId, prNumber: pr.number, prTitle: pr.title,
        reviewerId: req.user.id, reviewerName: req.user.name,
        decision, newStatus: updatedPR.status,
      });
    }

    res.status(201).json({
      data: { ...review, reviewer: req.user, prStatus: updatedPR.status },
      message: `PR ${decision === "approve" ? "approved" : "changes requested"}`,
    });
  } catch (err) { next(err); }
};

module.exports = { addReview };
