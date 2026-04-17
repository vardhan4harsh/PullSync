// ============================================================
// controllers/approvalController.js — GitHub PR actions
// OWNER: Devesh Tyagi
// This file lets users take real actions on GitHub PRs:
//   - Approve a PR (say it's ready to merge)
//   - Request changes (ask the author to fix something)
//   - Post a comment on the PR
//   - View team members
//   - Update a user's role
//   - Link a GitHub account to a PullSync account
//
// All GitHub actions need the user to have a GitHub token saved
// in their profile — they get that by calling /link-github first.
// ============================================================

const User = require("../../database/models/User");
const PullRequest = require("../../database/models/PullRequest");
const GitHubApprovalService = require("../services/githubApprovalService");

// POST /api/approvals/approve
// Body: { prId, comment? }
// Submits an "approved" review on GitHub for the given PR
exports.approvePR = async (req, res) => {
  try {
    const { prId, comment } = req.body;
    const userId = req.user.id;

    const pr = await PullRequest.findById(prId).lean();
    if (!pr) return res.status(404).json({ error: "PR not found" });

    // The PR must be linked to a GitHub repo to take action on it
    if (!pr.githubPrId || !pr.githubRepoOwner || !pr.githubRepoName) {
      return res.status(400).json({ error: "PR not linked to GitHub" });
    }

    // Look up the user's GitHub token (hidden by default, so we use +githubToken)
    const user = await User.findById(userId).select("+githubToken");
    if (!user || !user.githubToken) {
      return res.status(401).json({ error: "GitHub token not configured" });
    }

    // Create a GitHub service instance using the user's personal GitHub token
    const gh = new GitHubApprovalService(user.githubToken);

    // Approve the PR on GitHub
    const result = await gh.approvePR(pr.githubRepoOwner, pr.githubRepoName, pr.githubPrId);

    // If a comment was also provided, post that too
    if (comment) {
      await gh.commentOnPR(pr.githubRepoOwner, pr.githubRepoName, pr.githubPrId, comment);
    }

    if (!result.success) return res.status(400).json({ error: result.error });

    // Track who approved this PR in our local database
    if (!pr.approvalStatus) pr.approvalStatus = { approved: [], changesRequested: [], commented: [] };
    if (!pr.approvalStatus.approved.includes(user.githubId)) {
      pr.approvalStatus.approved.push(user.githubId);
    }
    await PullRequest.findByIdAndUpdate(prId, { approvalStatus: pr.approvalStatus });

    res.json({ success: true, message: "PR approved on GitHub", data: result.data });
  } catch (error) {
    console.error("Approve PR error:", error);
    res.status(500).json({ error: "Failed to approve PR" });
  }
};

// POST /api/approvals/request-changes
// Body: { prId, comment } — comment is required when requesting changes
exports.requestChanges = async (req, res) => {
  try {
    const { prId, comment } = req.body;
    const userId = req.user.id;

    if (!comment) return res.status(400).json({ error: "Comment is required when requesting changes" });

    const pr = await PullRequest.findById(prId).lean();
    if (!pr) return res.status(404).json({ error: "PR not found" });

    if (!pr.githubPrId || !pr.githubRepoOwner || !pr.githubRepoName) {
      return res.status(400).json({ error: "PR not linked to GitHub" });
    }

    const user = await User.findById(userId).select("+githubToken");
    if (!user || !user.githubToken) {
      return res.status(401).json({ error: "GitHub token not configured" });
    }

    const gh = new GitHubApprovalService(user.githubToken);
    const result = await gh.requestChanges(pr.githubRepoOwner, pr.githubRepoName, pr.githubPrId, comment);

    if (!result.success) return res.status(400).json({ error: result.error });

    // Track in local DB
    if (!pr.approvalStatus) pr.approvalStatus = { approved: [], changesRequested: [], commented: [] };
    if (!pr.approvalStatus.changesRequested.includes(user.githubId)) {
      pr.approvalStatus.changesRequested.push(user.githubId);
    }
    await PullRequest.findByIdAndUpdate(prId, { approvalStatus: pr.approvalStatus });

    res.json({ success: true, message: "Changes requested on GitHub", data: result.data });
  } catch (error) {
    console.error("Request changes error:", error);
    res.status(500).json({ error: "Failed to request changes" });
  }
};

