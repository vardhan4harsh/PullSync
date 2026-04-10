// database/models/PullRequest.js
const mongoose = require("mongoose");

const pullRequestSchema = new mongoose.Schema(
  {
    number: {
      type: Number,
      unique: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [256, "Title cannot exceed 256 characters"],
    },
    description: {
      type: String,
      default: "",
      maxlength: [10000, "Description cannot exceed 10,000 characters"],
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
      index: true,
    },
    reviewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    status: {
      type: String,
      enum: { values: ["open", "approved", "rejected", "draft", "merged"], message: "Invalid status" },
      default: "open",
      index: true,
    },
    branch: {
      type: String,
      required: [true, "Branch is required"],
      trim: true,
    },
    baseBranch: {
      type: String,
      default: "main",
      trim: true,
    },
    labels: [{ type: String, trim: true }],
    // Diff stats
    commitsCount: { type: Number, default: 0, min: 0 },
    changedFiles: { type: Number, default: 0, min: 0 },
    additions: { type: Number, default: 0, min: 0 },
    deletions: { type: Number, default: 0, min: 0 },
    // Merge info
    mergedAt: { type: Date },
    mergedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    closedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Indexes for common queries
pullRequestSchema.index({ status: 1, createdAt: -1 });           // List by status (most common)
pullRequestSchema.index({ authorId: 1, status: 1 });             // My PRs
pullRequestSchema.index({ reviewers: 1, status: 1 });            // PRs to review
pullRequestSchema.index({ updatedAt: -1 });                      // Recent activity
pullRequestSchema.index({ title: "text", description: "text" }); // Full-text search

// Auto-increment PR number (counter maintained separately)
pullRequestSchema.pre("save", async function (next) {
  if (this.isNew && !this.number) {
    const Counter = mongoose.model("Counter");
    const counter = await Counter.findOneAndUpdate(
      { name: "pr_number" },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );
    this.number = counter.value;
  }
  next();
});

// Virtual: comment count (populated separately)
pullRequestSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "prId",
  count: true,
});

module.exports = mongoose.model("PullRequest", pullRequestSchema);
