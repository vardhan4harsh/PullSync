// ============================================================
// controllers/webhookController.js — Listens to GitHub events
// OWNER: Devesh Tyagi
// GitHub calls POST /api/webhook every time something happens
// in the connected repository (a new PR, a review, a comment,
// a push, etc.). This file handles all those events.
//
// Main things it does:
//   - Verifies the webhook signature (security check)
//   - Creates/updates PRs in the local store when GitHub fires events
//   - Syncs data to MongoDB alongside the in-memory store
//   - Emits real-time WebSocket events to connected users
//   - Fetches and stores code diffs from GitHub
// ============================================================

const store = require("../models/store");
const github = require("../services/githubService");

// MongoDB models loaded lazily — app still starts even if Mongo is down
let MongoUser = null;
let MongoPR = null;

function getMongoModels() {
  if (!MongoUser) {
    try {
      MongoUser = require("../../database/models/User");
      MongoPR = require("../../database/models/PullRequest");
    } catch (e) {
      // Models unavailable — Mongo path is skipped silently
    }
  }
  return { MongoUser, MongoPR };
}

// POST /api/webhook — GitHub calls this automatically
const handleWebhook = async (req, res, next) => {
  try {
    const event = req.headers["x-github-event"];
    const signature = req.headers["x-hub-signature-256"];

    // Verify the signature using our webhook secret to make sure this request
    // really came from GitHub and hasn't been tampered with
    const rawBody = req.rawBody;
    if (rawBody && !github.verifyWebhookSignature(rawBody, signature)) {
      return res.status(401).json({ error: "Invalid webhook signature" });
    }

    const payload = req.body;
    const io = req.app.get("io");
    console.log(`[WEBHOOK] ${event} — action: ${payload.action}`);

    // Route the event to the right handler based on the event type
    let result = null;
    switch (event) {
      case "pull_request":                result = await onPullRequest(payload, io); break;
      case "pull_request_review":         result = await onReview(payload, io);      break;
      case "pull_request_review_comment": result = await onReviewComment(payload, io); break;
      case "push":                        result = await onPush(payload, io);         break;
      default:                            result = { skipped: true }; // unknown event, ignore it
    }

    res.json({ received: true, event, action: payload.action, result });
  } catch (err) {
    next(err);
  }
};

// Handles "pull_request" events — a PR was opened, closed, merged, etc.
async function onPullRequest(payload, io) {
  const { action, pull_request: pr, repository } = payload;
  const repoFullName = repository?.full_name;

  if (action === "opened" || action === "reopened") {
    const normalized = github.normalizePR(pr, repoFullName);

    // Find or create the author user in our system based on their GitHub profile
    const author = await findOrCreateUserFromGitHub(pr.user);

    // Step 1: Save to in-memory store (this keeps everything working immediately)
    const stored = store.addPR({
      title: normalized.title,
      description: normalized.description,
      branch: normalized.branch,
      baseBranch: normalized.baseBranch,
      authorId: author.id,
      reviewers: [],
      status: "open",
      commitsCount: normalized.commitsCount,
      changedFiles: normalized.changedFiles,
      additions: normalized.additions,
      deletions: normalized.deletions,
      labels: normalized.labels,
      githubNumber: normalized.githubNumber,
      githubUrl: normalized.githubUrl,
      repoFullName,
      diffStatus: "pending", // diff will be fetched in the background
    });

    // Step 2: Also save to MongoDB for persistence across restarts
    await saveOrUpdateMongoPR({
      storeId: stored.id,
      title: normalized.title,
      description: normalized.description || "",
      branch: normalized.branch,
      baseBranch: normalized.baseBranch || "main",
      status: "open",
      commitsCount: normalized.commitsCount || 0,
      changedFiles: normalized.changedFiles || 0,
      additions: normalized.additions || 0,
      deletions: normalized.deletions || 0,
      labels: normalized.labels || [],
      githubPrId: pr.number,
      githubUrl: normalized.githubUrl,
      githubAuthorId: pr.user?.id,
      githubAuthorUsername: pr.user?.login,
      repoFullName,
      authorId: author.mongoId || null,
    });

    // Step 3: Fetch the actual code diff in the background (don't block the response)
    fetchAndStoreDiff(stored.id, repoFullName, pr.number).catch((err) =>
      console.error(`[WEBHOOK] Diff fetch failed for PR ${stored.id}:`, err.message)
    );

    // Notify all connected users that a new PR was opened
    io?.emit("new_pr", {
      prId: stored.id,
      title: stored.title,
      number: stored.number,
      author: author.name,
      githubNumber: pr.number,
      repoFullName,
    });

    return stored;
  }

  // PR was closed (could be merged or just closed without merging)
  if (action === "closed") {
    const existing = findPRByGitHubNumber(repoFullName, pr.number);
    if (!existing) return { error: "PR not found in store" };

    const status = pr.merged ? "approved" : "rejected";
    existing.status = status;
    existing.updatedAt = new Date();
    if (pr.merged) existing.mergedAt = pr.merged_at;

    // Sync the status change to MongoDB too
    await syncStatusToMongo(repoFullName, pr.number, status, pr.merged_at || null);

    // Notify the PR author that their PR was closed/merged
    io?.to(`user:${existing.authorId}`).emit("pr_status_change", {
      prId: existing.id,
      prNumber: existing.number,
      prTitle: existing.title,
      status,
    });

    return existing;
  }

  return { skipped: true };
}

