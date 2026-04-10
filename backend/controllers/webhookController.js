// controllers/webhookController.js
const store = require("../models/store");

const SUPPORTED_EVENTS = ["pull_request", "pull_request_review", "pull_request_review_comment"];

const handleWebhook = async (req, res, next) => {
  try {
    const event = req.headers["x-github-event"] || req.headers["x-pullsync-event"];
    const signature = req.headers["x-hub-signature-256"];
    const payload = req.body;

    console.log(`[WEBHOOK] Event: ${event}`);

    if (!SUPPORTED_EVENTS.includes(event)) {
      return res.json({ message: `Event '${event}' received but not handled` });
    }

    let result = null;

    if (event === "pull_request") {
      result = await handlePREvent(payload, req.app.get("io"));
    } else if (event === "pull_request_review") {
      result = await handleReviewEvent(payload, req.app.get("io"));
    } else if (event === "pull_request_review_comment") {
      result = await handleCommentEvent(payload, req.app.get("io"));
    }

    res.json({ received: true, event, result });
  } catch (err) { next(err); }
};

async function handlePREvent(payload, io) {
  const { action, pull_request: pr, repository } = payload;
  if (!pr) return null;

  if (action === "opened") {
    const newPR = store.addPR({
      title: pr.title,
      description: pr.body || "",
      branch: pr.head?.ref || "unknown",
      baseBranch: pr.base?.ref || "main",
      authorId: "u1", // Map from GitHub user in real impl
      reviewers: [],
      status: "open",
      commitsCount: pr.commits || 0,
      changedFiles: pr.changed_files || 0,
      additions: pr.additions || 0,
      deletions: pr.deletions || 0,
    });
    io?.emit("new_pr", { prId: newPR.id, title: newPR.title, number: newPR.number });
    return newPR;
  }

  if (action === "closed" && pr.merged) {
    const existing = store.pullRequests.find((p) => p.title === pr.title);
    if (existing) { existing.status = "approved"; existing.updatedAt = new Date(); }
  }

  return { action, prNumber: pr.number };
}

async function handleReviewEvent(payload, io) {
  const { action, review, pull_request: pr } = payload;
  if (action !== "submitted" || !review) return null;

  const decision = review.state === "APPROVED" ? "approve" : "reject";
  const result = store.addReview({
    prId: store.pullRequests[0]?.id || "pr-1",
    reviewerId: "u2",
    decision,
    comment: review.body || "",
  });
  io?.emit("review_update", { decision, prTitle: pr?.title });
  return result;
}

async function handleCommentEvent(payload, io) {
  const { action, comment, pull_request: pr } = payload;
  if (action !== "created" || !comment) return null;

  const result = store.addComment({
    prId: store.pullRequests[0]?.id || "pr-1",
    userId: "u2",
    content: comment.body,
  });
  io?.emit("new_comment", { content: comment.body.substring(0, 80) });
  return result;
}

module.exports = { handleWebhook };
