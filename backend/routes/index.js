// routes/index.js — updated with permissions + cache + admin
const router = require("express").Router();
const auth = require("../middleware/auth");
const { requirePermission } = require("../middleware/permissions");
const { cacheMiddleware, keys } = require("../services/cache");

const { listPRs, getPR, createPR } = require("../controllers/prController");
const { addComment } = require("../controllers/commentController");
const { addReview } = require("../controllers/reviewController");
const { handleWebhook } = require("../controllers/webhookController");
const {
  ownerOnly, assignReviewers, closeStale, getReport, updatePermissions,
} = require("../controllers/adminController");

// Health
router.get("/health", (req, res) =>
  res.json({ status: "ok", timestamp: new Date(), cache: "in-memory" })
);

// Pull Requests (cached 30s)
router.get("/prs",
  auth, requirePermission("read"),
  cacheMiddleware((req) => keys.prList(JSON.stringify(req.query)), 30),
  listPRs
);
router.get("/prs/:id",
  auth, requirePermission("read"),
  cacheMiddleware((req) => keys.prDetail(req.params.id), 30),
  getPR
);
router.post("/prs", auth, requirePermission("comment"), createPR);

// Comments
router.post("/comments", auth, requirePermission("comment"), addComment);

// Reviews
router.post("/reviews", auth, requirePermission("approve"), addReview);

// Admin (owner only)
router.post("/admin/assign-reviewers", auth, ownerOnly, assignReviewers);
router.post("/admin/close-stale",      auth, ownerOnly, closeStale);
router.get("/admin/report",            auth, ownerOnly, getReport);
router.post("/admin/bulk-update-permissions", auth, ownerOnly, updatePermissions);

// Webhook (signature-verified in production)
router.post("/webhook", handleWebhook);

module.exports = router;