// Handles "pull_request_review" events — someone approved or requested changes
async function onReview(payload, io) {
  const { action, review, pull_request: pr, repository } = payload;
  if (action !== "submitted") return { skipped: true };

  const repoFullName = repository?.full_name;
  const existing = findPRByGitHubNumber(repoFullName, pr.number);
  if (!existing) return { error: "PR not found in store" };

  const reviewer = await findOrCreateUserFromGitHub(review.user);

  // Map GitHub review states to our internal decision values
  const decisionMap = { APPROVED: "approve", CHANGES_REQUESTED: "reject" };
  const decision = decisionMap[review.state];
  if (!decision) return { skipped: true }; // COMMENTED or DISMISSED — ignore

  const stored = store.addReview({
    prId: existing.id,
    reviewerId: reviewer.id,
    decision,
    comment: review.body || "",
  });

  // Notify the PR author in real-time
  io?.to(`user:${existing.authorId}`).emit("review_update", {
    prId: existing.id,
    prNumber: existing.number,
    prTitle: existing.title,
    reviewerName: reviewer.name,
    decision,
    newStatus: store.findPR(existing.id)?.status,
  });

  return stored;
}

// Handles "pull_request_review_comment" events — inline code comment was posted
async function onReviewComment(payload, io) {
  const { action, comment, pull_request: pr, repository } = payload;
  if (action !== "created") return { skipped: true };

  const repoFullName = repository?.full_name;
  const existing = findPRByGitHubNumber(repoFullName, pr.number);
  if (!existing) return { error: "PR not found in store" };

  const commenter = await findOrCreateUserFromGitHub(comment.user);
  const stored = store.addComment({
    prId: existing.id,
    userId: commenter.id,
    content: comment.body,
    file: comment.path,
    line: comment.line || comment.original_line,
    githubCommentId: comment.id,
  });

  // Notify the PR author and reviewers about the new comment
  const recipients = [existing.authorId, ...existing.reviewers].filter(
    (id) => id !== commenter.id
  );
  recipients.forEach((uid) => {
    io?.to(`user:${uid}`).emit("new_comment", {
      prId: existing.id,
      prTitle: existing.title,
      author: commenter.name,
      content: comment.body.slice(0, 80),
      file: comment.path,
    });
  });

  return stored;
}

// Handles "push" events — someone pushed code to a branch
async function onPush(payload, io) {
  const { ref, pusher, repository, commits } = payload;
  const branch = ref?.replace("refs/heads/", ""); // convert "refs/heads/main" to "main"
  console.log(`[WEBHOOK] Push to ${repository?.full_name}/${branch} by ${pusher?.name}`);
  return { branch, commits: commits?.length || 0 };
}

// ── Helper functions ──────────────────────────────────────────

// Find a PR in the in-memory store by its GitHub PR number and repo name
function findPRByGitHubNumber(repoFullName, githubNumber) {
  return store.pullRequests.find(
    (p) => p.githubNumber === githubNumber && p.repoFullName === repoFullName
  );
}

