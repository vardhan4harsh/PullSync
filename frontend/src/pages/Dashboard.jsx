// pages/Dashboard.jsx
import { useState, useMemo } from "react";
import { Plus, Search, SlidersHorizontal, GitPullRequest, CheckCircle, XCircle, Clock } from "lucide-react";
import PRCard from "../components/PRCard";
import { MOCK_PRS } from "../services/mockData";
import { useAppContext } from "../utils/context";

const FILTERS = ["All", "Open", "Approved", "Rejected"];
const SORT_OPTIONS = ["Newest", "Oldest", "Most Comments"];

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState("Newest");
  const [prs] = useState(MOCK_PRS);
  const { user } = useAppContext();

  const stats = useMemo(() => ({
    open: prs.filter((p) => p.status === "open").length,
    approved: prs.filter((p) => p.status === "approved").length,
    rejected: prs.filter((p) => p.status === "rejected").length,
  }), [prs]);

  const filtered = useMemo(() => {
    let result = [...prs];
    if (filter !== "All") result = result.filter((p) => p.status === filter.toLowerCase());
    if (search) result = result.filter((p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.author.toLowerCase().includes(search.toLowerCase()) ||
      `#${p.number}`.includes(search)
    );
    if (sort === "Newest") result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    if (sort === "Oldest") result.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
    if (sort === "Most Comments") result.sort((a, b) => b.commentCount - a.commentCount);
    return result;
  }, [prs, filter, search, sort]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-700 text-fg">Pull Requests</h1>
          <p className="text-fg-muted text-sm mt-0.5">Welcome back, {user?.name?.split(" ")[0]} 👋</p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus size={14} /> New Pull Request
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Open", value: stats.open, icon: GitPullRequest, color: "text-accent-green", bg: "bg-accent-green/10 border-accent-green/20" },
          { label: "Approved", value: stats.approved, icon: CheckCircle, color: "text-accent-blue", bg: "bg-accent-blue/10 border-accent-blue/20" },
          { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-accent-red", bg: "bg-accent-red/10 border-accent-red/20" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`card border ${bg} p-4 flex items-center gap-3`}>
            <div className={`${color}`}><Icon size={18} /></div>
            <div>
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-fg-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle" />
          <input
            className="input w-full pl-8"
            placeholder="Search by title, author, or #number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1 bg-canvas-subtle border border-border rounded-md p-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1 rounded transition-colors ${
                filter === f ? "bg-canvas-inset text-fg shadow-sm" : "text-fg-muted hover:text-fg"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={13} className="text-fg-muted" />
          <select
            className="input text-xs py-1.5"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      {/* PR List */}
      <div className="space-y-2">
        {filtered.length > 0 ? (
          filtered.map((pr) => <PRCard key={pr.id} pr={pr} />)
        ) : (
          <div className="card p-12 text-center">
            <Clock size={32} className="text-fg-subtle mx-auto mb-3" />
            <p className="text-fg-muted">No pull requests match your filters</p>
            <button onClick={() => { setSearch(""); setFilter("All"); }} className="btn-secondary mt-3">Clear filters</button>
          </div>
        )}
      </div>

      <p className="text-xs text-fg-subtle text-center mt-4">{filtered.length} pull request{filtered.length !== 1 ? "s" : ""}</p>
    </div>
  );
}
