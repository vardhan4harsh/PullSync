// OWNER: Harsh Vardhan
// pages/PRDetail.jsx — v2 with real diff support
import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, GitCommit, FileCode, Plus, Minus,
  CheckCircle, XCircle, MessageSquare, GitMerge, User,
  Loader2, AlertTriangle, ExternalLink, Hash
} from "lucide-react";
import DiffViewer from "../components/DiffViewer";
import CommentsSection from "../components/CommentsSection";
import { prAPI, reviewAPI, diffAPI, commentAPI } from "../services/api";
import { MOCK_PRS, MOCK_COMMENTS, MOCK_USERS } from "../services/mockData";
import { timeAgo, labelColor } from "../utils/format";
import { useAppContext } from "../utils/context";
import { useSocket } from "../hooks/useSocket";

const statusBadge = {
  open: <span className="badge-open">● Open</span>,
  approved: <span className="badge-approved">✓ Approved</span>,
  rejected: <span className="badge-rejected">✕ Rejected</span>,
};

export default function PRDetail() {
  const { id } = useParams();
  const { user, addNotification } = useAppContext();

  const [pr, setPR] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Diff state
  const [fileDiffs, setFileDiffs] = useState(null);
  const [commits, setCommits] = useState([]);
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffError, setDiffError] = useState(null);
  const [diffStatus, setDiffStatus] = useState("none");

  const [reviewStatus, setReviewStatus] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [tab, setTab] = useState("diff");

  // Inline comment state
  const [inlineComment, setInlineComment] = useState(null);
  const [inlineCommentText, setInlineCommentText] = useState("");
  const [inlineCommentLoading, setInlineCommentLoading] = useState(false);

  // Fetch PR metadata
  const loadPR = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await prAPI.get(id);
      setPR(data);
      setComments(data.comments || []);
      setDiffStatus(data.diffStatus || "none");

      // If diff already stored on PR object (from backend), use it directly
      if (data.diff && data.diffStatus === "ready") {
        setFileDiffs(data.diff);
        setCommits(data.commits || []);
      }

      const myReview = data.reviews?.find(
        (r) => r.reviewerId === user?.id || r.reviewer?.id === user?.id
      );
      if (myReview) setReviewStatus(myReview.decision === "approve" ? "approve" : "reject");
    } catch {
      const mockPR = MOCK_PRS.find((p) => p.id === id) || MOCK_PRS[0];
      setPR(mockPR);
      setComments(MOCK_COMMENTS?.[mockPR?.id] || []);
      setDiffStatus("none");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPR();
  }, [id, user?.id]);

  // Memoized socket handlers
  const handleNewComment = useCallback((data) => {
    if (data.prId === id) {
      loadPR();
    }
  }, [id]);

  const handleReviewUpdate = useCallback((data) => {
    if (data.prId === id) {
      loadPR();
    }
  }, [id]);

  // Real-time updates: when reviews come in or PR is updated
  useSocket({
    user,
    onNewComment: handleNewComment,
    onReviewUpdate: handleReviewUpdate,
  });

  // Fetch real diff when user clicks Files Changed tab
  useEffect(() => {
    if (tab !== "diff" || fileDiffs || diffStatus === "none") return;
    let cancelled = false;

    async function loadDiff() {
      setDiffLoading(true);
      setDiffError(null);
      try {
        const result = await diffAPI.get(id);
        if (!cancelled) {
          setFileDiffs(result.data || []);
          setCommits(result.commits || []);
          setDiffStatus(result.status || "ready");
        }
      } catch (err) {
        if (!cancelled) setDiffError(err.message);
      } finally {
        if (!cancelled) setDiffLoading(false);
      }
    }
    loadDiff();
    return () => { cancelled = true; };
  }, [tab, id, fileDiffs, diffStatus]);

  const handleAction = async (action) => {
    setReviewLoading(true);
    try {
      await reviewAPI.submit(id, action === "approve" ? "approve" : "reject", "");
    } catch { /* backend offline — still update UI */ } finally {
      setReviewLoading(false);
    }
    setReviewStatus(action);
    addNotification({
      type: "review",
      message: `You ${action === "approve" ? "approved" : "requested changes on"} PR #${pr?.number}`,
      time: "just now",
      prId: id,
    });
  };

  const handleCommentAdded = (comment) => {
    setComments((prev) => [...prev, comment]);
  };

  const handleInlineCommentClick = (data) => {
    setInlineComment(data);
    setInlineCommentText("");
  };

  const submitInlineComment = async () => {
    if (!inlineCommentText.trim()) return;
    
    setInlineCommentLoading(true);
    try {
      // Get the latest commit SHA from the PR
      const commitSha = commits?.[0]?.sha || pr?.commits?.[0]?.sha;
      
      await commentAPI.add(id, inlineCommentText, {
        file: inlineComment.file,
        line: inlineComment.lineNum,
        commitSha,
      });
      addNotification({
        type: "comment",
        message: "Comment added and synced to GitHub",
        time: "just now",
        prId: id,
      });
      setInlineComment(null);
      setInlineCommentText("");
      loadPR(); // Refresh comments
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setInlineCommentLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="text-accent-blue animate-spin" />
          <p className="text-fg-muted text-sm">Loading pull request…</p>
        </div>
      </div>
    );
  }

  if (!pr) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center">
        <AlertTriangle size={32} className="text-accent-red mx-auto mb-3" />
        <p className="text-fg-muted">Pull request not found</p>
        <Link to="/dashboard" className="btn-secondary mt-4 inline-flex items-center gap-1.5">
          <ArrowLeft size={13} /> Back
        </Link>
      </div>
    );
  }

  const normalizeReviewer = (r) => {
    if (typeof r === "object" && r.name) return { name: r.name, avatar: r.initials || r.avatar || r.name[0] };
    const user = MOCK_USERS.find((u) => u.id === r);
    return user ? { name: user.name, avatar: user.avatar } : null;
  };

  const realDiffFiles = fileDiffs?.length > 0 ? fileDiffs : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg transition-colors mb-6">
        <ArrowLeft size={14} /> All Pull Requests
      </Link>

      {/* PR Header */}
      <div className="mb-6">
        <div className="flex items-start gap-3 flex-wrap mb-2">
          {statusBadge[pr.status] || <span className="badge-open">● Open</span>}
          <span className="text-fg-subtle text-sm font-mono">#{pr.number}</span>
          {pr.githubNumber && (
            <a
              href={pr.githubUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-xs text-fg-muted hover:text-accent-blue transition-colors border border-border rounded px-1.5 py-0.5"
            >
              <Hash size={10} /> {pr.githubNumber} on GitHub <ExternalLink size={10} />
            </a>
          )}
          {pr.labels?.map((l) => (
            <span key={l} className={`text-xs px-2 py-0.5 rounded border ${labelColor(l)}`}>{l}</span>
          ))}
        </div>
        <h1 className="font-display text-xl font-700 text-fg mb-3">{pr.title}</h1>
        <div className="flex items-center gap-4 text-sm text-fg-muted flex-wrap">
          <span className="flex items-center gap-1.5">
            <User size={13} /> {pr.author?.name || pr.author || "Unknown"}
          </span>
          <span>opened {timeAgo(pr.createdAt)}</span>
          <span>·</span>
          <span className="flex items-center gap-1 font-mono">
            <span className="bg-canvas-inset border border-border px-1.5 py-0.5 rounded text-xs">{pr.branch}</span>
            <span>→</span>
            <span className="bg-canvas-inset border border-border px-1.5 py-0.5 rounded text-xs">{pr.baseBranch}</span>
          </span>
          {pr.repoFullName && (
            <span className="text-xs font-mono text-fg-subtle">{pr.repoFullName}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-5">
            <h3 className="text-sm font-medium text-fg mb-3">Description</h3>
            <div className="text-sm text-fg-muted leading-relaxed whitespace-pre-line">
              {pr.description || <span className="italic opacity-50">No description provided.</span>}
            </div>
          </div>

          {/* Tabs */}
          <div>
            <div className="flex border-b border-border mb-4">
              {[
                { id: "diff", label: `Files Changed${realDiffFiles ? ` (${realDiffFiles.length})` : ""}`, icon: FileCode },
                { id: "commits", label: `Commits (${commits.length || pr.commitsCount || 0})`, icon: GitCommit },
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
              <DiffViewer
                fileDiffs={realDiffFiles}
                loading={diffLoading}
                error={diffError}
                diffStatus={diffStatus}
                filename={pr.branch}
                onCommentClick={handleInlineCommentClick}
              />
            )}

            {tab === "commits" && (
              <div className="space-y-2">
                {commits.length > 0 ? commits.map((c) => (
                  <div key={c.sha} className="card p-3 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center shrink-0 mt-0.5">
                      <GitCommit size={11} className="text-accent-purple" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-fg">{c.message}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-fg-muted">
                        <span className="font-mono">{c.shortSha}</span>
                        <span>·</span>
                        <span>{c.author}</span>
                        <span>·</span>
                        <span>{timeAgo(c.date)}</span>
                      </div>
                    </div>
                    {c.url && (
                      <a href={c.url} target="_blank" rel="noreferrer" className="text-fg-subtle hover:text-accent-blue">
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                )) : (
                  <div className="card p-8 text-center text-fg-muted text-sm">
                    {pr.commitsCount > 0
                      ? `${pr.commitsCount} commits — connect GitHub to see details`
                      : "No commits yet"}
                  </div>
                )}
              </div>
            )}

            {tab === "comments" && (
              <CommentsSection
                prId={pr.id}
                comments={comments}
                onCommentAdded={handleCommentAdded}
              />
            )}
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
                <button onClick={() => handleAction("approve")} disabled={reviewLoading}
                  className="btn-success w-full flex items-center justify-center gap-2">
                  {reviewLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={14} />}
                  Approve
                </button>
                <button onClick={() => handleAction("reject")} disabled={reviewLoading}
                  className="btn-danger w-full flex items-center justify-center gap-2">
                  {reviewLoading ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={14} />}
                  Request Changes
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="card p-4">
            <h4 className="text-xs font-medium text-fg-muted uppercase tracking-wide mb-3">Changes</h4>
            <div className="space-y-2 text-sm">
              {[
                { label: "Commits", icon: GitCommit, value: pr.commitsCount },
                { label: "Files changed", icon: FileCode, value: pr.changedFiles },
                { label: "Additions", icon: Plus, value: `+${pr.additions}`, color: "text-accent-green" },
                { label: "Deletions", icon: Minus, value: `-${pr.deletions}`, color: "text-accent-red" },
              ].map(({ label, icon: Icon, value, color }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-fg-muted flex items-center gap-1.5"><Icon size={13} /> {label}</span>
                  <span className={`font-mono ${color || "text-fg"}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviewers */}
          <div className="card p-4">
            <h4 className="text-xs font-medium text-fg-muted uppercase tracking-wide mb-3">Reviewers</h4>
            <div className="space-y-2">
              {(pr.reviewers || []).map((r, i) => {
                const info = normalizeReviewer(r);
                return info ? (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center text-xs font-bold text-accent-purple">
                      {info.avatar}
                    </div>
                    <span className="text-sm text-fg-muted">{info.name}</span>
                  </div>
                ) : null;
              })}
              {(!pr.reviewers || pr.reviewers.length === 0) && (
                <p className="text-xs text-fg-subtle italic">No reviewers assigned</p>
              )}
            </div>
          </div>

          {pr.status === "approved" && (
            <button className="btn-success w-full flex items-center justify-center gap-2">
              <GitMerge size={14} /> Merge Pull Request
            </button>
          )}
        </div>
      </div>

      {/* Inline Comment Modal */}
      {inlineComment && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="card p-6 max-w-lg w-full">
            <h3 className="font-medium text-fg mb-2">Comment on {inlineComment.file}</h3>
            <p className="text-xs text-fg-muted mb-4">Line {inlineComment.lineNum}</p>
            <textarea
              autoFocus
              value={inlineCommentText}
              onChange={(e) => setInlineCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="w-full px-3 py-2 rounded border border-border bg-canvas text-fg text-sm placeholder-fg-muted focus:border-accent-blue focus:outline-none mb-4 min-h-24"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setInlineComment(null)}
                disabled={inlineCommentLoading}
                className="px-4 py-2 text-sm text-fg-muted hover:text-fg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitInlineComment}
                disabled={inlineCommentLoading || !inlineCommentText.trim()}
                className="btn-primary flex items-center gap-2"
              >
                {inlineCommentLoading ? <Loader2 size={13} className="animate-spin" /> : null}
                Post Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
