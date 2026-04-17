// ============================================================
// controllers/authController.js — Login and signup logic
// OWNER: Garima Yadav
// This file handles two things:
//   1. Login — verify email/password, return a session token
//   2. Signup — create a new user account, return a session token
// The token returned is what the frontend stores and sends with
// every future request to prove the user is logged in.
// ============================================================

const crypto = require("crypto");
const { v4: uuid } = require("uuid");
const User = require("../../database/models/User");
const Session = require("../../database/models/Session");

// Hash a password using SHA-256 — same method used in seed.js
// We never store plain passwords, only hashes
function hashPassword(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

// Create initials from a full name (e.g. "Harsh Vardhan" → "HV")
function getAvatar(name) {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase();
}

// POST /api/auth/login
// Body: { email, password }
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    // Find the user by email (case-insensitive search)
    // We use .select("+passwordHash") because passwordHash is hidden by default in the schema
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash");
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Hash the provided password and compare to what's stored
    const passwordHash = hashPassword(password);
    if (passwordHash !== user.passwordHash) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Create a new session and save it to the database
    const token = Session.generateToken();
    const session = new Session({
      token,
      userId: user._id,
      userAgent: req.get("user-agent"), // store what browser/device they're using
      ipAddress: req.ip,
    });
    await session.save();

    // Send back the user info and the token
    res.json({
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: getAvatar(user.name),
        token: token,
      },
      message: "Login successful",
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/signup
// Body: { name, email, password }
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email, and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    // Check if someone already signed up with this email
    const exists = await User.findOne({ email: email.toLowerCase().trim() });
    if (exists) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Create and save the new user (new users start as "viewer" role)
    const passwordHash = hashPassword(password);
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "viewer",
      isActive: true,
    });
    await newUser.save();

    // Create a session for them right away so they're logged in immediately
    const token = Session.generateToken();
    const session = new Session({
      token,
      userId: newUser._id,
      userAgent: req.get("user-agent"),
      ipAddress: req.ip,
    });
    await session.save();

    res.status(201).json({
      data: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar: getAvatar(newUser.name),
        token: token,
      },
      message: "Account created",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, signup };
