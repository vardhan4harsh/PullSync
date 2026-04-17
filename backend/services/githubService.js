// ============================================================
// services/githubService.js — Talks to the GitHub API
// OWNER: Devesh Tyagi
// This is the main file for anything related to GitHub.
// It uses the Octokit library (GitHub's official JS client)
// to fetch pull request data, code diffs, commits, and more.
//
// Think of this as the "translator" between our app and GitHub.
// Controllers call these functions instead of calling GitHub directly.
// ============================================================

const { Octokit } = require("@octokit/rest");
const parseDiff = require("parse-diff");

// Create a GitHub API client using a personal access token
// By default it uses the GITHUB_TOKEN from the .env file
function createClient(token = process.env.GITHUB_TOKEN) {
  if (!token) throw new Error("GITHUB_TOKEN is not set in environment");
  return new Octokit({ auth: token });
}

// We only need one shared client for server-level operations (like webhooks)
// This pattern is called a "singleton" — we create it once and reuse it
let _client = null;
function getClient() {
  if (!_client) _client = createClient();
  return _client;
}

// Split "owner/repo" format into separate owner and repo strings
// e.g. "facebook/react" → { owner: "facebook", repo: "react" }
function parseRepo(fullName) {
  const [owner, repo] = (fullName || "").split("/");
  if (!owner || !repo)
    throw new Error(`Invalid repo format: "${fullName}" — expected "owner/repo"`);
  return { owner, repo };
}

// Fetch the details of one PR from GitHub by its number
async function getPRFromGitHub(repoFullName, prNumber) {
  const { owner, repo } = parseRepo(repoFullName);
  const { data } = await getClient().pulls.get({ owner, repo, pull_number: prNumber });
  return normalizePR(data, repoFullName);
}

// List all open (or closed) PRs for a repository
async function listPRsFromGitHub(repoFullName, state = "open") {
  const { owner, repo } = parseRepo(repoFullName);
  const { data } = await getClient().pulls.list({ owner, repo, state, per_page: 50 });
  return data.map((pr) => normalizePR(pr, repoFullName));
}

// Fetch the actual code diff for a PR (what lines changed in which files)
// Returns an array of file objects, each with the changed lines broken into chunks
async function getPRDiff(repoFullName, prNumber) {
  const { owner, repo } = parseRepo(repoFullName);

  // GitHub returns a unified diff text when we use this special Accept header
  const response = await getClient().request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}",
    {
      owner,
      repo,
      pull_number: prNumber,
      headers: { accept: "application/vnd.github.diff" },
    }
  );

  const rawDiff = response.data; // this is a raw text diff like you'd see in a terminal
  const files = parseDiff(rawDiff); // parse-diff converts it into a structured object

  // Convert to our own clean format that the frontend DiffViewer expects
  return files.map((file) => ({
    filename: file.to || file.from || "unknown",
    oldFilename: file.from,
    status: file.new ? "added" : file.deleted ? "deleted" : "modified",
    additions: file.chunks.reduce(
      (sum, c) => sum + c.changes.filter((ch) => ch.type === "add").length,
      0
    ),
    deletions: file.chunks.reduce(
      (sum, c) => sum + c.changes.filter((ch) => ch.type === "del").length,
      0
    ),
    chunks: file.chunks.map((chunk) => ({
      header: `@@ -${chunk.oldStart},${chunk.oldLines} +${chunk.newStart},${chunk.newLines} @@`,
      changes: chunk.changes.map((ch) => ({
        type: ch.type,       // "normal" = unchanged, "add" = green line, "del" = red line
        content: ch.content, // the actual line text (with leading +, -, or space)
        oldLine: ch.ln1,
        newLine: ch.ln2 || ch.ln,
      })),
    })),
  }));
}

// Fetch the list of commits included in a PR
async function getPRCommits(repoFullName, prNumber) {
  const { owner, repo } = parseRepo(repoFullName);
  const { data } = await getClient().pulls.listCommits({
    owner,
    repo,
    pull_number: prNumber,
    per_page: 100,
  });
  return data.map((c) => ({
    sha: c.sha,
    shortSha: c.sha.slice(0, 7), // short version for display (e.g. "a1b2c3d")
    message: c.commit.message.split("\n")[0], // first line of the commit message only
    author: c.commit.author.name,
    date: c.commit.author.date,
    url: c.html_url,
  }));
}

