// ============================================================
// controllers/commentController.js — Add comments to PRs
// OWNER: Harsh Gupta
// This handles POST /api/comments
// Users can comment on a PR in general, or on a specific line
// of code (inline comment). Inline comments are also synced
// back to GitHub if the PR is linked to a real GitHub repo.
// ============================================================

const store = require("../models/store");
const github = require("../services/githubService");

// POST /api/comments
// Body: { prId, content, file?, line?, commitSha? }
// file, line, commitSha are optional — only needed for inline code comments
const addComment = async (req, res, next) => {
  try {
    const { prId, content, file, line, commitSha } = req.body;

    if (!prId || !content) {
      return res.status(400).json({ error: "prId and content are required" });
    }

    // Make sure the PR actually exists
    const pr = store.findPR(prId);
    if (!pr) return res.status(404).json({ error: "Pull request not found" });

    // Save the comment to the in-memory store
    const comment = store.addComment({ prId, userId: req.user.id, content, file, line });

    // If this is an inline code comment AND the PR has GitHub info,
    // also post the comment on GitHub so it shows up there too
    if (pr.repoFullName && pr.githubNumber && process.env.GITHUB_TOKEN && file && line && commitSha) {
      github.postReviewComment(pr.repoFullName, pr.githubNumber, {
        body: content,
        commitSha,
        path: file,
        line,
      })
        .then(() => console.log(`[GITHUB] Comment synced on ${file}:${line}`))
        .catch((err) => console.warn(`[GITHUB] Comment sync failed: ${err.message}`));
    }

    // Send a real-time notification to the PR author and all reviewers
    // (except the person who just commented)
    const io = req.app.get("io");
    if (io) {
      const recipients = [...new Set([pr.authorId, ...pr.reviewers])].filter(
        (id) => id !== req.user.id
      );
      recipients.forEach((reviewerId) => {
        io.to(`user:${reviewerId}`).emit("new_comment", {
          prId,
          prTitle: pr.title,
          commentId: comment.id,
          author: req.user.name,
          content: content.substring(0, 80), // send a preview of the comment
        });
      });
    }

    res.status(201).json({ data: { ...comment, user: req.user }, message: "Comment added" });
  } catch (err) {
    next(err);
  }
};

module.exports = { addComment };
