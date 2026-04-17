// ============================================================
// models/store.js — In-memory data store (no database needed)
// OWNER: Gaurav Parashar
// This file acts as a fake database that lives in memory.
// When the server restarts, all data added at runtime is lost.
// But the seed data below is always available from the start.
//
// Why do we have this?
//   - The app can run without MongoDB during development
//   - It's fast (no network calls, no disk reads)
//   - MongoDB data takes priority when it's connected — this is
//     just the fallback
//
// The actual seed data (demo PRs, comments, reviews) is here.
// The seed.js script populates MongoDB using the same data.
// ============================================================

const { v4: uuid } = require("uuid");

const store = {
  // ── USERS ──────────────────────────────────────────────────
  // These are the five team members + some extra demo users
  // Tokens are used for API authentication in the demo
  users: [
    { id: "u1",  name: "Harsh Vardhan",   email: "harsh.vardhan@pullsync.dev",   role: "owner",    token: "token_harsh_vardhan"   },
    { id: "u2",  name: "Garima Yadav",    email: "garima.yadav@pullsync.dev",    role: "reviewer", token: "token_garima_yadav"    },
    { id: "u3",  name: "Harsh Gupta",     email: "harsh.gupta@pullsync.dev",     role: "reviewer", token: "token_harsh_gupta"     },
    { id: "u4",  name: "Devesh Tyagi",    email: "devesh.tyagi@pullsync.dev",    role: "reviewer", token: "token_devesh_tyagi"    },
    { id: "u5",  name: "Gaurav Parashar", email: "gaurav.parashar@pullsync.dev", role: "reviewer", token: "token_gaurav_parashar" },
    { id: "u6",  name: "Aditya Sharma",   email: "aditya.sharma@pullsync.dev",   role: "reviewer", token: "token_aditya_sharma"   },
    { id: "u7",  name: "Priya Nair",      email: "priya.nair@pullsync.dev",      role: "reviewer", token: "token_priya_nair"      },
    { id: "u8",  name: "Rohit Mishra",    email: "rohit.mishra@pullsync.dev",    role: "viewer",   token: "token_rohit_mishra"    },
    { id: "u9",  name: "Sneha Kulkarni",  email: "sneha.kulkarni@pullsync.dev",  role: "viewer",   token: "token_sneha_kulkarni"  },
    { id: "u10", name: "Vikram Joshi",    email: "vikram.joshi@pullsync.dev",    role: "reviewer", token: "token_vikram_joshi"    },
  ],

  // ── PULL REQUESTS ──────────────────────────────────────────
  // Sample PRs so the dashboard looks populated from day one
  pullRequests: [
    {
      id: "pr-1", number: 247,
      title: "feat: implement real-time collaborative editing with CRDT",
      description: "Adds CRDT-based collaborative editing to replace lock-based system. Reduces conflict rate by ~94% in stress tests.",
      authorId: "u1", reviewers: ["u2", "u3"],
      status: "open", branch: "feat/crdt-collab", baseBranch: "main",
      commitsCount: 12, changedFiles: 8, additions: 342, deletions: 89,
      labels: ["feature", "breaking-change"],
      createdAt: new Date("2024-03-15T10:30:00Z"), updatedAt: new Date("2024-03-15T14:22:00Z"),
    },
    {
      id: "pr-2", number: 246,
      title: "fix: resolve race condition in webhook delivery queue",
      description: "Fixes critical race condition in webhook delivery under high load. Added mutex locks and retry logic.",
      authorId: "u2", reviewers: ["u1"],
      status: "approved", branch: "fix/webhook-race", baseBranch: "main",
      commitsCount: 3, changedFiles: 4, additions: 67, deletions: 23,
      labels: ["bug", "critical"],
      createdAt: new Date("2024-03-14T09:15:00Z"), updatedAt: new Date("2024-03-14T16:45:00Z"),
    },
    {
      id: "pr-3", number: 245,
      title: "refactor: migrate auth service to OAuth 2.0 PKCE flow",
      description: "Migrates authentication from implicit flow to PKCE for enhanced security.",
      authorId: "u3", reviewers: ["u1", "u2"],
      status: "rejected", branch: "refactor/oauth-pkce", baseBranch: "main",
      commitsCount: 6, changedFiles: 11, additions: 189, deletions: 234,
      labels: ["security", "refactor"],
      createdAt: new Date("2024-03-13T11:00:00Z"), updatedAt: new Date("2024-03-13T18:30:00Z"),
    },
    {
      id: "pr-4", number: 244,
      title: "docs: add comprehensive API reference for webhooks",
      description: "Adds complete API docs for webhook system including event types, payload schemas, and security verification.",
      authorId: "u4", reviewers: ["u2", "u5"],
      status: "open", branch: "docs/webhook-api", baseBranch: "main",
      commitsCount: 2, changedFiles: 5, additions: 412, deletions: 12,
      labels: ["documentation"],
      createdAt: new Date("2024-03-12T14:00:00Z"), updatedAt: new Date("2024-03-12T14:00:00Z"),
    },
    {
      id: "pr-5", number: 243,
      title: "perf: optimize database query for PR listing with pagination",
      description: "Query time reduced by 87% through proper indexing and cursor-based pagination.",
      authorId: "u1", reviewers: ["u3", "u6"],
      status: "approved", branch: "perf/pr-listing-query", baseBranch: "main",
      commitsCount: 4, changedFiles: 3, additions: 55, deletions: 98,
      labels: ["performance"],
      createdAt: new Date("2024-03-11T08:00:00Z"), updatedAt: new Date("2024-03-11T15:20:00Z"),
    },
    {
      id: "pr-6", number: 242,
      title: "feat: add multi-language i18n support (Hindi + English)",
      description: "Introduces react-i18next with Hindi and English locale files. All UI strings are now translatable.",
      authorId: "u5", reviewers: ["u1", "u4"],
      status: "open", branch: "feat/i18n-hindi", baseBranch: "main",
      commitsCount: 9, changedFiles: 22, additions: 580, deletions: 45,
      labels: ["feature", "i18n"],
      createdAt: new Date("2024-03-10T09:00:00Z"), updatedAt: new Date("2024-03-10T12:00:00Z"),
    },
    {
      id: "pr-7", number: 241,
      title: "fix: memory leak in Socket.io room cleanup on disconnect",
      description: "Rooms were never cleaned up when users disconnected unexpectedly. Adds cleanup handler and periodic GC sweep.",
      authorId: "u6", reviewers: ["u2", "u3"],
      status: "approved", branch: "fix/socket-room-leak", baseBranch: "main",
      commitsCount: 2, changedFiles: 2, additions: 31, deletions: 8,
      labels: ["bug"],
      createdAt: new Date("2024-03-09T13:00:00Z"), updatedAt: new Date("2024-03-09T17:30:00Z"),
    },
    {
      id: "pr-8", number: 240,
      title: "chore: upgrade all dependencies to latest stable",
      description: "Bumps all npm packages. Key upgrades: Vite 5→6, React 18→19, Express 4→5.",
      authorId: "u7", reviewers: ["u1"],
      status: "rejected", branch: "chore/dep-upgrade", baseBranch: "main",
      commitsCount: 1, changedFiles: 2, additions: 89, deletions: 89,
      labels: ["chore"],
      createdAt: new Date("2024-03-08T10:00:00Z"), updatedAt: new Date("2024-03-08T14:00:00Z"),
    },
    {
      id: "pr-9", number: 239,
      title: "feat: dark/light theme toggle with system preference sync",
      description: "Adds a theme toggle that respects OS prefers-color-scheme and persists the user's choice in localStorage.",
      authorId: "u4", reviewers: ["u5", "u7"],
      status: "open", branch: "feat/theme-toggle", baseBranch: "main",
      commitsCount: 5, changedFiles: 14, additions: 210, deletions: 60,
      labels: ["feature", "ui"],
      createdAt: new Date("2024-03-07T11:00:00Z"), updatedAt: new Date("2024-03-07T16:00:00Z"),
    },
    {
      id: "pr-10", number: 238,
      title: "test: add E2E test suite with Playwright for PR review flow",
      description: "Covers the full reviewer journey: login → view PR → review diff → approve → notification.",
      authorId: "u2", reviewers: ["u1", "u3"],
      status: "open", branch: "test/playwright-e2e", baseBranch: "main",
      commitsCount: 7, changedFiles: 10, additions: 640, deletions: 0,
      labels: ["testing"],
      createdAt: new Date("2024-03-06T08:30:00Z"), updatedAt: new Date("2024-03-06T12:00:00Z"),
    },
  ],

  // ── COMMENTS ───────────────────────────────────────────────
  comments: [
    { id: "c1",  prId: "pr-1",  userId: "u2",  content: "Have you benchmarked the memory overhead with large documents?",                                         timestamp: new Date("2024-03-15T11:00:00Z") },
    { id: "c2",  prId: "pr-1",  userId: "u3",  content: "OT fallback is a smart safety net. Should we add a feature flag to disable CRDT in prod emergencies?",  timestamp: new Date("2024-03-15T12:15:00Z") },
    { id: "c3",  prId: "pr-2",  userId: "u1",  content: "Clean fix. Make sure the mutex timeout is configurable via env variable.",                              timestamp: new Date("2024-03-14T10:00:00Z") },
    { id: "c4",  prId: "pr-3",  userId: "u2",  content: "Edge case: what happens if the token refresh endpoint itself returns 401?",                             timestamp: new Date("2024-03-13T12:00:00Z") },
    { id: "c5",  prId: "pr-5",  userId: "u3",  content: "Cursor pagination is the right call. Tested locally — feels much snappier.",                           timestamp: new Date("2024-03-11T09:00:00Z") },
    { id: "c6",  prId: "pr-6",  userId: "u1",  content: "Love the Hindi locale addition. We should add a language switcher to the Settings page.",              timestamp: new Date("2024-03-10T10:30:00Z") },
    { id: "c7",  prId: "pr-7",  userId: "u2",  content: "Was this causing the memory spike we saw last Tuesday? The GC sweep is a great addition.",             timestamp: new Date("2024-03-09T14:00:00Z") },
    { id: "c8",  prId: "pr-8",  userId: "u1",  content: "React 19 has several breaking changes. Can we pin to RC and set up a compatibility branch first?",     timestamp: new Date("2024-03-08T11:00:00Z") },
    { id: "c9",  prId: "pr-9",  userId: "u5",  content: "System preference sync is a nice touch. Nit: the transition animation is jarring on low-end devices.", timestamp: new Date("2024-03-07T12:00:00Z") },
    { id: "c10", prId: "pr-10", userId: "u3",  content: "Login flow tests look solid. Add an assertion for notification badge count after approval.",            timestamp: new Date("2024-03-06T09:00:00Z") },
  ],

  // ── REVIEWS ────────────────────────────────────────────────
  reviews: [
    { id: "r1",  prId: "pr-2",  reviewerId: "u1", decision: "approve", comment: "LGTM, clean and well-tested!",                                                timestamp: new Date("2024-03-14T16:45:00Z") },
    { id: "r2",  prId: "pr-3",  reviewerId: "u1", decision: "reject",  comment: "Need to handle edge cases in token refresh before merging.",                  timestamp: new Date("2024-03-13T18:00:00Z") },
    { id: "r3",  prId: "pr-3",  reviewerId: "u2", decision: "reject",  comment: "Agree with Harsh — the error boundary is missing.",                          timestamp: new Date("2024-03-13T18:30:00Z") },
    { id: "r4",  prId: "pr-5",  reviewerId: "u3", decision: "approve", comment: "Excellent optimization work. The EXPLAIN output in the PR description helped.",timestamp: new Date("2024-03-11T15:20:00Z") },
    { id: "r5",  prId: "pr-7",  reviewerId: "u2", decision: "approve", comment: "Looks good. Verified the fix manually.",                                       timestamp: new Date("2024-03-09T17:00:00Z") },
    { id: "r6",  prId: "pr-7",  reviewerId: "u3", decision: "approve", comment: "All test cases pass. Ship it.",                                                timestamp: new Date("2024-03-09T17:30:00Z") },
    { id: "r7",  prId: "pr-8",  reviewerId: "u1", decision: "reject",  comment: "Too many breaking changes at once. Let's split into smaller PRs.",            timestamp: new Date("2024-03-08T14:00:00Z") },
    { id: "r8",  prId: "pr-2",  reviewerId: "u2", decision: "approve", comment: "Mutex approach is clean. No issues found.",                                    timestamp: new Date("2024-03-14T15:00:00Z") },
    { id: "r9",  prId: "pr-5",  reviewerId: "u6", decision: "approve", comment: "Query plan looks optimal. Pagination is buttery smooth.",                      timestamp: new Date("2024-03-11T14:00:00Z") },
    { id: "r10", prId: "pr-1",  reviewerId: "u2", decision: "approve", comment: "CRDT logic is sound. Memory concern addressed in reply.",                     timestamp: new Date("2024-03-15T14:00:00Z") },
  ],

  nextPRNumber: 248, // auto-increments each time a new PR is created
};

