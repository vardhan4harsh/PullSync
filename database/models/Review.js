// database/models/Review.js
const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    prId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PullRequest",
      required: [true, "PR ID is required"],
      index: true,
    },
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
    comment: {
      type: String,
      trim: true,
      maxlength: [2000, "Review comment cannot exceed 2000 characters"],
      default: "",
    },
    // Track if this review is still the latest from this reviewer
    isLatest: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Compound indexes
reviewSchema.index({ prId: 1, reviewerId: 1 });            // One reviewer's history on a PR
reviewSchema.index({ prId: 1, decision: 1, isLatest: 1 }); // Count approvals quickly
reviewSchema.index({ reviewerId: 1, createdAt: -1 });      // Reviewer activity feed

// When a new review is saved, mark previous reviews from same reviewer as not latest
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
