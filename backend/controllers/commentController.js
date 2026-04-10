// controllers/commentController.js
const store = require("../models/store");

const addComment = async (req, res, next) => {
  try {
    const { prId, content } = req.body;
    if (!prId || !content) return res.status(400).json({ error: "prId and content are required" });

    const pr = store.findPR(prId);
    if (!pr) return res.status(404).json({ error: "Pull request not found" });

    const comment = store.addComment({ prId, userId: req.user.id, content });

    // Emit to all reviewers
    const io = req.app.get("io");
    if (io) {
      pr.reviewers.forEach((reviewerId) => {
        io.to(`user:${reviewerId}`).emit("new_comment", {
          prId, prTitle: pr.title,
          commentId: comment.id,
          author: req.user.name,
          content: content.substring(0, 80),
        });
      });
    }

    res.status(201).json({ data: { ...comment, user: req.user }, message: "Comment added" });
  } catch (err) { next(err); }
};

module.exports = { addComment };