// ── Helper methods ──────────────────────────────────────────────
// These are shortcut functions so controllers don't have to write .find() everywhere

// Find a user by their ID (e.g. "u1")
store.findUser = (id) => store.users.find((u) => u.id === id);

// Find a user by their auth token (used in auth middleware)
store.findUserByToken = (token) => store.users.find((u) => u.token === token);

// Find a PR by its ID (e.g. "pr-1")
store.findPR = (id) => store.pullRequests.find((p) => p.id === id);

// Get all comments for a specific PR
store.getCommentsForPR = (prId) => store.comments.filter((c) => c.prId === prId);

// Get all reviews for a specific PR
store.getReviewsForPR = (prId) => store.reviews.filter((r) => r.prId === prId);

// Create a new PR and add it to the list
store.addPR = (data) => {
  const pr = {
    id: `pr-${uuid()}`,
    number: store.nextPRNumber++,
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  store.pullRequests.push(pr);
  return pr;
};

// Create a new comment on a PR
store.addComment = (data) => {
  const comment = { id: `c-${uuid()}`, ...data, timestamp: new Date() };
  store.comments.push(comment);
  // Also update the PR's updatedAt so it shows as recently active
  const pr = store.findPR(data.prId);
  if (pr) pr.updatedAt = new Date();
  return comment;
};

// Create a new review and automatically update the PR status based on votes
store.addReview = (data) => {
  const review = { id: `r-${uuid()}`, ...data, timestamp: new Date() };
  store.reviews.push(review);

  const pr = store.findPR(data.prId);
  if (pr) {
    // Recalculate the PR status based on all reviews so far
    const allReviews = store.getReviewsForPR(pr.id);
    const approvals  = allReviews.filter((r) => r.decision === "approve").length;

    // If anyone approves → mark as approved. If anyone rejects → mark as rejected.
    if (data.decision === "approve" && approvals >= 1) pr.status = "approved";
    else if (data.decision === "reject") pr.status = "rejected";
    pr.updatedAt = new Date();
  }
  return review;
};

module.exports = store;
