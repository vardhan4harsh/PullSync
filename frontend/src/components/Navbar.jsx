// OWNER: Garima Yadav
// components/Navbar.jsx
import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bell, GitPullRequest, ChevronDown, LogOut, BarChart, Users } from "lucide-react";
import { useAppContext } from "../utils/context";

export default function Navbar() {
  const { user, logout, notifications, unreadCount, markAllRead } = useAppContext();
  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const userRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleLogout = () => { logout(); navigate("/login"); };

  const navLinks = [
    { to: "/dashboard", label: "Pull Requests", icon: GitPullRequest },
    { to: "/analytics", label: "Analytics", icon: BarChart },
    { to: "/team", label: "Team", icon: Users },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-canvas-inset border-b border-border">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-accent-blue rounded flex items-center justify-center">
            <GitPullRequest size={14} className="text-canvas" />
          </div>
          <span className="font-display font-700 text-lg text-fg tracking-tight">Pull<span className="text-accent-blue">Sync</span></span>
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                location.pathname.startsWith(to)
                  ? "bg-canvas-subtle text-fg"
                  : "text-fg-muted hover:text-fg hover:bg-canvas-subtle"
              }`}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => { setNotifOpen((o) => !o); setUserOpen(false); }}
              className={`relative w-8 h-8 flex items-center justify-center rounded-md text-fg-muted hover:text-fg hover:bg-canvas-subtle transition-colors ${unreadCount > 0 ? "notification-dot" : ""}`}
            >
              <Bell size={16} />
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-10 w-80 card shadow-2xl animate-slide-down">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="text-sm font-medium text-fg">Notifications</span>
                  <button onClick={markAllRead} className="text-xs text-accent-blue hover:underline">Mark all read</button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((n) => (
                    <Link
                      key={n.id}
                      to={`/pr/${n.prId}`}
                      onClick={() => setNotifOpen(false)}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-canvas-inset transition-colors border-b border-border/50 last:border-0 ${!n.read ? "bg-accent-blue/5" : ""}`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? "bg-transparent" : "bg-accent-blue"}`} />
                      <div>
                        <p className="text-sm text-fg">{n.message}</p>
                        <p className="text-xs text-fg-muted mt-0.5">{n.time}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Dropdown */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => { setUserOpen((o) => !o); setNotifOpen(false); }}
              className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-md hover:bg-canvas-subtle transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center text-accent-blue text-xs font-bold">
                {user?.avatar || user?.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?"}
              </div>
              <div className="hidden sm:flex flex-col items-start min-w-0">
                <span className="text-xs text-fg-muted font-medium truncate">{user?.name?.split(" ")[0] || "User"}</span>
                <span className="text-xs text-fg-subtle capitalize">{user?.role || "unknown"}</span>
              </div>
              <ChevronDown size={13} className="text-fg-subtle" />
            </button>
            {userOpen && (
              <div className="absolute right-0 top-10 w-80 card shadow-2xl animate-slide-down border border-border">
                <div className="px-4 py-4 border-b border-border bg-canvas-inset">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent-blue/20 border border-accent-blue/30 flex items-center justify-center text-accent-blue text-sm font-bold flex-shrink-0">
                      {user?.avatar || user?.name?.split(" ").map(n => n[0]).join("").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-fg truncate">{user?.name || "User"}</p>
                      <p className="text-xs text-fg-muted break-all">{user?.email || "No email"}</p>
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-canvas-subtle text-fg-muted border border-border capitalize">
                          {user?.role || "Unknown"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="py-1">
                  <div className="border-t border-border my-1" />
                  {user?.role === "owner" && (
                    <>
                      <Link to="/manage-users" onClick={() => setUserOpen(false)} className="block w-full px-4 py-2 text-sm text-fg-muted hover:text-fg hover:bg-canvas-inset transition-colors rounded-md">
                        Manage Team
                      </Link>
                      <div className="border-t border-border my-1" />
                    </>
                  )}
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-accent-red hover:bg-canvas-inset transition-colors rounded-md mx-1 my-0.5">
                    <LogOut size={14} /> Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
