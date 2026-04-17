// ============================================================
// database/models/PullRequest.js — MongoDB schema for PRs
// OWNER: Harsh Gupta
// Defines what a Pull Request looks like in the database.
//
// A PR has:
//   - Basic info: title, description, branch, status
//   - Author and reviewers (linked to User records)
//   - Stats: how many files changed, lines added/deleted
//   - GitHub info: PR number, repo name, approval tracking
//
// The PR number is auto-generated using a Counter document
// (see Counter.js) so numbers are sequential and unique.
// ============================================================

const mongoose = require("mongoose");

const pullRequestSchema = new mongoose.Schema(
  {
    // Store the in-memory store.js ID for cross-referencing during migration
    storeId: { type: String, index: true, sparse: true },

    number: { type: Number, unique: true }, // auto-assigned, see pre-save hook below

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

    // Reference to the User who created this PR
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
      index: true,
    },

    // List of Users assigned to review this PR
    reviewers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    status: {
      type: String,
      enum: { values: ["open", "approved", "rejected", "draft", "merged"], message: "Invalid status" },
      default: "open",
      index: true,
    },

    branch: { type: String, required: [true, "Branch is required"], trim: true },
    baseBranch: { type: String, default: "main", trim: true },
    labels: [{ type: String, trim: true }],

    // Code change statistics
    commitsCount: { type: Number, default: 0, min: 0 },
    changedFiles: { type: Number, default: 0, min: 0 },
    additions: { type: Number, default: 0, min: 0 },
    deletions: { type: Number, default: 0, min: 0 },

    // Merge/close tracking
    mergedAt: { type: Date },
    mergedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    closedAt: { type: Date },

    // GitHub integration fields
    githubPrId: { type: Number, index: true },           // the PR number on GitHub
    githubRepoOwner: { type: String },                    // e.g. "pullzinc"
    githubRepoName: { type: String },                     // e.g. "pull-sync"
    githubUrl: { type: String },                          // full URL to GitHub PR
    githubAuthorId: { type: Number },
    githubAuthorUsername: { type: String },
    repoFullName: { type: String, index: true },          // e.g. "pullzinc/pull-sync"

    // Track who has approved/requested changes on GitHub
    approvalStatus: {
      approved: [{ type: Number }],           // GitHub user IDs
      changesRequested: [{ type: Number }],
      commented: [{ type: Number }],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Indexes for the most common query patterns
pullRequestSchema.index({ status: 1, createdAt: -1 });            // list PRs by status
pullRequestSchema.index({ authorId: 1, status: 1 });              // "my PRs" view
pullRequestSchema.index({ reviewers: 1, status: 1 });             // "PRs to review" view
pullRequestSchema.index({ updatedAt: -1 });                       // recent activity
pullRequestSchema.index({ title: "text", description: "text" });  // full-text search
pullRequestSchema.index({ githubPrId: 1, repoFullName: 1 });      // GitHub webhook lookup

// Auto-assign PR number using a separate counter document
// This runs before a new PR is saved to the database
pullRequestSchema.pre("save", async function (next) {
  if (this.isNew && !this.number) {
    const Counter = mongoose.model("Counter");
    const counter = await Counter.findOneAndUpdate(
      { name: "pr_number" },
      { $inc: { value: 1 } }, // increment the counter by 1
      { new: true, upsert: true } // create the counter document if it doesn't exist yet
    );
    this.number = counter.value;
  }
  next();
});

module.exports = mongoose.model("PullRequest", pullRequestSchema);
