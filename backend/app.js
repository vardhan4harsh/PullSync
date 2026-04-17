// ============================================================
// app.js — Main entry point for the Pull-Sync backend server
// OWNER: Gaurav Parashar
// What this file does:
//   - Starts the Express web server
//   - Connects to MongoDB if the environment variable is set
//   - Sets up Socket.io for real-time notifications
//   - Registers all API routes
// ============================================================

require("dotenv").config(); // Load .env file variables into process.env
const express = require("express");
const http = require("http");
const cors = require("cors");
const morgan = require("morgan");

const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const { initSocket } = require("./websockets/socket");

// Connect to MongoDB only if MONGODB_URI is provided in .env
// If not provided, the app runs using in-memory store (store.js)
if (process.env.MONGODB_URI) {
  const { connect } = require("../database/db");
  connect().catch((err) => console.error("MongoDB init error:", err.message));
}

const app = express();
const server = http.createServer(app); // Wrap app in HTTP server so Socket.io can attach

// Start Socket.io and attach it to the app so controllers can access it
const io = initSocket(server);
app.set("io", io);

// List of allowed frontend URLs that can talk to this backend
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
];

// CORS allows the frontend (different port) to make requests to this backend
app.use(cors({ origin: allowedOrigins, credentials: true }));

// Special handling for GitHub webhook route:
// GitHub sends raw bytes — we need to read them before JSON.parse
// so we can verify the signature (security check)
app.use("/api/webhook", express.raw({ type: "*/*" }), (req, res, next) => {
  req.rawBody = req.body ? req.body.toString("utf8") : "";
  try {
    req.body = JSON.parse(req.rawBody);
  } catch {
    req.body = {};
  }
  next();
});

// Parse JSON bodies for all other routes
app.use(express.json());

// Log every incoming request to the console (method, URL, status code, time)
app.use(morgan(":method :url :status :response-time ms"));

// Mount all API routes under /api prefix
app.use("/api", routes);

// Global error handler — must be registered LAST
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

server.listen(PORT, () => {
  console.log(`\n🚀 Pull-Sync API running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`🔗 GitHub webhook: POST http://localhost:${PORT}/api/webhook`);
  if (process.env.GITHUB_TOKEN) {
    console.log(`✅ GitHub token loaded`);
  } else {
    console.warn(`⚠️  GITHUB_TOKEN not set — diff fetching will be disabled`);
  }
  console.log(`\nDemo tokens:`);
  console.log(`  token_harsh_vardhan   (owner)`);
  console.log(`  token_garima_yadav    (reviewer)`);
  console.log(`  token_harsh_gupta     (reviewer)`);
  console.log(`  token_devesh_tyagi    (reviewer)`);
  console.log(`  token_gaurav_parashar (reviewer)\n`);
});

module.exports = { app, server };
