// utils/format.js
export function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

export function statusLabel(status) {
  const map = { open: "Open", approved: "Approved", rejected: "Rejected", draft: "Draft" };
  return map[status] || status;
}

export function labelColor(label) {
  const map = {
    feature: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    "breaking-change": "bg-red-500/10 text-red-400 border-red-500/20",
    bug: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    critical: "bg-red-500/10 text-red-400 border-red-500/20",
    security: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    refactor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    documentation: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    performance: "bg-green-500/10 text-green-400 border-green-500/20",
  };
  return map[label] || "bg-gray-500/10 text-gray-400 border-gray-500/20";
}
