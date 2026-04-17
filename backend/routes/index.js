// ============================================================
// routes/index.js — All API routes defined in one place
// OWNER: Gaurav Parashar
// Think of this file as a "table of contents" for the backend.
// Every URL the frontend can call is listed here, along with
// which controller function handles it and what permissions
// are needed.
// ============================================================

const router = require("express").Router();
const auth = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const { cacheMiddleware, keys } = require("../services/cache");

// Import all controller functions
const { login, signup } = require("../controllers/authController");
const { listPRs, getPR, createPR, getPRDiff } = require("../controllers/prController");
const { addComment } = require("../controllers/commentController");
const { addReview } = require("../controllers/reviewController");
const { handleWebhook } = require("../controllers/webhookController");
const { ownerOnly, assignReviewers, closeStale, getReport, updatePermissions } = require("../controllers/adminController");
const { approvePR, requestChanges, commentOnPR, getTeam, updateUserRole, linkGitHub } = require("../controllers/approvalController");

// Health check — useful to ping the server and see if it's alive
router.get("/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date(), cache: "in-memory" })
);

// --- AUTH ROUTES (no login required) ---
router.post("/auth/login", login);   // Login with email + password
router.post("/auth/signup", signup); // Create a new account

// --- PULL REQUEST ROUTES ---
// auth = must be logged in, requirePermission = must have the right role
router.get("/prs", auth, requirePermission("read"), listPRs);         // Get all PRs
router.get("/prs/:id", auth, requirePermission("read"), getPR);       // Get one PR by ID
router.post("/prs", auth, requirePermission("comment"), createPR);    // Create a new PR
router.get("/prs/:id/diff", auth, requirePermission("read"), getPRDiff); // Get code diff for a PR

// --- COMMENT & REVIEW ROUTES ---
router.post("/comments", auth, requirePermission("comment"), addComment); // Add a comment to a PR
router.post("/reviews", auth, requirePermission("approve"), addReview);   // Submit a review decision

// --- ADMIN ROUTES (owner role only) ---
router.post("/admin/assign-reviewers", auth, ownerOnly, assignReviewers);           // Assign people to review a PR
router.post("/admin/close-stale", auth, ownerOnly, closeStale);                     // Auto-close old PRs
router.get("/admin/report", auth, ownerOnly, getReport);                            // Get stats report
router.post("/admin/bulk-update-permissions", auth, ownerOnly, updatePermissions);  // Change someone's role

// --- APPROVAL ROUTES (GitHub actions) ---
router.post("/approvals/approve", auth, requirePermission("approve"), approvePR);           // Approve a PR on GitHub
router.post("/approvals/request-changes", auth, requirePermission("approve"), requestChanges); // Ask for changes
router.post("/approvals/comment", auth, requirePermission("comment"), commentOnPR);          // Comment on GitHub PR
router.get("/approvals/team", auth, getTeam);                                                // Get team member list
router.post("/approvals/team/:userId/role", auth, updateUserRole);                          // Change a user's role
router.post("/approvals/link-github", auth, linkGitHub);                                    // Link GitHub account

// --- WEBHOOK ROUTE ---
// GitHub calls this URL automatically when something happens in the repo
router.post("/webhook", handleWebhook);

module.exports = router;
