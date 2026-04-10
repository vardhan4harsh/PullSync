// pages/Signup.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GitPullRequest, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";
import { useAppContext } from "../utils/context";

export default function Signup() {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAppContext();
  const navigate = useNavigate();

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const checks = [
    { label: "At least 8 characters", ok: form.password.length >= 8 },
    { label: "Passwords match", ok: form.password === form.confirm && form.confirm.length > 0 },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return setError("Passwords don't match");
    setError(""); setLoading(true);
    try {
      await signup(form.name, form.email, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
      <div className="fixed inset-0 opacity-[0.03]" style={{
        backgroundImage: "linear-gradient(#58a6ff 1px, transparent 1px), linear-gradient(90deg, #58a6ff 1px, transparent 1px)",
        backgroundSize: "40px 40px"
      }} />

      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 bg-accent-blue rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-accent-blue/20">
            <GitPullRequest size={22} className="text-canvas" />
          </div>
          <h1 className="font-display text-2xl font-800 text-fg tracking-tight">Pull<span className="text-accent-blue">Sync</span></h1>
          <p className="text-fg-muted text-sm mt-1">Start reviewing code together</p>
        </div>

        <div className="card p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-fg mb-5">Create your account</h2>

          {error && (
            <div className="flex items-center gap-2 bg-accent-red/10 border border-accent-red/20 rounded-md px-3 py-2 mb-4">
              <AlertCircle size={14} className="text-accent-red shrink-0" />
              <p className="text-sm text-accent-red">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-fg-muted mb-1.5">Full name</label>
              <input type="text" className="input w-full" placeholder="Your name" value={form.name} onChange={update("name")} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-fg-muted mb-1.5">Email address</label>
              <input type="email" className="input w-full" placeholder="you@example.com" value={form.email} onChange={update("email")} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-fg-muted mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} className="input w-full pr-9" placeholder="Min. 8 characters" value={form.password} onChange={update("password")} required />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-fg-subtle hover:text-fg-muted transition-colors">
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-fg-muted mb-1.5">Confirm password</label>
              <input type="password" className="input w-full" placeholder="Repeat password" value={form.confirm} onChange={update("confirm")} required />
            </div>

            {form.password.length > 0 && (
              <div className="space-y-1">
                {checks.map((c) => (
                  <div key={c.label} className="flex items-center gap-1.5 text-xs">
                    <CheckCircle size={11} className={c.ok ? "text-accent-green" : "text-fg-subtle"} />
                    <span className={c.ok ? "text-accent-green" : "text-fg-subtle"}>{c.label}</span>
                  </div>
                ))}
              </div>
            )}

            <button type="submit" disabled={loading || !checks.every((c) => c.ok)}
              className="btn-primary w-full justify-center flex items-center py-2.5 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-canvas/30 border-t-canvas rounded-full animate-spin" /> Creating account...</span>
              ) : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-fg-muted mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-accent-blue hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
