// ============================================================
// database/models/Session.js — MongoDB schema for login sessions
// OWNER: Garima Yadav
// When a user logs in, a Session document is created and the
// token is sent to the browser. Every subsequent request must
// include that token in the Authorization header.
//
// Sessions expire automatically after 30 days.
// MongoDB's TTL index takes care of deleting expired sessions.
// ============================================================

const mongoose = require("mongoose");
const crypto = require("crypto");

const sessionSchema = new mongoose.Schema(
  {
    // The random secret token sent to the user's browser
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Which user this session belongs to
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // When this session expires (default: 30 days from creation)
    expiresAt: {
      type: Date,
      required: true,
      index: true,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    userAgent: { type: String }, // what browser/device the user logged in from
    ipAddress: { type: String }, // IP address at login time (for security tracking)
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Tell MongoDB to automatically delete session documents after they expire
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static method to generate a secure random token
// Usage: const token = Session.generateToken()
sessionSchema.statics.generateToken = function () {
  return crypto.randomBytes(32).toString("hex"); // 64 character hex string
};

// Instance method to log out (deactivate this session)
sessionSchema.methods.invalidate = function () {
  this.isActive = false;
  return this.save();
};

module.exports = mongoose.model("Session", sessionSchema);
