// OWNER: Harsh Vardhan
// components/CreatePRModal.jsx — New Pull Request modal with API integration
import { useState, useEffect, useRef } from "react";
import { X, GitBranch, GitMerge, Users, Tag, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { prAPI } from "../services/api";
import { MOCK_USERS } from "../services/mockData";
import { useAppContext } from "../utils/context";

const LABEL_OPTIONS = ["feature", "bug", "refactor", "critical", "security", "documentation", "performance", "breaking-change"];

const labelColor = (label) => {
  const map = {
    feature: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    "breaking-change": "bg-red-500/10 text-red-400 border-red-500/30",
    bug: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    critical: "bg-red-500/10 text-red-400 border-red-500/30",
    security: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    refactor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    documentation: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
    performance: "bg-green-500/10 text-green-400 border-green-500/30",
  };
  return map[label] || "bg-gray-500/10 text-gray-400 border-gray-500/30";
};

export default function CreatePRModal({ onClose, onCreated }) {
  const { user } = useAppContext();
  const overlayRef = useRef(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    branch: "",
    baseBranch: "main",
    reviewers: [],
    labels: [],
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Trap scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const set = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  const toggleReviewer = (uid) => {
    if (uid === user?.id) return; // can't review own PR
    setForm((f) => ({
      ...f,
      reviewers: f.reviewers.includes(uid)
        ? f.reviewers.filter((r) => r !== uid)
        : [...f.reviewers, uid],
    }));
  };

  const toggleLabel = (label) => {
    setForm((f) => ({
      ...f,
      labels: f.labels.includes(label)
        ? f.labels.filter((l) => l !== label)
        : [...f.labels, label],
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Title is required";
    else if (form.title.trim().length < 5) errs.title = "Title must be at least 5 characters";
    if (!form.branch.trim()) errs.branch = "Branch name is required";
    else if (!/^[a-zA-Z0-9/_.-]+$/.test(form.branch.trim())) errs.branch = "Invalid branch name";
    if (form.branch.trim() === form.baseBranch) errs.branch = "Branch and base branch must differ";
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    setServerError("");
    try {
      const newPR = await prAPI.create({
        title: form.title.trim(),
        description: form.description.trim(),
        branch: form.branch.trim(),
        baseBranch: form.baseBranch,
        reviewers: form.reviewers,
        labels: form.labels,
      });
      setSuccess(true);
      setTimeout(() => {
        onCreated?.(newPR);
        onClose();
      }, 1200);
    } catch (err) {
      // If backend is unreachable, create a local mock PR so the UI still works
      if (err.message.includes("fetch") || err.message.includes("Failed")) {
        const mockPR = {
          id: `pr-${Date.now()}`,
          number: Math.floor(Math.random() * 100) + 300,
          title: form.title.trim(),
          description: form.description.trim(),
          branch: form.branch.trim(),
          baseBranch: form.baseBranch,
          reviewers: form.reviewers,
          labels: form.labels,
          authorId: user?.id,
          author: user?.name || "You",
          status: "open",
          commitsCount: 0,
          changedFiles: 0,
          additions: 0,
          deletions: 0,
          commentCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setSuccess(true);
        setTimeout(() => {
          onCreated?.(mockPR);
          onClose();
        }, 1200);
      } else {
        setServerError(err.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const reviewableUsers = MOCK_USERS.filter((u) => u.id !== user?.id);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border shadow-2xl"
        style={{
          backgroundColor: "var(--canvas-inset, #0d1117)",
          borderColor: "var(--border, #30363d)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border, #30363d)" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: "var(--accent-blue, #388bfd)20" }}>
              <GitMerge size={14} style={{ color: "var(--accent-blue, #388bfd)" }} />
            </div>
            <h2 className="font-semibold text-base" style={{ color: "var(--fg, #e6edf3)" }}>Open New Pull Request</h2>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center transition-colors hover:bg-white/10"
            style={{ color: "var(--fg-muted, #8b949e)" }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Success state */}
        {success ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ backgroundColor: "var(--accent-green, #3fb950)20" }}>
              <CheckCircle size={28} style={{ color: "var(--accent-green, #3fb950)" }} />
            </div>
            <div className="text-center">
              <p className="font-semibold" style={{ color: "var(--fg, #e6edf3)" }}>Pull request created!</p>
              <p className="text-sm mt-1" style={{ color: "var(--fg-muted, #8b949e)" }}>Redirecting you to the dashboard…</p>
            </div>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5">
            {/* Server error */}
            {serverError && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg border text-sm" style={{ backgroundColor: "var(--accent-red, #f85149)10", borderColor: "var(--accent-red, #f85149)30", color: "var(--accent-red, #f85149)" }}>
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--fg-muted, #8b949e)" }}>
                Title <span style={{ color: "var(--accent-red, #f85149)" }}>*</span>
              </label>
              <input
                className="w-full rounded-lg px-3 py-2 text-sm border outline-none transition-colors"
                style={{
                  backgroundColor: "var(--canvas, #010409)",
                  borderColor: errors.title ? "var(--accent-red, #f85149)" : "var(--border, #30363d)",
                  color: "var(--fg, #e6edf3)",
                }}
                placeholder="feat: add user authentication with OAuth 2.0"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                maxLength={256}
                autoFocus
              />
              {errors.title && <p className="mt-1 text-xs" style={{ color: "var(--accent-red, #f85149)" }}>{errors.title}</p>}
            </div>

            {/* Branch fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--fg-muted, #8b949e)" }}>
                  <span className="flex items-center gap-1"><GitBranch size={11} /> Source Branch <span style={{ color: "var(--accent-red, #f85149)" }}>*</span></span>
                </label>
                <input
                  className="w-full rounded-lg px-3 py-2 text-sm border outline-none font-mono"
                  style={{
                    backgroundColor: "var(--canvas, #010409)",
                    borderColor: errors.branch ? "var(--accent-red, #f85149)" : "var(--border, #30363d)",
                    color: "var(--fg, #e6edf3)",
                  }}
                  placeholder="feat/my-feature"
                  value={form.branch}
                  onChange={(e) => set("branch", e.target.value)}
                />
                {errors.branch && <p className="mt-1 text-xs" style={{ color: "var(--accent-red, #f85149)" }}>{errors.branch}</p>}
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--fg-muted, #8b949e)" }}>
                  <span className="flex items-center gap-1"><GitMerge size={11} /> Base Branch</span>
                </label>
                <select
                  className="w-full rounded-lg px-3 py-2 text-sm border outline-none font-mono"
                  style={{
                    backgroundColor: "var(--canvas, #010409)",
                    borderColor: "var(--border, #30363d)",
                    color: "var(--fg, #e6edf3)",
                  }}
                  value={form.baseBranch}
                  onChange={(e) => set("baseBranch", e.target.value)}
                >
                  <option value="main">main</option>
                  <option value="develop">develop</option>
                  <option value="staging">staging</option>
                  <option value="release">release</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--fg-muted, #8b949e)" }}>
                Description
              </label>
              <textarea
                className="w-full rounded-lg px-3 py-2 text-sm border outline-none resize-none"
                style={{
                  backgroundColor: "var(--canvas, #010409)",
                  borderColor: "var(--border, #30363d)",
                  color: "var(--fg, #e6edf3)",
                  minHeight: "100px",
                }}
                placeholder="Describe the changes in this PR, why they're needed, and any relevant context…"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                maxLength={10000}
              />
            </div>

            {/* Reviewers */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--fg-muted, #8b949e)" }}>
                <span className="flex items-center gap-1"><Users size={11} /> Reviewers</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {reviewableUsers.map((u) => {
                  const selected = form.reviewers.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => toggleReviewer(u.id)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all"
                      style={{
                        backgroundColor: selected ? "var(--accent-blue, #388bfd)15" : "var(--canvas, #010409)",
                        borderColor: selected ? "var(--accent-blue, #388bfd)60" : "var(--border, #30363d)",
                        color: selected ? "var(--accent-blue, #388bfd)" : "var(--fg-muted, #8b949e)",
                      }}
                    >
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          backgroundColor: selected ? "var(--accent-blue, #388bfd)30" : "var(--canvas-inset, #0d1117)",
                          color: selected ? "var(--accent-blue, #388bfd)" : "var(--fg-subtle, #6e7681)",
                        }}
                      >
                        {u.avatar || u.name[0]}
                      </div>
                      {u.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Labels */}
            <div>
              <label className="block text-xs font-medium mb-2" style={{ color: "var(--fg-muted, #8b949e)" }}>
                <span className="flex items-center gap-1"><Tag size={11} /> Labels</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {LABEL_OPTIONS.map((label) => {
                  const selected = form.labels.includes(label);
                  return (
                    <button
                      key={label}
                      onClick={() => toggleLabel(label)}
                      className={`text-xs px-2.5 py-1 rounded border transition-all ${labelColor(label)}`}
                      style={{ opacity: selected ? 1 : 0.45 }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t" style={{ borderColor: "var(--border, #30363d)" }}>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-lg border transition-colors"
                style={{
                  backgroundColor: "transparent",
                  borderColor: "var(--border, #30363d)",
                  color: "var(--fg-muted, #8b949e)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 text-sm rounded-lg font-medium flex items-center gap-2 transition-all"
                style={{
                  backgroundColor: "var(--accent-blue, #388bfd)",
                  color: "#fff",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? (
                  <><Loader2 size={13} className="animate-spin" /> Creating…</>
                ) : (
                  <><GitMerge size={13} /> Open Pull Request</>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
