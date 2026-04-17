/**
 * backend/scripts/seed.js
 *
 * Seeds the MongoDB database with team members and demo PR data.
 * Run with:  node backend/scripts/seed.js
 *
 * Uses models from database/ folder
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const crypto = require("crypto");
const path = require("path");

// Import from database folder
const { connect, disconnect } = require("../../database/db");
const User = require("../../database/models/User");
const PullRequest = require("../../database/models/PullRequest");
const Comment = require("../../database/models/Comment");
const Review = require("../../database/models/Review");
const Session = require("../../database/models/Session");

// Simple hash function for demo passwords (not production-grade)
function simpleHash(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

// ── Seed data ───────────────────────────────────────────────────────────────

// Default password hash for "password123"
const DEFAULT_PASSWORD_HASH = simpleHash("password123");

const USERS = [
  // Real team members (u1-u5)
  {
    name: "Harsh Vardhan Singh",
    email: "harshvardhans702@gmail.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: "owner",
    avatar: "HVS",
    isActive: true,
    githubId: 1,
    githubUsername: "vardhan4harsh",
  },
  {
    name: "Garima Yadav",
    email: "garima.ydv09@gmail.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: "reviewer",
    avatar: "GY",
    isActive: true,
    githubId: 2,
    githubUsername: "GarimaYdv29",
  },
  {
    name: "Devansh Gupta",
    email: "guptadevansh417@gmail.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: "viewer",
    avatar: "DG",
    isActive: true,
    githubId: 3,
    githubUsername: "devansh22448",
  },
  {
    name: "Raj Kumar",
    email: "raj.kumar@company.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: "reviewer",
    avatar: "RK",
    isActive: true,
    githubId: 4,
    githubUsername: "rajkumar-dev",
  },
  {
    name: "Priya Singh",
    email: "priya.singh@company.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: "reviewer",
    avatar: "PS",
    isActive: true,
    githubId: 5,
    githubUsername: "priya-singh",
  },
  // Extra reviewers (u6, u7) from store.js
  {
    name: "Aditya Sharma",
    email: "aditya.sharma@company.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: "reviewer",
    avatar: "AS",
    isActive: true,
    githubId: 6,
    githubUsername: "aditya-sharma",
  },
  {
    name: "Sneha Kulkarni",
    email: "sneha.kulkarni@company.com",
    passwordHash: DEFAULT_PASSWORD_HASH,
    role: "reviewer",
    avatar: "SK",
    isActive: true,
    githubId: 7,
    githubUsername: "sneha-kulkarni",
  },
];

const PULL_REQUESTS = [
  {
    number: 247,
    title: "feat: implement real-time collaborative editing with CRDT",
    description: "Adds CRDT-based collaborative editing to replace lock-based system. Reduces conflict rate by ~94% in stress tests.",
    status: "open",
    branch: "feat/crdt-collab",
    baseBranch: "main",
    commitsCount: 12,
    changedFiles: 8,
    additions: 342,
    deletions: 89,
    labels: ["feature", "breaking-change"],
    createdAt: new Date("2024-03-15T10:30:00Z"),
    updatedAt: new Date("2024-03-15T14:22:00Z"),
  },
  {
    number: 246,
    title: "fix: resolve race condition in webhook delivery queue",
    description: "Fixes critical race condition in webhook delivery under high load. Added mutex locks and retry logic.",
    status: "approved",
    branch: "fix/webhook-race",
    baseBranch: "main",
    commitsCount: 3,
    changedFiles: 4,
    additions: 67,
    deletions: 23,
    labels: ["bug", "critical"],
    createdAt: new Date("2024-03-14T09:15:00Z"),
    updatedAt: new Date("2024-03-14T16:45:00Z"),
  },
  {
    number: 245,
    title: "refactor: migrate auth service to OAuth 2.0 PKCE flow",
    description: "Migrates authentication from implicit flow to PKCE for enhanced security.",
    status: "rejected",
    branch: "refactor/oauth-pkce",
    baseBranch: "main",
    commitsCount: 6,
    changedFiles: 11,
    additions: 189,
    deletions: 234,
    labels: ["security", "refactor"],
    createdAt: new Date("2024-03-13T11:00:00Z"),
    updatedAt: new Date("2024-03-13T18:30:00Z"),
  },
  {
    number: 244,
    title: "docs: add comprehensive API reference for webhooks",
    description: "Adds complete API docs for webhook system including event types, payload schemas, and security verification.",
    status: "open",
    branch: "docs/webhook-api",
    baseBranch: "main",
    commitsCount: 2,
    changedFiles: 5,
    additions: 412,
    deletions: 12,
    labels: ["documentation"],
    createdAt: new Date("2024-03-12T14:00:00Z"),
    updatedAt: new Date("2024-03-12T14:00:00Z"),
  },
  {
    number: 243,
    title: "perf: optimize database query for PR listing with pagination",
    description: "Query time reduced by 87% through proper indexing and cursor-based pagination.",
    status: "approved",
    branch: "perf/pr-listing-query",
    baseBranch: "main",
    commitsCount: 4,
    changedFiles: 3,
    additions: 55,
    deletions: 98,
    labels: ["performance"],
    createdAt: new Date("2024-03-11T08:00:00Z"),
    updatedAt: new Date("2024-03-11T15:20:00Z"),
  },
  {
    number: 242,
    title: "feat: add multi-language i18n support (Hindi + English)",
    description: "Introduces react-i18next with Hindi and English locale files. All UI strings are now translatable.",
    status: "open",
    branch: "feat/i18n-hindi",
    baseBranch: "main",
    commitsCount: 9,
    changedFiles: 22,
    additions: 580,
    deletions: 45,
    labels: ["feature", "i18n"],
    createdAt: new Date("2024-03-10T09:00:00Z"),
    updatedAt: new Date("2024-03-10T12:00:00Z"),
  },
  {
    number: 241,
    title: "fix: memory leak in Socket.io room cleanup on disconnect",
    description: "Rooms were never cleaned up when users disconnected unexpectedly. Adds cleanup handler and periodic GC sweep.",
    status: "approved",
    branch: "fix/socket-room-leak",
    baseBranch: "main",
    commitsCount: 2,
    changedFiles: 2,
    additions: 31,
    deletions: 8,
    labels: ["bug"],
    createdAt: new Date("2024-03-09T13:00:00Z"),
    updatedAt: new Date("2024-03-09T17:30:00Z"),
  },
  {
    number: 240,
    title: "chore: upgrade all dependencies to latest stable",
    description: "Bumps all npm packages. Key upgrades: Vite 5→6, React 18→19, Express 4→5.",
    status: "rejected",
    branch: "chore/dep-upgrade",
    baseBranch: "main",
    commitsCount: 1,
    changedFiles: 2,
    additions: 89,
    deletions: 89,
    labels: ["chore"],
    createdAt: new Date("2024-03-08T10:00:00Z"),
    updatedAt: new Date("2024-03-08T14:00:00Z"),
  },
  {
    number: 239,
    title: "feat: dark/light theme toggle with system preference sync",
    description: "Adds a theme toggle that respects OS prefers-color-scheme and persists the user's choice in localStorage.",
    status: "open",
    branch: "feat/theme-toggle",
    baseBranch: "main",
    commitsCount: 5,
    changedFiles: 14,
    additions: 210,
    deletions: 60,
    labels: ["feature", "ui"],
    createdAt: new Date("2024-03-07T11:00:00Z"),
    updatedAt: new Date("2024-03-07T16:00:00Z"),
  },
  {
    number: 238,
    title: "test: add E2E test suite with Playwright for PR review flow",
    description: "Covers the full reviewer journey: login → view PR → review diff → approve → notification.",
    status: "open",
    branch: "test/playwright-e2e",
    baseBranch: "main",
    commitsCount: 7,
    changedFiles: 10,
    additions: 640,
    deletions: 0,
    labels: ["testing"],
    createdAt: new Date("2024-03-06T08:30:00Z"),
    updatedAt: new Date("2024-03-06T12:00:00Z"),
  },
];

const COMMENTS = [];
const REVIEWS = [];

// ── Helper to build PR/Comment/Review data after users are created ──
function buildDataMaps(createdUsers) {
  // Map old user IDs (u1, u2, etc.) to MongoDB ObjectIds
  const userMap = {
    u1: createdUsers[0]._id, // Harsh - owner
    u2: createdUsers[1]._id, // Garima
    u3: createdUsers[2]._id, // Devansh
    u4: createdUsers[3]._id, // Raj
    u5: createdUsers[4]._id, // Priya
    u6: createdUsers[5]._id, // Aditya
    u7: createdUsers[6]._id, // Sneha
  };

  // Map old PR IDs to PR objects (will be populated after PR insert)
  const prMap = {};

  // Build PR author/reviewer mappings
  const prAuthorMap = {
    0: "u1", 1: "u2", 2: "u3", 3: "u4", 4: "u1", 5: "u5", 6: "u6", 7: "u7", 8: "u4", 9: "u2",
  };
  const prReviewersMap = {
    0: ["u2", "u3"],
    1: ["u1"],
    2: ["u1", "u2"],
    3: ["u2", "u5"],
    4: ["u3", "u6"],
    5: ["u1", "u4"],
    6: ["u2", "u3"],
    7: ["u1"],
    8: ["u5", "u7"],
    9: ["u1", "u3"],
  };

  // Set author and reviewers on PRs
  PULL_REQUESTS.forEach((pr, idx) => {
    pr.authorId = userMap[prAuthorMap[idx]];
    pr.reviewers = prReviewersMap[idx].map((uid) => userMap[uid]);
  });

  // Build comments data mapping
  const commentData = [
    { prIdx: 0, author: "u2", text: "Have you benchmarked the memory overhead with large documents?" },
    { prIdx: 0, author: "u3", text: "OT fallback is a smart safety net. Should we add a feature flag to disable CRDT in prod emergencies?" },
    { prIdx: 1, author: "u1", text: "Clean fix. Make sure the mutex timeout is configurable via env variable." },
    { prIdx: 2, author: "u2", text: "Edge case: what happens if the token refresh endpoint itself returns 401?" },
    { prIdx: 4, author: "u3", text: "Cursor pagination is the right call. Tested locally — feels much snappier." },
    { prIdx: 5, author: "u1", text: "Love the Hindi locale addition. We should add a language switcher to the Settings page." },
    { prIdx: 6, author: "u2", text: "Was this causing the memory spike we saw last Tuesday? The GC sweep is a great addition." },
    { prIdx: 7, author: "u1", text: "React 19 has several breaking changes. Can we pin to RC and set up a compatibility branch first?" },
    { prIdx: 8, author: "u5", text: "System preference sync is a nice touch. Nit: the transition animation is jarring on low-end devices." },
    { prIdx: 9, author: "u3", text: "Login flow tests look solid. Add an assertion for notification badge count after approval." },
  ];

  const reviewData = [
    { prIdx: 1, reviewer: "u1", decision: "approve", comment: "LGTM, clean and well-tested!" },
    { prIdx: 2, reviewer: "u1", decision: "reject", comment: "Need to handle edge cases in token refresh before merging." },
    { prIdx: 2, reviewer: "u2", decision: "reject", comment: "Agree with Harsh — the error boundary is missing." },
    { prIdx: 4, reviewer: "u3", decision: "approve", comment: "Excellent optimization work. The EXPLAIN output in the PR description helped." },
    { prIdx: 6, reviewer: "u2", decision: "approve", comment: "Looks good. Verified the fix manually." },
    { prIdx: 6, reviewer: "u3", decision: "approve", comment: "All test cases pass. Ship it." },
    { prIdx: 7, reviewer: "u1", decision: "reject", comment: "Too many breaking changes at once. Let's split into smaller PRs." },
    { prIdx: 1, reviewer: "u2", decision: "approve", comment: "Mutex approach is clean. No issues found." },
    { prIdx: 4, reviewer: "u6", decision: "approve", comment: "Query plan looks optimal. Pagination is buttery smooth." },
    { prIdx: 0, reviewer: "u2", decision: "approve", comment: "CRDT logic is sound. Memory concern addressed in reply." },
  ];

  // Generate comment objects with PR references
  commentData.forEach((c, idx) => {
    COMMENTS.push({
      prId: null, // Will be set after PRs are created
      userId: userMap[c.author],
      content: c.text,
      createdAt: new Date(Date.now() - Math.random() * 10000000),
      updatedAt: new Date(Date.now() - Math.random() * 10000000),
      _prIdx: c.prIdx, // Temporary marker for linking after PR creation
    });
  });

  // Generate review objects with PR references
  reviewData.forEach((r, idx) => {
    REVIEWS.push({
      prId: null, // Will be set after PRs are created
      reviewerId: userMap[r.reviewer],
      decision: r.decision,
      comment: r.comment,
      isLatest: true,
      createdAt: new Date(Date.now() - Math.random() * 10000000),
      updatedAt: new Date(Date.now() - Math.random() * 10000000),
      _prIdx: r.prIdx, // Temporary marker for linking after PR creation
    });
  });

  return { userMap, commentData, reviewData };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  if (!process.env.MONGODB_URI && process.argv[2] !== "--force") {
    console.log("\n🌱  DRY RUN — MONGODB_URI not set (pass --force to skip this check)\n");
    console.log(`Would seed into: mongodb://localhost:27017/pullsync`);
    console.log(`  Users:         ${USERS.length}`);
    console.log(`  PullRequests:  ${PULL_REQUESTS.length}`);
    console.log(`  Comments:      ~${PULL_REQUESTS.length} (from mock data)`);
    console.log(`  Reviews:       ~${PULL_REQUESTS.length} (from mock data)`);
    console.log("\n  Demo credentials:");
    USERS.forEach((u) => console.log(`    ${u.email.padEnd(35)}  →  ${u.role}`));
    return;
  }

  await connect();
  console.log("✅ Connected to MongoDB");

  // Drop existing data
  await Promise.all([
    User.deleteMany({}),
    PullRequest.deleteMany({}),
    Comment.deleteMany({}),
    Review.deleteMany({}),
    Session.deleteMany({}),
  ]);
  console.log("🗑  Cleared existing collections");

  // Insert users first
  const createdUsers = await User.insertMany(USERS);
  console.log(`✅ Inserted ${createdUsers.length} users`);

  // Create sessions for each user (for demo logins)
  const sessions = createdUsers.map((user) => ({
    token: Session.generateToken(),
    userId: user._id,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    isActive: true,
  }));
  await Session.insertMany(sessions);
  console.log(`✅ Created ${sessions.length} demo sessions`);

  // Build PR/Comment/Review data with proper user ID mapping
  buildDataMaps(createdUsers);

  // Insert PRs
  if (PULL_REQUESTS.length > 0) {
    const createdPRs = await PullRequest.insertMany(PULL_REQUESTS);
    console.log(`✅ Inserted ${createdPRs.length} pull requests`);

    // Now link comments and reviews to the created PRs by index
    COMMENTS.forEach((c) => {
      const prIdx = c._prIdx;
      c.prId = createdPRs[prIdx]._id;
      delete c._prIdx;
    });

    REVIEWS.forEach((r) => {
      const prIdx = r._prIdx;
      r.prId = createdPRs[prIdx]._id;
      delete r._prIdx;
    });

    // Insert comments and reviews
    if (COMMENTS.length > 0) {
      await Comment.insertMany(COMMENTS);
      console.log(`✅ Inserted ${COMMENTS.length} comments`);
    }

    if (REVIEWS.length > 0) {
      await Review.insertMany(REVIEWS);
      console.log(`✅ Inserted ${REVIEWS.length} reviews`);
    }
  }

  console.log("\n🎉 Seed complete!");
  console.log("\n  Demo PR data seeded from store.js mock data");
  console.log("\n  Demo login credentials:");
  console.log("  - Email: harshvardhans702@gmail.com  /  Password: password123 (Owner)");
  console.log("  - Email: garima.ydv09@gmail.com     /  Password: password123 (Reviewer)");
  console.log("  - Email: guptadevansh417@gmail.com  /  Password: password123 (Viewer)\n");

  await disconnect();
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
