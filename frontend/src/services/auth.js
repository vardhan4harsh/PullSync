// services/auth.js
import { MOCK_USERS } from "./mockData";

const SESSION_KEY = "pull_sync_session";

export const authService = {
  login(email, password) {
    const user = MOCK_USERS.find((u) => u.email === email);
    if (!user || password.length < 6) {
      throw new Error("Invalid credentials");
    }
    const session = { ...user, token: `mock_token_${Date.now()}` };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },

  signup(name, email, password) {
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
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  isAuthenticated() {
    return !!this.getSession();
  },
};
