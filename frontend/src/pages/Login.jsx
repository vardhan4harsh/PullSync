// OWNER: Harsh Vardhan
// pages/Login.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GitPullRequest, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAppContext } from "../utils/context";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAppContext();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
      {/* Background grid */}
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(#58a6ff 1px, transparent 1px), linear-gradient(90deg, #58a6ff 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-accent-blue rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-accent-blue/20">
            <GitPullRequest size={22} className="text-canvas" />
          </div>
          <h1 className="font-display text-2xl font-800 text-fg tracking-tight">Pull<span className="text-accent-blue">Sync</span></h1>
          <p className="text-fg-muted text-sm mt-1">Collaborative code review platform</p>
        </div>

        <div className="card p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-fg mb-5">Sign in to your account</h2>

          {error && (
            <div className="flex items-center gap-2 bg-accent-red/10 border border-accent-red/20 rounded-md px-3 py-2 mb-4 animate-fade-in">
              <AlertCircle size={14} className="text-accent-red shrink-0" />
              <p className="text-sm text-accent-red">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-fg-muted mb-1.5">Email address</label>
              <input
                type="email"
                className="input w-full"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-fg-muted mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  className="input w-full pr-9"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" onClick={() => setShowPw((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg-muted transition-colors">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center flex items-center py-2.5 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-canvas/30 border-t-canvas rounded-full animate-spin" /> Signing in...</span>
              ) : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-fg-muted mt-4">
            Don't have an account?{" "}
            <Link to="/signup" className="text-accent-blue hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
