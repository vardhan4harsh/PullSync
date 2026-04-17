// OWNER: Garima Yadav
// App.jsx — with socket integration
import { Routes, Route, Navigate } from "react-router-dom";
import { AppContext } from "./utils/context";
import { useAuth } from "./hooks/useAuth";
import { useNotifications } from "./hooks/useNotifications";
import { useSocket } from "./hooks/useSocket";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import PRDetail from "./pages/PRDetail";
import Analytics from "./pages/Analytics";
import Team from "./pages/Team";
import UserManagement from "./pages/UserManagement";

function ProtectedLayout({ children }) {
  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />
      <main>{children}</main>
    </div>
  );
}

function RequireAuth({ children }) {
  const raw = localStorage.getItem("pull_sync_session");
  return raw ? children : <Navigate to="/login" replace />;
}

function AppInner() {
  const { user, login, signup, logout } = useAuth();
  const { notifications, unreadCount, markAllRead, markRead, addNotification } = useNotifications();

  // Wire real-time socket events → local notifications
  useSocket({
    user,
    onNewPR: (data) => addNotification({
      type: "pr",
      message: `New PR #${data.number} opened by ${data.author}`,
      time: "just now",
      prId: data.prId,
    }),
    onNewComment: (data) => addNotification({
      type: "comment",
      message: `New comment on PR: "${data.content?.slice(0, 50)}…"`,
      time: "just now",
      prId: data.prId,
    }),
    onReviewUpdate: (data) => addNotification({
      type: "review",
      message: `${data.reviewerName} ${data.decision === "approve" ? "approved" : "requested changes on"} PR #${data.prNumber}`,
      time: "just now",
      prId: data.prId,
    }),
  });

  const ctx = { user, login, signup, logout, notifications, unreadCount, markAllRead, markRead, addNotification };

  return (
    <AppContext.Provider value={ctx}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={
          <RequireAuth><ProtectedLayout><Dashboard /></ProtectedLayout></RequireAuth>
        } />
        <Route path="/pr/:id" element={
          <RequireAuth><ProtectedLayout><PRDetail /></ProtectedLayout></RequireAuth>
        } />
        <Route path="/analytics" element={
          <RequireAuth><ProtectedLayout><Analytics /></ProtectedLayout></RequireAuth>
        } />
        <Route path="/team" element={
          <RequireAuth><ProtectedLayout><Team /></ProtectedLayout></RequireAuth>
        } />
        <Route path="/manage-users" element={
          <RequireAuth><ProtectedLayout><UserManagement /></ProtectedLayout></RequireAuth>
        } />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppContext.Provider>
  );
}

export default AppInner;
