// ============================================================
// database/models/Review.js — MongoDB schema for PR reviews
// OWNER: Harsh Gupta
// A review is when a reviewer makes a formal decision on a PR:
//   - "approve" — looks good, ready to merge
//   - "reject"  — needs changes before merging
//   - "comment" — just leaving feedback, no decision yet
//
// Each reviewer can submit multiple reviews (they might approve
// after previously requesting changes). The isLatest flag tracks
// which is their most recent decision on that PR.
// ============================================================

const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    // Which PR this review is for
    prId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PullRequest",
      required: [true, "PR ID is required"],
      index: true,
    },
    // Who submitted this review
    reviewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reviewer ID is required"],
      index: true,
    },
    decision: {
      type: String,
      enum: { values: ["approve", "reject", "comment"], message: "Decision must be approve, reject, or comment" },
      required: [true, "Decision is required"],
    },
    // Optional message explaining the decision
    comment: {
      type: String,
      trim: true,
      maxlength: [2000, "Review comment cannot exceed 2000 characters"],
      default: "",
    },
    // Marks whether this is the reviewer's most recent review on this PR
    // Used to quickly count current approvals without scanning old reviews
    isLatest: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Indexes for fast queries
reviewSchema.index({ prId: 1, reviewerId: 1 });            // get a reviewer's history on one PR
reviewSchema.index({ prId: 1, decision: 1, isLatest: 1 }); // quickly count current approvals
reviewSchema.index({ reviewerId: 1, createdAt: -1 });      // reviewer's activity feed

// Before saving a new review, mark all previous reviews from the same reviewer as "not latest"
// This way we can always find the current vote by filtering isLatest: true
reviewSchema.pre("save", async function (next) {
  if (this.isNew) {
    await this.constructor.updateMany(
      { prId: this.prId, reviewerId: this.reviewerId, _id: { $ne: this._id } },
      { $set: { isLatest: false } }
    );
  }
  next();
});

module.exports = mongoose.model("Review", reviewSchema);
