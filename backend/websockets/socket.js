// ============================================================
// websockets/socket.js — Real-time notifications via Socket.io
// OWNER: Gaurav Parashar
// Socket.io lets the server push updates to the browser
// instantly without the browser needing to refresh or poll.
//
// How it works:
//   1. User opens the app → browser connects to this socket server
//   2. Browser sends { userId, token } to authenticate
//   3. Server verifies the token and puts the user in their own "room"
//   4. When events happen (new PR, review submitted), the server
//      emits to the right rooms so only the right people get notified
// ============================================================

const { Server } = require("socket.io");
const store = require("../models/store");

// Try to load MongoDB Session model — falls back to in-memory only if unavailable
let Session = null;
try {
  Session = require("../../database/models/Session");
} catch {
  console.warn("[WS] MongoDB Session model not available - using in-memory auth only");
}

// Track which socket IDs belong to which user
// Map: userId → Set of socket IDs (one user can have multiple browser tabs open)
const connectedUsers = new Map();

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);

    // When the browser connects, it must authenticate by sending userId + token
    socket.on("join", async ({ userId, token }) => {
      let user = null;

      try {
        // Check in-memory store first (fast path for demo tokens)
        user = store.findUserByToken(token);

        // If not found in store, check MongoDB Session collection
        if (!user && Session) {
          try {
            const session = await Session.findOne({ token }).populate("userId");
            if (session && session.userId._id.toString() === userId) {
              user = {
                id: session.userId._id.toString(),
                name: session.userId.name,
                token: token,
              };
            }
          } catch (dbErr) {
            console.warn("[WS] Failed to query MongoDB:", dbErr.message);
          }
        }
      } catch (err) {
        console.error("[WS] Auth error:", err);
      }

      if (!user) {
        // Token is invalid — disconnect this socket
        socket.emit("auth_error", { message: "Invalid token" });
        socket.disconnect();
        return;
      }

      // Put the user in their personal room so we can send them targeted notifications
      socket.join(`user:${user.id}`);

      // Track this socket connection
      if (!connectedUsers.has(user.id)) {
        connectedUsers.set(user.id, new Set());
      }
      connectedUsers.get(user.id).add(socket.id);

      console.log(`[WS] User ${user.name} authenticated (${socket.id})`);

      // Tell the browser that authentication succeeded
      socket.emit("authenticated", {
        userId: user.id,
        name: user.name,
        onlineUsers: connectedUsers.size,
      });

      // Let everyone know this person came online
      io.emit("user_online", { userId: user.id, name: user.name });
    });

    // User subscribes to updates for a specific PR
    socket.on("subscribe_pr", ({ prId }) => {
      socket.join(`pr:${prId}`);
      console.log(`[WS] Socket ${socket.id} subscribed to PR ${prId}`);
    });

    // User stops watching a specific PR
    socket.on("unsubscribe_pr", ({ prId }) => {
      socket.leave(`pr:${prId}`);
    });

    // When a browser tab closes or the user loses internet
    socket.on("disconnect", () => {
      console.log(`[WS] Client disconnected: ${socket.id}`);

      // Remove this socket from the connected users map
      for (const [uid, sockets] of connectedUsers.entries()) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          // All their tabs are closed — they're fully offline
          connectedUsers.delete(uid);
          io.emit("user_offline", { userId: uid });
        }
      }
    });
  });

  return io;
}

module.exports = { initSocket, connectedUsers };
