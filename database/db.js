// ============================================================
// database/db.js — MongoDB connection setup
// OWNER: Harsh Gupta
// This file handles connecting to MongoDB.
// It's imported once in app.js when the server starts.
// If MongoDB isn't available, the app runs in-memory mode using store.js.
// ============================================================

const mongoose = require("mongoose");

// Connect to the MongoDB database
// Default URL is local MongoDB; override by setting MONGODB_URI in .env
async function connect(uri = process.env.MONGODB_URI || "mongodb://localhost:27017/pullsync") {
  try {
    await mongoose.connect(uri, {
      maxPoolSize: 10,              // allow up to 10 simultaneous database operations
      serverSelectionTimeoutMS: 5000, // give up connecting after 5 seconds
    });
    // Hide password from logs if it's in the URI
    console.log("✅ MongoDB connected:", uri.replace(/\/\/.*@/, "//***@"));
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1); // crash the server — can't run without a DB if this was intentional
  }

  // Log if we get disconnected (e.g. server goes down temporarily)
  mongoose.connection.on("disconnected", () => console.warn("⚠️  MongoDB disconnected"));
  mongoose.connection.on("reconnected", () => console.log("✅ MongoDB reconnected"));
}

async function disconnect() {
  await mongoose.disconnect();
}

module.exports = { connect, disconnect };
