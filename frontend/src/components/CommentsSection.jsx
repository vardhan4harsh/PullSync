// OWNER: Harsh Vardhan
// components/CommentsSection.jsx — integrated with real API
import { useState, useEffect } from "react";
import { Send, MessageSquare, CornerDownRight, Loader2 } from "lucide-react";
import { timeAgo } from "../utils/format";
import { useAppContext } from "../utils/context";
import { commentAPI } from "../services/api";

function Avatar({ initials, size = "sm" }) {
  const sz = size === "sm" ? "w-7 h-7 text-xs" : "w-6 h-6 text-xs";
  return (
    <div className={`${sz} rounded-full bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center font-bold text-accent-purple shrink-0`}>
      {initials || "?"}
    </div>
  );
}

function normalizeComment(c) {
  // Handle both real API shape and mock shape
  const author = c.author || c.user?.name || "Unknown";
  // Generate initials from author name
  const avatar = c.avatar || c.user?.avatar || (author !== "Unknown" ? author.split(" ").map(n => n[0]).join("").toUpperCase() : "U");
  const timestamp = c.timestamp || c.createdAt || new Date().toISOString();
  return { ...c, author, avatar, timestamp };
}

function CommentBubble({ comment }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const { user } = useAppContext();
  const c = normalizeComment(comment);

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await commentAPI.add(c.prId, replyText.trim(), c.id);
    } catch {
      // Offline fallback — just clear the input
    } finally {
      setSending(false);
      setReplyText("");
      setReplyOpen(false);
    }
  };

  return (
    <div className="group">
      <div className="flex gap-3">
        <Avatar initials={c.avatar} />
        <div className="flex-1 min-w-0">
          <div className="card p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-medium text-fg">{c.author}</span>
              <span className="text-xs text-fg-muted">{timeAgo(c.timestamp)}</span>
              {c.file && (
                <span className="text-xs font-mono bg-canvas-inset border border-border px-1.5 py-0.5 rounded text-fg-muted hidden sm:inline">
                  {c.file}:{c.line}
                </span>
              )}
            </div>
            <p className="text-sm text-fg-muted leading-relaxed">{c.content}</p>
          </div>
          <button
            onClick={() => setReplyOpen((o) => !o)}
            className="flex items-center gap-1 mt-1 ml-1 text-xs text-fg-subtle hover:text-accent-blue transition-colors"
          >
            <CornerDownRight size={11} /> Reply
          </button>

          {/* Replies */}
          {c.replies?.length > 0 && (
            <div className="ml-4 mt-2 space-y-2 border-l-2 border-border pl-4">
              {c.replies.map((r) => {
                const rn = normalizeComment(r);
                return (
                  <div key={r.id} className="flex gap-2">
                    <Avatar initials={rn.avatar} size="xs" />
                    <div className="flex-1 card p-2.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-fg">{rn.author}</span>
                        <span className="text-xs text-fg-subtle">{timeAgo(rn.timestamp)}</span>
                      </div>
                      <p className="text-xs text-fg-muted">{rn.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Reply Input */}
          {replyOpen && (
            <div className="mt-2 ml-4 flex gap-2 animate-slide-down">
              <Avatar initials={user?.avatar} size="xs" />
              <div className="flex-1 flex gap-2">
                <input
                  className="input flex-1 text-xs"
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleReply()}
                  autoFocus
                />
                <button onClick={handleReply} disabled={sending} className="btn-primary px-3 py-1.5">
                  {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentsSection({ prId, comments = [], onCommentAdded }) {
  const [newComment, setNewComment] = useState("");
  const [localComments, setLocalComments] = useState(comments);
  const [sending, setSending] = useState(false);
  const { user } = useAppContext();

  // Sync when parent updates comments (e.g. from real API)
  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;
    setSending(true);
    const optimistic = {
      id: `c${Date.now()}`,
      prId,
      userId: user?.id,
      author: user?.name || "You",
      avatar: user?.avatar || user?.name?.[0] || "?",
      content: newComment.trim(),
      timestamp: new Date().toISOString(),
      replies: [],
    };

    // Optimistic update
    setLocalComments((prev) => [...prev, optimistic]);
    setNewComment("");

    try {
      const saved = await commentAPI.add(prId, newComment.trim());
      // Replace optimistic with real (if backend returned something)
      if (saved) {
        setLocalComments((prev) =>
          prev.map((c) => (c.id === optimistic.id ? { ...saved, author: user?.name, avatar: user?.avatar } : c))
        );
        onCommentAdded?.(saved);
      } else {
        onCommentAdded?.(optimistic);
      }
    } catch {
      // Offline — keep optimistic comment
      onCommentAdded?.(optimistic);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-medium text-fg mb-4">
        <MessageSquare size={15} className="text-fg-muted" />
        Comments <span className="text-fg-subtle">({localComments.length})</span>
      </h3>

      <div className="space-y-4">
        {localComments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare size={24} className="text-fg-subtle mx-auto mb-2" />
            <p className="text-sm text-fg-muted">No comments yet. Start the conversation!</p>
          </div>
        ) : (
          localComments.map((c) => <CommentBubble key={c.id} comment={c} />)
        )}
      </div>

      {/* New Comment */}
      <div className="mt-6 flex gap-3">
        <Avatar initials={user?.avatar || user?.name?.[0]} />
        <div className="flex-1">
          <textarea
            className="input w-full resize-none"
            rows={3}
            placeholder="Leave a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
            }}
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-fg-subtle">Ctrl+Enter to submit</span>
            <button onClick={handleSubmit} disabled={sending || !newComment.trim()} className="btn-primary flex items-center gap-2">
              {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
