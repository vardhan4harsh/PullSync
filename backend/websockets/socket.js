// websockets/socket.js — Pull-Sync Real-time Notification System
const { Server } = require("socket.io");
const store = require("../models/store");

// Track connected users: userId -> Set of socket IDs
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

    // ── JOIN ────────────────────────────────────────────────
    // Client sends { userId, token } to authenticate and join their room
    socket.on("join", ({ userId, token }) => {
      const user = store.findUserByToken(token);
      if (!user || user.id !== userId) {
        socket.emit("error", { message: "Authentication failed" });
        return;
      }

      // Join user-specific room
      const room = `user:${userId}`;
      socket.join(room);
      socket.userId = userId;

      // Track connection
      if (!connectedUsers.has(userId)) connectedUsers.set(userId, new Set());
      connectedUsers.get(userId).add(socket.id);

      console.log(`[WS] User ${user.name} joined room ${room}`);
      socket.emit("joined", { userId, room, userName: user.name });

      // Broadcast presence to others
      socket.broadcast.emit("user_online", { userId, name: user.name });
    });

    // ── SUBSCRIBE TO PR ─────────────────────────────────────
    socket.on("subscribe_pr", ({ prId }) => {
      socket.join(`pr:${prId}`);
      console.log(`[WS] Socket ${socket.id} subscribed to PR ${prId}`);
    });

    // ── TYPING INDICATOR ────────────────────────────────────
    socket.on("typing", ({ prId, userId }) => {
      socket.to(`pr:${prId}`).emit("user_typing", { userId, prId });
    });

    // ── DISCONNECT ──────────────────────────────────────────
    socket.on("disconnect", () => {
      const userId = socket.userId;
      if (userId) {
        const sockets = connectedUsers.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            connectedUsers.delete(userId);
            socket.broadcast.emit("user_offline", { userId });
          }
        }
      }
      console.log(`[WS] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

// ── EMIT HELPERS (called from controllers) ──────────────────

/** Notify a specific user */
function notifyUser(io, userId, event, data) {
  io.to(`user:${userId}`).emit(event, data);
}

/** Notify all subscribers of a PR */
function notifyPR(io, prId, event, data) {
  io.to(`pr:${prId}`).emit(event, data);
}

/** Broadcast to all connected users */
function broadcast(io, event, data) {
  io.emit(event, data);
}

/** Get list of online user IDs */
function getOnlineUsers() {
  return [...connectedUsers.keys()];
}

module.exports = { initSocket, notifyUser, notifyPR, broadcast, getOnlineUsers };
