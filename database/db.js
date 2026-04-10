// database/db.js — MongoDB connection and query examples
const mongoose = require("mongoose");

// ── CONNECTION ──────────────────────────────────────────────

async function connect(uri = process.env.MONGODB_URI || "mongodb://localhost:27017/pullsync") {
  try {
    await mongoose.connect(uri, {
      // Connection pool: tune for your load
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ MongoDB connected:", uri.replace(/\/\/.*@/, "//***@"));
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }

  mongoose.connection.on("disconnected", () => console.warn("⚠️  MongoDB disconnected"));
  mongoose.connection.on("reconnected", () => console.log("✅ MongoDB reconnected"));
}

async function disconnect() {
  await mongoose.disconnect();
}

module.exports = { connect, disconnect };

// ══════════════════════════════════════════════════════════════
// SAMPLE QUERIES — for reference / use in controllers
// ══════════════════════════════════════════════════════════════

/*
const PullRequest = require("./models/PullRequest");
const Comment     = require("./models/Comment");
const Review      = require("./models/Review");
const User        = require("./models/User");

// ── 1. List open PRs with author + comment count (paginated) ──
const openPRs = await PullRequest
  .find({ status: "open" })
  .populate("authorId", "name email")
  .populate("reviewers", "name email")
  .populate("comments")           // virtual count field
  .sort({ updatedAt: -1 })
  .skip((page - 1) * limit)
  .limit(limit)
  .lean();

// ── 2. Get full PR detail with all comments (threaded) ────────
const pr = await PullRequest
  .findById(prId)
  .populate("authorId", "name email role")
  .populate({ path: "reviewers", select: "name email" })
  .lean();

const topLevelComments = await Comment
  .find({ prId, parentId: null })
  .populate("userId", "name email")
  .populate({ path: "replies", populate: { path: "userId", select: "name" } })
  .sort({ createdAt: 1 })
  .lean();

// ── 3. Count approvals for a PR (latest review per reviewer) ──
const approvalCount = await Review.countDocuments({
  prId,
  decision: "approve",
  isLatest: true,
});

// ── 4. Get a reviewer's pending PRs ──────────────────────────
const pendingForReviewer = await PullRequest
  .find({ reviewers: reviewerId, status: "open" })
  .populate("authorId", "name")
  .sort({ createdAt: -1 })
  .lean();

// ── 5. Full-text PR search ────────────────────────────────────
const searchResults = await PullRequest
  .find({ $text: { $search: "CRDT collaborative" } })
  .sort({ score: { $meta: "textScore" } })
  .lean();

// ── 6. Analytics: PRs opened per day (last 30 days) ──────────
const activity = await PullRequest.aggregate([
  { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 864e5) } } },
  {
    $group: {
      _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
      opened:   { $sum: 1 },
      approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
      rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
    },
  },
  { $sort: { _id: 1 } },
]);

// ── 7. Top reviewers by number of reviews ────────────────────
const topReviewers = await Review.aggregate([
  { $match: { isLatest: true } },
  { $group: { _id: "$reviewerId", reviews: { $sum: 1 } } },
  { $sort: { reviews: -1 } },
  { $limit: 10 },
  {
    $lookup: {
      from: "users",
      localField: "_id",
      foreignField: "_id",
      as: "user",
    },
  },
  { $unwind: "$user" },
  { $project: { name: "$user.name", email: "$user.email", reviews: 1 } },
]);

// ── 8. Average review turnaround time ────────────────────────
const avgTurnaround = await Review.aggregate([
  { $match: { decision: { $in: ["approve", "reject"] }, isLatest: true } },
  {
    $lookup: {
      from: "pullrequests",
      localField: "prId",
      foreignField: "_id",
      as: "pr",
    },
  },
  { $unwind: "$pr" },
  {
    $project: {
      turnaroundMs: { $subtract: ["$createdAt", "$pr.createdAt"] },
    },
  },
  {
    $group: {
      _id: null,
      avgMs: { $avg: "$turnaroundMs" },
      minMs: { $min: "$turnaroundMs" },
      maxMs: { $max: "$turnaroundMs" },
    },
  },
]);
// avgMs / 3600000 = hours

// ── OPTIMIZATION NOTES ────────────────────────────────────────
// 1. Use .lean() for read-only queries — returns plain JS objects, ~2x faster.
// 2. Only populate fields you need (e.g. "name email", not the full doc).
// 3. The compound index { status: 1, createdAt: -1 } covers the most common
//    dashboard query. Verify with .explain("executionStats").
// 4. For the analytics aggregate, add { $match: { status: ... } } as the
//    FIRST stage to leverage the status index before grouping.
// 5. Cache top-reviewer results with a short TTL (e.g. Redis, 5 min) since
//    they're expensive and don't need to be real-time.
// 6. Use cursor-based pagination (createdAt + _id) instead of skip/limit for
//    large collections to avoid deep-scan performance degradation.
*/
