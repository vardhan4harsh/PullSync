// database/models/Comment.js
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    prId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PullRequest",
      required: [true, "PR ID is required"],
      index: true,
    },
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
    // Inline code comment position
    inlineRef: {
      file: { type: String },
      line: { type: Number, min: 1 },
      side: { type: String, enum: ["left", "right"] },
    },
    // Threading
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
    },
    isResolved: { type: Boolean, default: false },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
    // Reactions
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

// Compound indexes
commentSchema.index({ prId: 1, createdAt: 1 });    // Get comments for a PR in order
commentSchema.index({ prId: 1, parentId: 1 });     // Get threaded replies
commentSchema.index({ userId: 1, createdAt: -1 }); // User's comment history

// Virtual: replies
commentSchema.virtual("replies", {
  ref: "Comment",
  localField: "_id",
  foreignField: "parentId",
});

module.exports = mongoose.model("Comment", commentSchema);
