// ============================================================
// controllers/prController.js — Pull Request CRUD operations
// OWNER: Harsh Gupta
// This file handles all PR-related API endpoints:
//   - List all pull requests (with filters)
//   - Get details of one pull request
//   - Create a new pull request
//   - Get the code diff for a pull request
//
// Data priority: MongoDB first, falls back to in-memory store
// if MongoDB is not connected or has no data yet.
// ============================================================

const store = require("../models/store");
const github = require("../services/githubService");
const { fetchAndStoreDiff } = require("./webhookController");

// Load MongoDB models lazily — if the database package isn't installed,
// the app still works using store.js (in-memory mode)
let PullRequest = null;
let Comment = null;
let Review = null;

function getMongoModels() {
  if (!PullRequest) {
    try {
      PullRequest = require("../../database/models/PullRequest");
      Comment = require("../../database/models/Comment");
      Review = require("../../database/models/Review");
    } catch (e) {
      // Database package not available — use store-only mode
    }
  }
  return { PullRequest, Comment, Review };
}

// Check if Mongoose is currently connected to MongoDB
function isMongoConnected() {
  try {
    const mongoose = require("mongoose");
    return mongoose.connection.readyState === 1; // 1 = connected
  } catch {
    return false;
  }
}

// Tell the browser not to cache these responses — always get fresh data
function setCacheHeaders(res) {
  res.set("Cache-Control", "no-cache, no-store, must-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
}

// GET /api/prs — List all pull requests
// Optional query params: ?status=open&author=u1&repo=owner/repo
const listPRs = async (req, res, next) => {
  try {
    setCacheHeaders(res);
    const { status, author, repo } = req.query;
    const { PullRequest, Comment, Review } = getMongoModels();

    // Try MongoDB if connected
    if (PullRequest && isMongoConnected()) {
      try {
        const query = {};
        if (status) query.status = status;
        if (author) query.authorId = author;
        if (repo) query.repoFullName = repo;

        const prs = await PullRequest.find(query)
          .populate("authorId", "name email avatar role")   // replace authorId with full user object
          .populate("reviewers", "name email avatar role")  // replace reviewer IDs with full user objects
          .sort({ updatedAt: -1 }) // newest first
          .lean()
          .exec();

        // Only use MongoDB results if there's actually data — don't fall back
        // just because count is 0 (the DB might genuinely be empty)
        if (prs.length > 0) {
          const enriched = await Promise.all(
            prs.map(async (pr) => ({
              ...pr,
              author: pr.authorId,
              commentCount: await Comment.countDocuments({ prId: pr._id }),
              reviewCount: await Review.countDocuments({ prId: pr._id }),
            }))
          );
          return res.json({ data: enriched, total: enriched.length });
        }

        console.log("[API] MongoDB has no PRs yet, reading from store.js");
      } catch (dbErr) {
        // Real DB error — log it and fall back to store
        console.warn("[API] MongoDB query failed, falling back to store.js:", dbErr.message);
      }
    }

    // Fallback: use in-memory store
    let prs = [...store.pullRequests];
    if (status) prs = prs.filter((p) => p.status === status);
    if (author) prs = prs.filter((p) => p.authorId === author);
    if (repo) prs = prs.filter((p) => p.repoFullName === repo);
    prs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    const enriched = prs.map((pr) => ({
      ...pr,
      author: store.findUser(pr.authorId)?.name || pr.authorId,
      commentCount: store.getCommentsForPR(pr.id).length,
      reviewCount: store.getReviewsForPR(pr.id).length,
    }));
    return res.json({ data: enriched, total: enriched.length });
  } catch (err) {
    next(err);
  }
};

// GET /api/prs/:id — Get one pull request by its ID
const getPR = async (req, res, next) => {
  try {
    setCacheHeaders(res);
    const { id } = req.params;
    const { PullRequest, Comment, Review } = getMongoModels();

    // Try MongoDB first
    if (PullRequest && isMongoConnected()) {
      try {
        const pr = await PullRequest.findById(id)
          .populate("authorId", "name email avatar role")
          .populate("reviewers", "name email avatar role")
          .exec();

        if (pr) {
          // If the diff hasn't been fetched yet, kick off a background fetch
          if (pr.diffStatus === "pending" && pr.repoFullName && pr.githubPrId) {
            fetchAndStoreDiff(pr.storeId || pr._id.toString(), pr.repoFullName, pr.githubPrId)
              .catch(console.error);
          }

          const [comments, reviews] = await Promise.all([
            Comment.find({ prId: pr._id }).populate("userId", "name email avatar role").exec(),
            Review.find({ prId: pr._id }).populate("reviewerId", "name email avatar role").exec(),
          ]);

          return res.json({
            data: {
              ...pr.toObject(),
              author: pr.authorId,
              comments: comments.map((c) => {
                const comment = c.toObject();
                return {
                  ...comment,
                  user: comment.userId || { name: "Unknown" },
                  userId: comment.userId?._id || comment.userId,
                };
              }),
              reviews: reviews.map((r) => ({ ...r.toObject(), reviewer: r.reviewerId })),
            },
          });
        }
      } catch (dbErr) {
        // CastError is expected when the ID is a store.js string like "pr-abc123"
        // Don't log those — just fall through to the store
        if (dbErr.name !== "CastError") {
          console.warn("[API] MongoDB getPR failed, falling back to store.js:", dbErr.message);
        }
      }
    }

    // Fallback: in-memory store
    const pr = store.findPR(id);
    if (!pr) return res.status(404).json({ error: "Pull request not found" });

    // Trigger background diff fetch if needed
    if (pr.diffStatus === "pending" && pr.repoFullName && pr.githubNumber) {
      fetchAndStoreDiff(pr.id, pr.repoFullName, pr.githubNumber).catch(console.error);
    }

    const enriched = {
      ...pr,
      author: store.findUser(pr.authorId),
      comments: store.getCommentsForPR(pr.id).map((c) => ({ ...c, user: store.findUser(c.userId) })),
      reviews: store.getReviewsForPR(pr.id).map((r) => ({ ...r, reviewer: store.findUser(r.reviewerId) })),
    };
    return res.json({ data: enriched });
  } catch (err) {
    next(err);
  }
};

// POST /api/prs — Create a new pull request
// Body: { title, description, branch, baseBranch, reviewers, labels, repoFullName }
const createPR = async (req, res, next) => {
  try {
    const {
      title,
      description,
      branch,
      baseBranch = "main",
      reviewers = [],
      labels = [],
      repoFullName,
    } = req.body;

    if (!title || !branch) {
      return res.status(400).json({ error: "title and branch are required" });
    }

    // Save the PR to the in-memory store
    const pr = store.addPR({
      title,
      description,
      branch,
      baseBranch,
      reviewers,
      labels,
      authorId: req.user.id,
      status: "open",
      commitsCount: 0,
      changedFiles: 0,
      additions: 0,
      deletions: 0,
      repoFullName: repoFullName || null,
      diffStatus: "none",
    });

    // Notify everyone connected via WebSocket that a new PR was created
    req.app.get("io")?.emit("new_pr", {
      prId: pr.id,
      title: pr.title,
      author: req.user.name,
      number: pr.number,
    });

    res.status(201).json({ data: pr, message: "Pull request created" });
  } catch (err) {
    next(err);
  }
};

// GET /api/prs/:id/diff — Get the actual code diff for a PR
// Returns the parsed diff (list of file changes) from GitHub
const getPRDiff = async (req, res, next) => {
  try {
    const pr = store.findPR(req.params.id);
    if (!pr) return res.status(404).json({ error: "PR not found" });

    // If diff is already cached and ready, return it immediately
    if (pr.diff && pr.diffStatus === "ready") {
      return res.json({ data: pr.diff, commits: pr.commits, status: "ready" });
    }

    // If the PR is linked to a GitHub repo, fetch the diff
    if (pr.repoFullName && pr.githubNumber) {
      if (pr.diffStatus === "error") {
        return res.status(503).json({ error: "Diff fetch previously failed", status: "error" });
      }
      await fetchAndStoreDiff(pr.id, pr.repoFullName, pr.githubNumber);
      const updated = store.findPR(pr.id);
      return res.json({
        data: updated.diff || [],
        commits: updated.commits || [],
        status: updated.diffStatus,
      });
    }

    // No GitHub repo linked — no diff available
    res.json({ data: [], commits: [], status: "none", message: "This PR has no GitHub repository linked" });
  } catch (err) {
    next(err);
  }
};

module.exports = { listPRs, getPR, createPR, getPRDiff };
