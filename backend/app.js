// app.js — Pull-Sync Backend Entry Point
const express = require("express");
const http = require("http");
const cors = require("cors");
const morgan = require("morgan");

const routes = require("./routes");
const errorHandler = require("./middleware/errorHandler");
const { initSocket } = require("./websockets/socket");

const app = express();
const server = http.createServer(app);

// Init Socket.io
const io = initSocket(server);
app.set("io", io);

// Middleware
app.use(cors({ origin: ["http://localhost:5173", "http://localhost:3000"], credentials: true }));
app.use(express.json());
app.use(morgan(":method :url :status :response-time ms"));

// Routes
app.use("/api", routes);

// Error Handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`\n🚀 Pull-Sync API running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready`);
  console.log(`\nDemo token: token_alex (Alex Rivera / owner)`);
  console.log(`Demo token: token_sam  (Sam Chen / reviewer)\n`);
});

module.exports = { app, server };
