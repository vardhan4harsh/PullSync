// ============================================================
// database/models/Comment.js — MongoDB schema for comments
// OWNER: Harsh Gupta
// Comments can be:
//   1. General comments on the PR (like a discussion thread)
//   2. Inline code comments (attached to a specific line in a file)
//   3. Replies to other comments (threaded discussion)
//
// The inlineRef field stores the file + line info for code comments.
// The parentId field allows threading (reply to a comment).
// ============================================================

const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    // Which PR this comment belongs to
    prId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PullRequest",
      required: [true, "PR ID is required"],
      index: true,
    },
    // Who wrote this comment
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [4000, "Comment cannot exceed 4000 characters"],
    },

    // For inline code comments — which file and line number this is on
    inlineRef: {
      file: { type: String },
      line: { type: Number, min: 1 },
      side: { type: String, enum: ["left", "right"] }, // left = old code, right = new code
    },

    // Threading: if this is a reply, parentId points to the original comment
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },

    // Allow marking inline comments as resolved once the issue is fixed
    isResolved: { type: Boolean, default: false },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },

    // Emoji reactions on comments
    reactions: [
      {
        emoji: { type: String },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Indexes for common access patterns
commentSchema.index({ prId: 1, createdAt: 1 });    // load all comments for a PR in order
commentSchema.index({ prId: 1, parentId: 1 });     // load threaded replies
commentSchema.index({ userId: 1, createdAt: -1 }); // load a user's comment history

// Virtual field to load replies to this comment
commentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "parentId",
});

module.exports = mongoose.model("Comment", commentSchema);
