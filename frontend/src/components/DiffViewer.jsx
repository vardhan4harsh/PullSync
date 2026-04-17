// OWNER: Harsh Vardhan
// components/DiffViewer.jsx — Real diff renderer (v2)
// Renders parsed unified diff chunks from the backend.
// Falls back to a placeholder when no real diff is available.

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Minus, FileCode, Loader2, AlertCircle, MessageCircle } from "lucide-react";

// ── Line renderer ──────────────────────────────────────────────
function DiffLine({ change, file, lineNum, onCommentClick }) {
  const { type, content } = change;
  const [hover, setHover] = useState(false);
  
  const bg =
    type === "add" ? "bg-accent-green/10 border-l-2 border-accent-green/60"
    : type === "del" ? "bg-accent-red/10 border-l-2 border-accent-red/60"
    : "";
  const prefix =
    type === "add" ? <span className="text-accent-green select-none">+</span>
    : type === "del" ? <span className="text-accent-red select-none">-</span>
    : <span className="text-fg-subtle select-none"> </span>;

  return (
    <div 
      className={`flex font-mono text-xs leading-5 px-3 py-0 group ${bg}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span className="w-4 shrink-0">{prefix}</span>
      <span className={`flex-1 whitespace-pre-wrap break-all ${
        type === "add" ? "text-accent-green"
        : type === "del" ? "text-accent-red"
        : "text-fg-muted"
      }`}>
        {content?.replace(/^[+\- ]/, "") || ""}
      </span>
      {hover && onCommentClick && (
        <button
          onClick={() => onCommentClick({ file, lineNum, type })}
          className="ml-2 px-1.5 py-0 flex items-center gap-1 text-accent-blue hover:text-accent-blue/80 transition-colors"
          title="Add comment"
        >
          <MessageCircle size={12} />
        </button>
      )}
    </div>
  );
}

// ── Chunk (hunk) renderer ──────────────────────────────────────
function DiffChunk({ chunk, file, onCommentClick }) {
  let lineNum = 0;
  
  return (
    <div>
      <div className="px-3 py-0.5 text-xs font-mono text-fg-subtle bg-accent-blue/5 border-y border-accent-blue/10">
        {chunk.header}
      </div>
      {chunk.changes.map((change, i) => {
        lineNum++;
        return (
          <DiffLine 
            key={i} 
            change={change}
            file={file.filename}
            lineNum={lineNum}
            onCommentClick={onCommentClick}
          />
        );
      })}
    </div>
  );
}

// ── Single file diff ───────────────────────────────────────────
function FileDiff({ file, onCommentClick }) {
  const [open, setOpen] = useState(true);

  const statusColor =
    file.status === "added" ? "text-accent-green"
    : file.status === "deleted" ? "text-accent-red"
    : "text-fg-muted";

  const statusLabel =
    file.status === "added" ? "added"
    : file.status === "deleted" ? "deleted"
    : "modified";

  return (
    <div className="card overflow-hidden">
      {/* File header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-canvas-subtle/50 transition-colors text-left"
      >
        {open ? <ChevronDown size={13} className="text-fg-subtle shrink-0" /> : <ChevronRight size={13} className="text-fg-subtle shrink-0" />}
        <FileCode size={13} className="text-fg-subtle shrink-0" />
        <span className="flex-1 text-sm font-mono text-fg truncate">{file.filename}</span>
        <span className={`text-xs ${statusColor} shrink-0`}>{statusLabel}</span>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {file.additions > 0 && <span className="text-xs text-accent-green font-mono">+{file.additions}</span>}
          {file.deletions > 0 && <span className="text-xs text-accent-red font-mono">-{file.deletions}</span>}
        </div>
      </button>

      {/* Diff chunks */}
      {open && (
        <div className="border-t border-border">
          {file.chunks?.length > 0 ? (
            file.chunks.map((chunk, i) => <DiffChunk key={i} chunk={chunk} file={file} onCommentClick={onCommentClick} />)
          ) : (
            <div className="px-4 py-3 text-xs text-fg-subtle font-mono italic">
              Binary file or no changes shown
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Placeholder when no real diff ─────────────────────────────
function FakeDiffPlaceholder({ filename }) {
  return (
    <div className="card overflow-hidden opacity-60">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border">
        <FileCode size={13} className="text-fg-subtle" />
        <span className="text-sm font-mono text-fg">{filename}</span>
        <span className="text-xs text-fg-subtle ml-auto">preview only</span>
      </div>
      <div className="font-mono text-xs">
        {[
          { type: "del", content: "- const oldImplementation = () => { ... }" },
          { type: "add", content: "+ const newImplementation = () => {" },
          { type: "add", content: "+   // Real diff will appear once GitHub is connected" },
          { type: "add", content: "+ }" },
          { type: "normal", content: "  export default newImplementation;" },
        ].map((line, i) => <DiffLine key={i} change={line} />)}
      </div>
    </div>
  );
}

// ── Main DiffViewer component ─────────────────────────────────
// Props:
//   fileDiffs   - array from API (real diffs) OR null/undefined
//   filename    - fallback for placeholder mode
//   loading     - show spinner
//   error       - show error state
//   diffStatus  - "pending" | "ready" | "none" | "error"
//   onCommentClick - callback when user clicks comment icon
export default function DiffViewer({ fileDiffs, filename, loading, error, diffStatus, onCommentClick }) {

  if (loading) {
    return (
      <div className="card p-8 flex items-center justify-center gap-3">
        <Loader2 size={18} className="text-accent-blue animate-spin" />
        <span className="text-sm text-fg-muted">Fetching diff from GitHub…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6 flex items-center gap-3 border-accent-red/20">
        <AlertCircle size={18} className="text-accent-red shrink-0" />
        <div>
          <p className="text-sm text-fg">Could not load diff</p>
          <p className="text-xs text-fg-muted mt-0.5">{error}</p>
        </div>
      </div>
    );
  }

  // Real diffs from GitHub
  if (fileDiffs && fileDiffs.length > 0) {
    return (
      <div className="space-y-2">
        {fileDiffs.map((file, i) => <FileDiff key={i} file={file} onCommentClick={onCommentClick} />)}
      </div>
    );
  }

  // No GitHub connection — show placeholder
  if (diffStatus === "none" || !fileDiffs) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-3 rounded-lg border border-amber-500/20 bg-amber-500/5 text-xs text-amber-400 mb-3">
          <AlertCircle size={13} className="shrink-0" />
          Connect a GitHub repository to see real diffs. See README for setup instructions.
        </div>
        <FakeDiffPlaceholder filename={filename || "src/example.ts"} />
      </div>
    );
  }

  // Status is "pending" — diff is being fetched
  if (diffStatus === "pending") {
    return (
      <div className="card p-8 flex items-center justify-center gap-3">
        <Loader2 size={18} className="text-accent-blue animate-spin" />
        <span className="text-sm text-fg-muted">Diff is being fetched from GitHub…</span>
      </div>
    );
  }

  return <FakeDiffPlaceholder filename={filename || "src/example.ts"} />;
}
