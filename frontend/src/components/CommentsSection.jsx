// components/CommentsSection.jsx
import { useState } from "react";
import { Send, MessageSquare, CornerDownRight } from "lucide-react";
import { timeAgo } from "../utils/format";
import { useAppContext } from "../utils/context";

function Avatar({ initials, size = "sm" }) {
  const sz = size === "sm" ? "w-7 h-7 text-xs" : "w-8 h-8 text-sm";
  return (
    <div className={`${sz} rounded-full bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center font-bold text-accent-purple shrink-0`}>
      {initials}
    </div>
  );
}

function CommentBubble({ comment, onReply }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const { user } = useAppContext();

  const handleReply = () => {
    if (!replyText.trim()) return;
    setReplyText("");
    setReplyOpen(false);
  };

  return (
    <div className="group">
      <div className="flex gap-3">
        <Avatar initials={comment.avatar} />
        <div className="flex-1 min-w-0">
          <div className="card p-3">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm font-medium text-fg">{comment.author}</span>
              <span className="text-xs text-fg-muted">{timeAgo(comment.timestamp)}</span>
              {comment.file && (
                <span className="text-xs font-mono bg-canvas-inset border border-border px-1.5 py-0.5 rounded text-fg-muted hidden sm:inline">
                  {comment.file}:{comment.line}
                </span>
              )}
            </div>
            <p className="text-sm text-fg-muted leading-relaxed">{comment.content}</p>
          </div>
          <button
            onClick={() => setReplyOpen((o) => !o)}
            className="flex items-center gap-1 mt-1 ml-1 text-xs text-fg-subtle hover:text-accent-blue transition-colors"
          >
            <CornerDownRight size={11} /> Reply
          </button>

          {/* Replies */}
          {comment.replies?.length > 0 && (
            <div className="ml-4 mt-2 space-y-2 border-l-2 border-border pl-4">
              {comment.replies.map((r) => (
                <div key={r.id} className="flex gap-2">
                  <Avatar initials={r.avatar} size="xs" />
                  <div className="flex-1 card p-2.5">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-fg">{r.author}</span>
                      <span className="text-xs text-fg-subtle">{timeAgo(r.timestamp)}</span>
                    </div>
                    <p className="text-xs text-fg-muted">{r.content}</p>
                  </div>
                </div>
              ))}
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
                  onKeyDown={(e) => e.key === "Enter" && handleReply()}
                  autoFocus
                />
                <button onClick={handleReply} className="btn-primary px-3 py-1.5">
                  <Send size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentsSection({ prId, comments = [] }) {
  const [newComment, setNewComment] = useState("");
  const [localComments, setLocalComments] = useState(comments);
  const { user } = useAppContext();

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    const c = {
      id: `c${Date.now()}`,
      userId: user.id,
      author: user.name,
      avatar: user.avatar,
      content: newComment,
      timestamp: new Date().toISOString(),
      replies: [],
    };
    setLocalComments((prev) => [...prev, c]);
    setNewComment("");
  };

  return (
    <div>
      <h3 className="flex items-center gap-2 text-sm font-medium text-fg mb-4">
        <MessageSquare size={15} className="text-fg-muted" />
        Comments <span className="text-fg-subtle">({localComments.length})</span>
      </h3>

      <div className="space-y-4">
        {localComments.map((c) => (
          <CommentBubble key={c.id} comment={c} />
        ))}
      </div>

      {/* New Comment */}
      <div className="mt-6 flex gap-3">
        <Avatar initials={user?.avatar} />
        <div className="flex-1">
          <textarea
            className="input w-full resize-none"
            rows={3}
            placeholder="Leave a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <button onClick={handleSubmit} className="btn-primary flex items-center gap-2">
              <Send size={13} /> Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