// POST /api/approvals/comment
// Body: { prId, comment }
exports.commentOnPR = async (req, res) => {
  try {
    const { prId, comment } = req.body;
    const userId = req.user.id;

    if (!comment) return res.status(400).json({ error: "Comment is required" });

    const pr = await PullRequest.findById(prId).lean();
    if (!pr) return res.status(404).json({ error: "PR not found" });

    if (!pr.githubPrId || !pr.githubRepoOwner || !pr.githubRepoName) {
      return res.status(400).json({ error: "PR not linked to GitHub" });
    }

    const user = await User.findById(userId).select("+githubToken");
    if (!user || !user.githubToken) {
      return res.status(401).json({ error: "GitHub token not configured" });
    }

    const gh = new GitHubApprovalService(user.githubToken);
    const result = await gh.commentOnPR(pr.githubRepoOwner, pr.githubRepoName, pr.githubPrId, comment);

    if (!result.success) return res.status(400).json({ error: result.error });

    // Track in local DB
    if (!pr.approvalStatus) pr.approvalStatus = { approved: [], changesRequested: [], commented: [] };
    if (!pr.approvalStatus.commented.includes(user.githubId)) {
      pr.approvalStatus.commented.push(user.githubId);
    }
    await PullRequest.findByIdAndUpdate(prId, { approvalStatus: pr.approvalStatus });

    res.json({ success: true, message: "Comment posted on GitHub", data: result.data });
  } catch (error) {
    console.error("Comment error:", error);
    res.status(500).json({ error: "Failed to post comment" });
  }
};

// GET /api/approvals/team
// Returns a list of all active users (without sensitive fields)
exports.getTeam = async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select("-passwordHash -githubToken");
    res.json({ success: true, data: users });
  } catch (error) {
    console.error("Get team error:", error);
    res.status(500).json({ error: "Failed to fetch team" });
  }
};

// POST /api/approvals/team/:userId/role
// Body: { role } — only the owner can change roles
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (req.user.role !== "owner") {
      return res.status(403).json({ error: "Only owner can change user roles" });
    }
    if (!["owner", "reviewer", "viewer"].includes(role)) {
      return res.status(400).json({ error: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select("-passwordHash -githubToken");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ success: true, message: "User role updated", data: user });
  } catch (error) {
    console.error("Update role error:", error);
    res.status(500).json({ error: "Failed to update role" });
  }
};

// POST /api/approvals/link-github
// Body: { githubToken, githubUsername }
// Saves the user's GitHub token so they can perform GitHub actions
exports.linkGitHub = async (req, res) => {
  try {
    const { githubToken, githubUsername } = req.body;
    const userId = req.user.id;

    if (!githubToken || !githubUsername) {
      return res.status(400).json({ error: "GitHub token and username required" });
    }

    // Verify the token actually works by calling the GitHub API
    const gh = new GitHubApprovalService(githubToken);
    const userInfo = await gh.getCurrentUser();

    if (!userInfo.success) {
      return res.status(401).json({ error: "Invalid GitHub token" });
    }

    // Save GitHub info to the user's profile
    const user = await User.findByIdAndUpdate(
      userId,
      {
        githubId: userInfo.data.id,
        githubUsername: userInfo.data.login,
        githubToken,
        githubAvatarUrl: userInfo.data.avatar_url,
      },
      { new: true }
    ).select("-passwordHash -githubToken");

    res.json({ success: true, message: "GitHub account linked", data: user });
  } catch (error) {
    console.error("Link GitHub error:", error);
    res.status(500).json({ error: "Failed to link GitHub account" });
  }
};