// Get all inline review comments on a PR
async function getPRReviewComments(repoFullName, prNumber) {
  const { owner, repo } = parseRepo(repoFullName);
  const { data } = await getClient().pulls.listReviewComments({
    owner,
    repo,
    pull_number: prNumber,
    per_page: 100,
  });
  return data.map((c) => ({
    id: String(c.id),
    author: c.user.login,
    avatar: c.user.avatar_url,
    content: c.body,
    file: c.path,
    line: c.line || c.original_line,
    timestamp: c.created_at,
    githubId: c.id,
  }));
}

// Post an inline code comment on a specific line of a PR on GitHub
async function postReviewComment(repoFullName, prNumber, { body, commitSha, path, line }) {
  const { owner, repo } = parseRepo(repoFullName);
  const { data } = await getClient().pulls.createReviewComment({
    owner,
    repo,
    pull_number: prNumber,
    body,
    commit_id: commitSha,
    path,
    line,
    side: "RIGHT", // comment on the new version of the file
  });
  return data;
}

// Submit a full PR review (either approve or request changes) on GitHub
async function submitReview(repoFullName, prNumber, { decision, comment }) {
  const { owner, repo } = parseRepo(repoFullName);
  // GitHub uses "APPROVE" and "REQUEST_CHANGES" — map from our internal values
  const event = decision === "approve" ? "APPROVE" : "REQUEST_CHANGES";
  const { data } = await getClient().pulls.createReview({
    owner,
    repo,
    pull_number: prNumber,
    event,
    body: comment || "",
  });
  return data;
}

// Verify that a webhook request actually came from GitHub
// GitHub signs the body with a secret — we verify the signature matches
function verifyWebhookSignature(rawBody, signature, secret = process.env.WEBHOOK_SECRET) {
  if (!secret) {
    console.warn("[WEBHOOK] No WEBHOOK_SECRET set — skipping signature verification");
    return true; // allow in development when no secret is configured
  }
  const crypto = require("crypto");
  const expected =
    "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    // timingSafeEqual prevents timing attacks (comparing char by char would leak info)
    return crypto.timingSafeEqual(Buffer.from(signature || ""), Buffer.from(expected));
  } catch {
    return false;
  }
}

// Convert a raw GitHub PR object into our app's internal format
// This keeps the rest of the code independent from GitHub's API structure
function normalizePR(pr, repoFullName) {
  return {
    githubId: pr.id,
    githubNumber: pr.number,
    repoFullName,
    title: pr.title,
    description: pr.body || "",
    branch: pr.head?.ref || "",
    baseBranch: pr.base?.ref || "main",
    status: normalizeStatus(pr.state, pr.merged),
    commitsCount: pr.commits || 0,
    changedFiles: pr.changed_files || 0,
    additions: pr.additions || 0,
    deletions: pr.deletions || 0,
    githubUrl: pr.html_url,
    author: {
      login: pr.user?.login,
      avatar: pr.user?.avatar_url,
      name: pr.user?.login,
    },
    reviewers: (pr.requested_reviewers || []).map((r) => ({
      login: r.login,
      avatar: r.avatar_url,
    })),
    labels: (pr.labels || []).map((l) => l.name),
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    mergedAt: pr.merged_at,
    draft: pr.draft || false,
  };
}

// Map GitHub's state strings to our internal status values
function normalizeStatus(state, merged) {
  if (merged) return "approved"; // merged = approved in our system
  if (state === "closed") return "rejected";
  return "open";
}

module.exports = {
  getClient,
  createClient,
  getPRFromGitHub,
  listPRsFromGitHub,
  getPRDiff,
  getPRCommits,
  getPRReviewComments,
  postReviewComment,
  submitReview,
  verifyWebhookSignature,
  normalizePR,
  parseRepo,
};
