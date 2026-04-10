// services/prService.js — Business logic layer
const store = require("../models/store");

const getApprovalCount = (prId) =>
  store.getReviewsForPR(prId).filter((r) => r.decision === "approve").length;

const getReviewHistory = (prId) =>
  store.getReviewsForPR(prId).map((r) => ({
    ...r,
    reviewer: store.findUser(r.reviewerId),
  }));

const canMerge = (prId) => {
  const pr = store.findPR(prId);
  return pr?.status === "approved" && getApprovalCount(prId) >= 1;
};

module.exports = { getApprovalCount, getReviewHistory, canMerge };
