// hooks/useNotifications.js
import { useState, useCallback } from "react";
import { MOCK_NOTIFICATIONS } from "../services/mockData";

export function useNotifications() {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const markRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const addNotification = useCallback((notif) => {
    setNotifications((prev) => [{ ...notif, id: `n${Date.now()}`, read: false }, ...prev]);
  }, []);

  return { notifications, unreadCount, markAllRead, markRead, addNotification };
}
