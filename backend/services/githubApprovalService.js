// ============================================================
// services/githubApprovalService.js — GitHub actions per user
// OWNER: Devesh Tyagi
// Unlike githubService.js (which uses a single shared server token),
// this class is created fresh for each user using THEIR OWN GitHub token.
// That way, when Garima approves a PR, it shows up as approved by Garima
// on GitHub — not by some bot account.
//
// Usage:
//   const gh = new GitHubApprovalService(user.githubToken);
//   await gh.approvePR("owner", "repo", 42);
// ============================================================

const { Octokit } = require("@octokit/rest");

class GitHubApprovalService {
  // Create a new instance tied to one specific user's GitHub token
  constructor(token) {
    this.octokit = new Octokit({ auth: token });
  }

  // Approve a PR on GitHub — equivalent to clicking "Approve" in the GitHub UI
  // Returns { success: true, data: ... } or { success: false, error: "..." }
  async approvePR(owner, repo, prNumber) {
    try {
      const response = await this.octokit.pulls.createReview({
        owner,
        repo,
        pull_number: prNumber,
        event: "APPROVE",
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Request changes on a PR — equivalent to "Request changes" in GitHub UI
  // A comment explaining what needs to change is required
  async requestChanges(owner, repo, prNumber, comment) {
    try {
      const response = await this.octokit.pulls.createReview({
        owner,
        repo,
        pull_number: prNumber,
        event: "REQUEST_CHANGES",
        body: comment,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Post a regular comment on the PR's conversation thread (not an inline code comment)
  async commentOnPR(owner, repo, prNumber, body) {
    try {
      // GitHub treats PRs as issues for comments — that's why we use issues.createComment
      const response = await this.octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Fetch the full details of a PR from GitHub
  async getPRDetails(owner, repo, prNumber) {
    try {
      const response = await this.octokit.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all reviews that have been submitted on a PR
  async getPRReviews(owner, repo, prNumber) {
    try {
      const response = await this.octokit.pulls.listReviews({
        owner,
        repo,
        pull_number: prNumber,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Merge a PR into its base branch
  // mergeMethod can be "merge", "squash", or "rebase"
  async mergePR(owner, repo, prNumber, options = {}) {
    try {
      const response = await this.octokit.pulls.merge({
        owner,
        repo,
        pull_number: prNumber,
        commit_title: options.commitTitle,
        commit_message: options.commitMessage,
        merge_method: options.mergeMethod || "squash",
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Verify the GitHub token works by fetching the authenticated user's profile
  // Used in /link-github to validate the token before saving it
  async getCurrentUser() {
    try {
      const response = await this.octokit.users.getAuthenticated();
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = GitHubApprovalService;
