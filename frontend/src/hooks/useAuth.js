// OWNER: Harsh Vardhan
// hooks/useAuth.js
import { useState, useCallback } from "react";
import { authService } from "../services/auth";

export function useAuth() {
  const [user, setUser] = useState(() => authService.getSession());

  const login = useCallback(async (email, password) => {
    const session = await authService.login(email, password);
    setUser(session);
    return session;
  }, []);

  const signup = useCallback(async (name, email, password) => {
    const session = await authService.signup(name, email, password);
    setUser(session);
    return session;
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  return { user, login, signup, logout, isAuthenticated: !!user };
}
