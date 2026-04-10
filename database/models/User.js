// database/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Never return in queries by default
    },
    role: {
      type: String,
      enum: { values: ["owner", "reviewer", "viewer"], message: "Role must be owner, reviewer, or viewer" },
      default: "viewer",
    },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    lastSeenAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Indexes
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Virtual: avatar initials
userSchema.virtual("initials").get(function () {
  return this.name.split(" ").map((n) => n[0]).join("").toUpperCase();
});

// Instance method: safe public representation
userSchema.methods.toPublic = function () {
  return { id: this._id, name: this.name, email: this.email, role: this.role, initials: this.initials };
};

module.exports = mongoose.model("User", userSchema);
