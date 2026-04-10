// models/store.js — In-memory data store
const { v4: uuid } = require("uuid");

const store = {
  users: [
    { id: "u1", name: "Alex Rivera", email: "alex@pullsync.dev", role: "owner", token: "token_alex" },
    { id: "u2", name: "Sam Chen", email: "sam@pullsync.dev", role: "reviewer", token: "token_sam" },
    { id: "u3", name: "Jordan Kim", email: "jordan@pullsync.dev", role: "reviewer", token: "token_jordan" },
  ],

  pullRequests: [
    {
      id: "pr-1", number: 247,
      title: "feat: implement real-time collaborative editing with CRDT",
      description: "Adds CRDT-based collaborative editing to replace lock-based system.",
      authorId: "u1", reviewers: ["u2", "u3"],
      status: "open", branch: "feat/crdt-collab", baseBranch: "main",
      commitsCount: 12, changedFiles: 8, additions: 342, deletions: 89,
      createdAt: new Date("2024-03-15T10:30:00Z"),
      updatedAt: new Date("2024-03-15T14:22:00Z"),
    },
    {
      id: "pr-2", number: 246,
      title: "fix: resolve race condition in webhook delivery queue",
      description: "Fixes critical race condition in webhook delivery under high load.",
      authorId: "u2", reviewers: ["u1"],
      status: "approved", branch: "fix/webhook-race", baseBranch: "main",
      commitsCount: 3, changedFiles: 4, additions: 67, deletions: 23,
      createdAt: new Date("2024-03-14T09:15:00Z"),
      updatedAt: new Date("2024-03-14T16:45:00Z"),
    },
    {
      id: "pr-3", number: 245,
      title: "refactor: migrate auth service to OAuth 2.0 PKCE flow",
      description: "Migrates authentication from implicit flow to PKCE for enhanced security.",
      authorId: "u3", reviewers: ["u1", "u2"],
      status: "rejected", branch: "refactor/oauth-pkce", baseBranch: "main",
      commitsCount: 6, changedFiles: 11, additions: 189, deletions: 234,
      createdAt: new Date("2024-03-13T11:00:00Z"),
      updatedAt: new Date("2024-03-13T18:30:00Z"),
    },
  ],

  comments: [
    {
      id: "c1", prId: "pr-1", userId: "u2",
      content: "Have you benchmarked the memory overhead with large documents?",
      timestamp: new Date("2024-03-15T11:00:00Z"),
    },
  ],

  reviews: [
    {
      id: "r1", prId: "pr-2", reviewerId: "u1",
      decision: "approve", comment: "LGTM, nice fix!",
      timestamp: new Date("2024-03-14T16:45:00Z"),
    },
    {
      id: "r2", prId: "pr-3", reviewerId: "u1",
      decision: "reject", comment: "Need to handle edge cases in token refresh.",
      timestamp: new Date("2024-03-13T18:00:00Z"),
    },
  ],

  nextPRNumber: 248,
};

// Helper methods
store.findUser = (id) => store.users.find((u) => u.id === id);
store.findUserByToken = (token) => store.users.find((u) => u.token === token);
store.findPR = (id) => store.pullRequests.find((p) => p.id === id);
store.getCommentsForPR = (prId) => store.comments.filter((c) => c.prId === prId);
store.getReviewsForPR = (prId) => store.reviews.filter((r) => r.prId === prId);

store.addPR = (data) => {
  const pr = { id: `pr-${uuid()}`, number: store.nextPRNumber++, ...data, createdAt: new Date(), updatedAt: new Date() };
  store.pullRequests.push(pr);
  return pr;
};

store.addComment = (data) => {
  const comment = { id: `c-${uuid()}`, ...data, timestamp: new Date() };
  store.comments.push(comment);
  const pr = store.findPR(data.prId);
  if (pr) pr.updatedAt = new Date();
  return comment;
};

store.addReview = (data) => {
  const review = { id: `r-${uuid()}`, ...data, timestamp: new Date() };
  store.reviews.push(review);
  const pr = store.findPR(data.prId);
  if (pr) {
    const approvals = store.getReviewsForPR(pr.id).filter((r) => r.decision === "approve").length;
    const rejections = store.getReviewsForPR(pr.id).filter((r) => r.decision === "reject").length;
    if (data.decision === "approve" && approvals >= 1) pr.status = "approved";
    else if (data.decision === "reject") pr.status = "rejected";
    pr.updatedAt = new Date();
  }
  return review;
};

module.exports = store;
