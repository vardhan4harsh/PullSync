// ============================================================
// middleware/auth.js — Checks if the user is logged in
// OWNER: Garima Yadav
// How it works:
//   Every protected API request must include a token in the
//   header like: Authorization: Bearer <your_token>
//   This file checks that token and figures out who the user is.
//   If the token is invalid or missing, the request is blocked.
// ============================================================

const User = require("../../database/models/User");
const Session = require("../../database/models/Session");
const store = require("../models/store");

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // Check that the header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  // Extract the actual token string (everything after "Bearer ")
  const token = authHeader.slice(7);

  // Look up the token in the database to find which user it belongs to
  validateToken(token)
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: "Invalid token" });
      }
      // Attach the user info to the request so controllers can use it
      req.user = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      };
      next(); // Token is valid, continue to the next handler
    })
    .catch((err) => {
      console.error("Auth error:", err);
      res.status(401).json({ error: "Invalid token" });
    });
};

// Looks up the token in the Session collection in MongoDB.
// Falls back to the in-memory store if MongoDB is unavailable.
async function validateToken(token) {
  try {
    // Find an active session that hasn't expired yet
    const session = await Session.findOne({
      token,
      isActive: true,
      expiresAt: { $gt: new Date() }, // expiresAt must be in the future
    }).lean();

    if (!session) {
      // MongoDB didn't find it — try the in-memory store (for demo tokens)
      const user = store.findUserByToken(token);
      return user;
    }

    // Found a valid session — load the full user record
    const user = await User.findById(session.userId).lean();
    return user;
  } catch (err) {
    console.error("Token validation error:", err);
    // If MongoDB is down, fall back to in-memory store
    return store.findUserByToken(token);
  }
}
