// pages/Analytics.jsx
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area,
} from "recharts";
import { Clock, CheckCircle, GitPullRequest, TrendingUp } from "lucide-react";
import { MOCK_ANALYTICS } from "../services/mockData";

const COLORS = { Approved: "#3fb950", Rejected: "#f85149", Pending: "#7d8590" };

function MetricCard({ label, value, icon: Icon, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-bold text-fg font-display">{value}</p>
        <p className="text-xs text-fg-muted">{label}</p>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card p-3 shadow-xl border-border text-xs">
      <p className="text-fg font-medium mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function Analytics() {
  const { weeklyActivity, reviewTime, approvalRate, topReviewers, metrics } = MOCK_ANALYTICS;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-700 text-fg">Analytics</h1>
        <p className="text-fg-muted text-sm mt-0.5">Code review performance insights</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Avg Review Time" value={metrics.avgReviewTime} icon={Clock} color="bg-accent-orange/10 text-accent-orange" />
        <MetricCard label="Approval Rate" value={metrics.approvalRate} icon={CheckCircle} color="bg-accent-green/10 text-accent-green" />
        <MetricCard label="Open PRs" value={metrics.openPRs} icon={GitPullRequest} color="bg-accent-blue/10 text-accent-blue" />
        <MetricCard label="Merged This Week" value={metrics.mergedThisWeek} icon={TrendingUp} color="bg-accent-purple/10 text-accent-purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Weekly Activity */}
        <div className="card p-5">
          <h3 className="text-sm font-medium text-fg mb-4">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyActivity} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
              <XAxis dataKey="day" tick={{ fill: "#7d8590", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#7d8590", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "11px", color: "#7d8590" }} />
              <Bar dataKey="opened" name="Opened" fill="#58a6ff" radius={[3, 3, 0, 0]} />
              <Bar dataKey="merged" name="Merged" fill="#3fb950" radius={[3, 3, 0, 0]} />
              <Bar dataKey="rejected" name="Rejected" fill="#f85149" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Approval Rate Pie */}
        <div className="card p-5">
          <h3 className="text-sm font-medium text-fg mb-4">Approval Rate Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={approvalRate} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                {approvalRate.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "11px", color: "#7d8590" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Review Time Distribution */}
        <div className="card p-5">
          <h3 className="text-sm font-medium text-fg mb-4">Review Time Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={reviewTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
              <XAxis dataKey="label" tick={{ fill: "#7d8590", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#7d8590", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="value" name="PRs" stroke="#bc8cff" fill="#bc8cff22" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Reviewers */}
        <div className="card p-5">
          <h3 className="text-sm font-medium text-fg mb-4">Top Reviewers</h3>
          <div className="space-y-3">
            {topReviewers.map((r, i) => {
              const pct = Math.round((r.reviews / topReviewers[0].reviews) * 100);
              return (
                <div key={r.name} className="flex items-center gap-3">
                  <span className="text-xs text-fg-subtle w-4">{i + 1}</span>
                  <div className="w-7 h-7 rounded-full bg-accent-purple/20 border border-accent-purple/30 flex items-center justify-center text-xs font-bold text-accent-purple shrink-0">
                    {r.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-fg">{r.name}</span>
                      <span className="text-xs text-fg-muted font-mono">{r.reviews}</span>
                    </div>
                    <div className="h-1.5 bg-canvas-inset rounded-full overflow-hidden">
                      <div className="h-full bg-accent-blue rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
