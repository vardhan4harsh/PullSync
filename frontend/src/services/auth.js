// OWNER: Garima Yadav
// services/auth.js — Auth service with real API + mock fallback
import { MOCK_USERS } from "./mockData";

const SESSION_KEY = "pull_sync_session";
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// Try to hit real backend; fall back to mock if unreachable
async function tryRealAPI(path, body) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal: AbortSignal.timeout(3000),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || `Server error ${res.status}`);
    }
    const data = await res.json();
    return data.data;
  } catch (err) {
    if (err.name === "TypeError" || err.name === "AbortError") return null;
    throw err;
  }
}

export const authService = {
  async login(email, password) {
    const realUser = await tryRealAPI("/auth/login", { email, password });
    if (realUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(realUser));
      return realUser;
    }
    // Fallback: mock login using actual MOCK_USERS data
    const user = MOCK_USERS.find((u) => u.email === email);
    if (!user || password.length < 6) throw new Error("Invalid credentials");
    const session = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      token: `token_${user.name.toLowerCase().replace(/\s+/g, "_")}`,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  async signup(name, email, password) {
    const realUser = await tryRealAPI("/auth/signup", { name, email, password });
    if (realUser) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(realUser));
      return realUser;
    }
    const exists = MOCK_USERS.find((u) => u.email === email);
    if (exists) throw new Error("Email already registered");
    if (password.length < 8) throw new Error("Password must be at least 8 characters");
    const newUser = {
      id: `u${Date.now()}`,
      name,
      email,
      avatar: name.split(" ").map((n) => n[0]).join("").toUpperCase(),
      role: "viewer",
      token: `mock_token_${Date.now()}`,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    return newUser;
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      // Validate session has required fields
      if (!session.token || !session.email) return null;
      return session;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    return !!this.getSession();
  },
};
