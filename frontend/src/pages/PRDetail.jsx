// pages/PRDetail.jsx
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, GitCommit, FileCode, Plus, Minus, CheckCircle, XCircle, MessageSquare, GitMerge, User } from "lucide-react";
import DiffViewer from "../components/DiffViewer";
import CommentsSection from "../components/CommentsSection";
import { MOCK_PRS, MOCK_COMMENTS } from "../services/mockData";
import { timeAgo, labelColor } from "../utils/format";
import { useAppContext } from "../utils/context";

const statusBadge = {
  open: <span className="badge-open">● Open</span>,
  approved: <span className="badge-approved">✓ Approved</span>,
  rejected: <span className="badge-rejected">✕ Rejected</span>,
};

export default function PRDetail() {
  const { id } = useParams();
  const pr = MOCK_PRS.find((p) => p.id === id) || MOCK_PRS[0];
  const comments = MOCK_COMMENTS[pr.id] || [];
  const [reviewStatus, setReviewStatus] = useState(null);
  const [tab, setTab] = useState("diff");
  const { user, addNotification } = useAppContext();

  const handleAction = (action) => {
    setReviewStatus(action);
    addNotification({
      type: "review",
      message: `You ${action === "approve" ? "approved" : "requested changes on"} PR #${pr.number}`,
      time: "just now",
      prId: pr.id,
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      {/* Back */}
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg transition-colors mb-6">
        <ArrowLeft size={14} /> All Pull Requests
      </Link>

      {/* PR Header */}
      <div className="mb-6">
        <div className="flex items-start gap-3 flex-wrap mb-2">
          {statusBadge[pr.status]}
          <span className="text-fg-subtle text-sm font-mono">#{pr.number}</span>
          {pr.labels?.map((l) => (
            <span key={l} className={`text-xs px-2 py-0.5 rounded border ${labelColor(l)}`}>{l}</span>
          ))}
        </div>
        <h1 className="font-display text-xl font-700 text-fg mb-3">{pr.title}</h1>
        <div className="flex items-center gap-4 text-sm text-fg-muted flex-wrap">
          <span className="flex items-center gap-1.5"><User size={13} /> {pr.author}</span>
          <span>opened {timeAgo(pr.createdAt)}</span>
          <span>·</span>
          <span className="flex items-center gap-1 font-mono">
            <span className="bg-canvas-inset border border-border px-1.5 py-0.5 rounded text-xs">{pr.branch}</span>
            <span>→</span>
            <span className="bg-canvas-inset border border-border px-1.5 py-0.5 rounded text-xs">{pr.baseBranch}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card p-5">
            <h3 className="text-sm font-medium text-fg mb-3">Description</h3>
            <div className="text-sm text-fg-muted leading-relaxed whitespace-pre-line">{pr.description}</div>
          </div>

          {/* Tabs */}
          <div>
            <div className="flex border-b border-border mb-4">
              {[
                { id: "diff", label: "Files Changed", icon: FileCode },
                { id: "comments", label: `Comments (${comments.length})`, icon: MessageSquare },
              ].map(({ id: tabId, label, icon: Icon }) => (
                <button
                  key={tabId}
                  onClick={() => setTab(tabId)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition-colors -mb-px ${
                    tab === tabId
                      ? "border-accent-blue text-accent-blue"
                      : "border-transparent text-fg-muted hover:text-fg"
                  }`}
                >
                  <Icon size={13} /> {label}
                </button>
              ))}
            </div>

            {tab === "diff" && (
              <div className="space-y-3">
                <DiffViewer filename="src/collab/crdt.ts" />
                <DiffViewer filename="src/collab/sync.ts" />
              </div>
            )}
            {tab === "comments" && <CommentsSection prId={pr.id} comments={comments} />}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Review Actions */}
          <div className="card p-4">
            <h4 className="text-xs font-medium text-fg-muted uppercase tracking-wide mb-3">Review Actions</h4>
            {reviewStatus ? (
              <div className={`flex items-center gap-2 p-3 rounded-md text-sm ${
                reviewStatus === "approve"
                  ? "bg-accent-green/10 border border-accent-green/20 text-accent-green"
                  : "bg-accent-red/10 border border-accent-red/20 text-accent-red"
              }`}>
                {reviewStatus === "approve" ? <CheckCircle size={14} /> : <XCircle size={14} />}
                {reviewStatus === "approve" ? "You approved this PR" : "You requested changes"}
              </div>
            ) : (
              <div className="space-y-2">
                <button onClick={() => handleAction("approve")} className="btn-success w-full flex items-center justify-center gap-2">
                  <CheckCircle size={14} /> Approve
                </button>
                <button onClick={() => handleAction("reject")} className="btn-danger w-full flex items-center justify-center gap-2">
                  <XCircle size={14} /> Request Changes
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="card p-4">
            <h4 className="text-xs font-medium text-fg-muted uppercase tracking-wide mb-3">Changes</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-fg-muted flex items-center gap-1.5"><GitCommit size={13} /> Commits</span>
                <span className="text-fg font-mono">{pr.commitsCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg-muted flex items-center gap-1.5"><FileCode size={13} /> Files changed</span>
                <span className="text-fg font-mono">{pr.changedFiles}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg-muted flex items-center gap-1.5"><Plus size={13} className="text-accent-green" /> Additions</span>
                <span className="text-accent-green font-mono">+{pr.additions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-fg-muted flex items-center gap-1.5"><Minus size={13} className="text-accent-red" /> Deletions</span>
                <span className="text-accent-red font-mono">-{pr.deletions}</span>
              </div>
            </div>
          </div>

          {/* Reviewers */}
          <div className="card p-4">
            <h4 className="text-xs font-medium text-fg-muted uppercase tracking-wide mb-3">Reviewers</h4>
            <div className="space-y-2">
              {pr.reviewers.map((rid) => {
                const names = { u1: { n: "Alex Rivera", a: "AR" }, u2: { n: "Sam Chen", a: "SC" }, u3: { n: "Jordan Kim", a: "JK" } };
                const r = names[rid];
                return r ? (
                  <div key={rid} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center text-xs font-bold text-accent-purple">
                      {r.a}
                    </div>
                    <span className="text-sm text-fg-muted">{r.n}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>

          {/* Merge */}
          {pr.status === "approved" && (
            <button className="btn-success w-full flex items-center justify-center gap-2">
              <GitMerge size={14} /> Merge Pull Request
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
