// ============================================================
// services/prService.js — Small helper functions for PRs
// OWNER: Harsh Gupta
// These are simple utility functions that other parts of the
// app can import when they need common PR-related logic.
// Keeping them here avoids copy-pasting the same code in
// multiple controller files.
// ============================================================

const store = require("../models/store");

// Count how many approvals a PR has received
const getApprovalCount = (prId) =>
  store.getReviewsForPR(prId).filter((r) => r.decision === "approve").length;

// Get the full review history for a PR, with reviewer details attached
const getReviewHistory = (prId) =>
  store.getReviewsForPR(prId).map((r) => ({
    ...r,
    reviewer: store.findUser(r.reviewerId), // attach the reviewer's name and info
  }));

// Check if a PR is ready to be merged
// It must be "approved" status AND have at least 1 approval
const canMerge = (prId) => {
  const pr = store.findPR(prId);
  return pr?.status === "approved" && getApprovalCount(prId) >= 1;
};

module.exports = { getApprovalCount, getReviewHistory, canMerge };
