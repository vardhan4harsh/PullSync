// OWNER: Harsh Vardhan
// components/PRCard.jsx
import { Link } from "react-router-dom";
import { MessageSquare, GitCommit, Clock, User } from "lucide-react";
import { timeAgo, labelColor } from "../utils/format";

const statusBadge = {
  open: <span className="badge-open">● Open</span>,
  approved: <span className="badge-approved">✓ Approved</span>,
  rejected: <span className="badge-rejected">✕ Rejected</span>,
  draft: <span className="badge-draft">◌ Draft</span>,
};

export default function PRCard({ pr }) {
  return (
    <Link to={`/pr/${pr.id}`} className="block">
      <div className="card p-4 hover:border-fg-subtle transition-all duration-150 hover:shadow-lg group">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {statusBadge[pr.status]}
              <span className="text-xs text-fg-subtle font-mono">#{pr.number}</span>
              {pr.labels?.map((l) => (
                <span key={l} className={`text-xs px-1.5 py-0.5 rounded border ${labelColor(l)}`}>{l}</span>
              ))}
            </div>
            <h3 className="text-sm font-medium text-fg group-hover:text-accent-blue transition-colors line-clamp-1">
              {pr.title}
            </h3>
            <div className="flex items-center gap-3 mt-2 text-xs text-fg-muted flex-wrap">
              <span className="flex items-center gap-1">
                <User size={11} /> {pr.author}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={11} /> {timeAgo(pr.updatedAt)}
              </span>
              <span className="flex items-center gap-1">
                <GitCommit size={11} /> {pr.commitsCount} commits
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare size={11} /> {pr.commentCount} comments
              </span>
            </div>
          </div>
          <div className="text-xs text-right shrink-0 hidden sm:block">
            <div className="flex gap-1 justify-end mb-1">
              <span className="text-accent-green">+{pr.additions}</span>
              <span className="text-accent-red">-{pr.deletions}</span>
            </div>
            <span className="text-fg-subtle">{pr.changedFiles} files</span>
          </div>
        </div>

        {/* Branch info */}
        <div className="mt-2 flex items-center gap-1 text-xs font-mono text-fg-subtle">
          <span className="bg-canvas-inset border border-border px-1.5 py-0.5 rounded">{pr.branch}</span>
          <span>→</span>
          <span className="bg-canvas-inset border border-border px-1.5 py-0.5 rounded">{pr.baseBranch}</span>
        </div>
      </div>
    </Link>
  );
}