// Look up a GitHub user in our store, or create a new entry if not found
// Also syncs the user to MongoDB so they persist across restarts
async function findOrCreateUserFromGitHub(githubUser) {
  if (!githubUser) return store.users[0]; // fallback to first user

  // Check if we already have this user in the in-memory store
  let user = store.users.find(
    (u) => u.githubLogin === githubUser.login || u.email === `${githubUser.login}@github`
  );

  if (!user) {
    // Create a new user entry for this GitHub user
    user = {
      id: `gh-${githubUser.id || githubUser.login}`,
      name: githubUser.name || githubUser.login,
      email: `${githubUser.login}@github`,
      role: "reviewer",
      token: `gh_token_${githubUser.login}`,
      githubLogin: githubUser.login,
      avatar: githubUser.avatar_url,
      mongoId: null,
    };
    store.users.push(user);
    console.log(`[WEBHOOK] Created user in store for GitHub user: ${githubUser.login}`);
  }

  // Sync to MongoDB so the user persists (upsert = update if exists, insert if not)
  const { MongoUser } = getMongoModels();
  if (MongoUser) {
    try {
      const mongoUser = await MongoUser.findOneAndUpdate(
        { githubId: githubUser.id },
        {
          $setOnInsert: {
            name: githubUser.name || githubUser.login,
            email: `${githubUser.login}@github`,
            role: "reviewer",
            githubId: githubUser.id,
            githubUsername: githubUser.login?.toLowerCase(),
            githubAvatarUrl: githubUser.avatar_url,
            isActive: true,
          },
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      user.mongoId = mongoUser._id.toString();
    } catch (err) {
      // Non-fatal — in-memory user still works fine
      console.warn(`[WEBHOOK] MongoDB user upsert failed for ${githubUser.login}:`, err.message);
    }
  }

  return user;
}

// Save or update a PR in MongoDB
// Uses githubPrId + repoFullName as the unique key (so re-deliveries don't duplicate)
async function saveOrUpdateMongoPR(data) {
  const { MongoPR } = getMongoModels();
  if (!MongoPR) return null;

  if (!data.githubPrId || !data.repoFullName) {
    console.warn("[WEBHOOK] saveOrUpdateMongoPR: missing githubPrId or repoFullName — skipping");
    return null;
  }

  try {
    const { authorId, storeId, githubPrId, repoFullName, ...rest } = data;

    const mongoPR = await MongoPR.findOneAndUpdate(
      { githubPrId, repoFullName },
      {
        $set: rest,
        $setOnInsert: {
          storeId,
          githubPrId,
          repoFullName,
          ...(authorId ? { authorId } : {}),
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    console.log(`[WEBHOOK] Mongo PR upserted: ${mongoPR._id} (storeId: ${storeId})`);
    return mongoPR;
  } catch (err) {
    console.error("[WEBHOOK] MongoDB PR save failed:", err.message);
    return null;
  }
}

// Update just the status field of a PR in MongoDB
async function syncStatusToMongo(repoFullName, githubPrId, status, mergedAt = null) {
  const { MongoPR } = getMongoModels();
  if (!MongoPR) return;
  try {
    const update = { status };
    if (mergedAt) update.mergedAt = mergedAt;
    await MongoPR.findOneAndUpdate({ githubPrId, repoFullName }, { $set: update });
  } catch (err) {
    console.warn("[WEBHOOK] MongoDB status sync failed:", err.message);
  }
}

// Fetch the actual code diff from GitHub and store it on the PR object
// Called in the background after a new PR is created
async function fetchAndStoreDiff(prId, repoFullName, githubPRNumber) {
  try {
    console.log(`[DIFF] Fetching diff for PR ${prId} (GitHub #${githubPRNumber})...`);
    const diff = await github.getPRDiff(repoFullName, githubPRNumber);
    const commits = await github.getPRCommits(repoFullName, githubPRNumber);
    const pr = store.findPR(prId);
    if (pr) {
      pr.diff = diff;
      pr.commits = commits;
      pr.diffStatus = "ready";
      pr.updatedAt = new Date();
      console.log(`[DIFF] Stored ${diff.length} files, ${commits.length} commits for PR ${prId}`);
    }
  } catch (err) {
    const pr = store.findPR(prId);
    if (pr) pr.diffStatus = "error";
    throw err;
  }
}

module.exports = {
  handleWebhook,
  fetchAndStoreDiff,
  findOrCreateUserFromGitHub,
};
