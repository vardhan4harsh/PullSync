// controllers/prController.js
const store = require("../models/store");

const prService = require("../services/prService");

const listPRs = async (req, res, next) => {
  try {
    const { status, author } = req.query;
    let prs = [...store.pullRequests];
    if (status) prs = prs.filter((p) => p.status === status);
    if (author) prs = prs.filter((p) => p.authorId === author);
    prs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    const enriched = prs.map((pr) => ({
      ...pr,
      author: store.findUser(pr.authorId)?.name,
      commentCount: store.getCommentsForPR(pr.id).length,
      reviewCount: store.getReviewsForPR(pr.id).length,
    }));
    res.json({ data: enriched, total: enriched.length });
  } catch (err) { next(err); }
};

const getPR = async (req, res, next) => {
  try {
    const pr = store.findPR(req.params.id);
    if (!pr) return res.status(404).json({ error: "Pull request not found" });

    const enriched = {
      ...pr,
      author: store.findUser(pr.authorId),
      comments: store.getCommentsForPR(pr.id).map((c) => ({
        ...c, user: store.findUser(c.userId),
      })),
      reviews: store.getReviewsForPR(pr.id).map((r) => ({
        ...r, reviewer: store.findUser(r.reviewerId),
      })),
    };
    res.json({ data: enriched });
  } catch (err) { next(err); }
};

const createPR = async (req, res, next) => {
  try {
    const { title, description, branch, baseBranch = "main", reviewers = [] } = req.body;
    if (!title || !branch) {
      return res.status(400).json({ error: "title and branch are required" });
    }
    const pr = store.addPR({
      title, description, branch, baseBranch, reviewers,
      authorId: req.user.id,
      status: "open",
      commitsCount: 0, changedFiles: 0, additions: 0, deletions: 0,
    });

    // Emit socket event
    req.app.get("io")?.emit("new_pr", {
      prId: pr.id, title: pr.title, author: req.user.name, number: pr.number,
    });

    res.status(201).json({ data: pr, message: "Pull request created" });
  } catch (err) { next(err); }
};

module.exports = { listPRs, getPR, createPR };
