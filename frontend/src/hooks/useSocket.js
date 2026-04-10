// frontend/src/hooks/useSocket.js
// React hook for Socket.io client integration
import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

export function useSocket({ user, onNewPR, onNewComment, onReviewUpdate, onUserTyping }) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user?.token) return;

    // Connect to socket server
    const socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
    });
    socketRef.current = socket;

    // Authenticate and join personal room
    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id);
      socket.emit("join", { userId: user.id, token: user.token });
    });

    socket.on("joined", ({ room, userName }) => {
      console.log(`[Socket] Joined room ${room} as ${userName}`);
    });

    // ── Event listeners ───────────────────────────────────────
    socket.on("new_pr", (data) => {
      console.log("[Socket] new_pr:", data);
      onNewPR?.(data);
    });

    socket.on("new_comment", (data) => {
      console.log("[Socket] new_comment:", data);
      onNewComment?.(data);
    });

    socket.on("review_update", (data) => {
      console.log("[Socket] review_update:", data);
      onReviewUpdate?.(data);
    });

    socket.on("user_typing", (data) => {
      onUserTyping?.(data);
    });

    socket.on("error", (err) => {
      console.error("[Socket] Error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [user?.id, user?.token]);

  // Subscribe to a specific PR's activity
  const subscribePR = useCallback((prId) => {
    socketRef.current?.emit("subscribe_pr", { prId });
  }, []);

  // Emit typing indicator
  const sendTyping = useCallback((prId) => {
    if (user?.id) socketRef.current?.emit("typing", { prId, userId: user.id });
  }, [user?.id]);

  return { subscribePR, sendTyping, socket: socketRef.current };
}
