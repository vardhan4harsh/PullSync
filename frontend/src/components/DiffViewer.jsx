// components/DiffViewer.jsx
import { useState } from "react";
import { ChevronDown, ChevronUp, FileCode } from "lucide-react";
import { MOCK_DIFF } from "../services/mockData";

export default function DiffViewer({ filename = "src/collab/crdt.ts" }) {
  const [collapsed, setCollapsed] = useState(false);

  const additions = MOCK_DIFF.filter((l) => l.type === "add").length;
  const deletions = MOCK_DIFF.filter((l) => l.type === "remove").length;

  return (
    <div className="card overflow-hidden">
      {/* File Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 bg-canvas-inset border-b border-border cursor-pointer hover:bg-canvas-subtle/50 transition-colors"
        onClick={() => setCollapsed((c) => !c)}
      >
        <div className="flex items-center gap-2">
          <FileCode size={14} className="text-fg-muted" />
          <span className="text-sm font-mono text-fg">{filename}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono">
            <span className="text-accent-green">+{additions}</span>
            {" "}
            <span className="text-accent-red">-{deletions}</span>
          </span>
          {collapsed ? <ChevronDown size={14} className="text-fg-muted" /> : <ChevronUp size={14} className="text-fg-muted" />}
        </div>
      </div>

      {/* Diff Content */}
      {!collapsed && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono border-collapse">
            <tbody>
              {MOCK_DIFF.map((line, i) => (
                <tr
                  key={i}
                  className={`
                    ${line.type === "add" ? "diff-add" : ""}
                    ${line.type === "remove" ? "diff-remove" : ""}
                    ${line.type === "neutral" ? "diff-neutral" : ""}
                    hover:brightness-125 transition-all
                  `}
                >
                  <td className="select-none text-right pr-3 pl-3 py-0.5 text-fg-subtle w-10 border-r border-border/30">
                    {line.lineNo.old ?? ""}
                  </td>
                  <td className="select-none text-right pr-3 pl-2 py-0.5 text-fg-subtle w-10 border-r border-border/30">
                    {line.lineNo.new ?? ""}
                  </td>
                  <td className="pl-4 py-0.5 pr-4 whitespace-pre text-fg">
                    {line.content}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
