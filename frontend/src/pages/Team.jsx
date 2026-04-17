// OWNER: Garima Yadav
// pages/Team.jsx — Team members and approval rules management
import { useState, useEffect } from "react";
import { Users, Github, Shield, Edit2, Check, X, Loader2 } from "lucide-react";
import { useAppContext } from "../utils/context";
import { teamAPI } from "../services/api";

export default function Team() {
  const { user } = useAppContext();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingRole, setEditingRole] = useState("");
  const [savingRole, setSavingRole] = useState(false);

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await teamAPI.getTeam();
      setTeam(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      setSavingRole(true);
      setError("");
      const updatedUser = await teamAPI.updateRole(userId, newRole);
      
      setTeam((prev) =>
        prev.map((u) => (u._id === userId ? updatedUser : u))
      );
      setEditingUserId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingRole(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "owner":
        return "bg-accent-blue/10 text-accent-blue border-accent-blue/20";
      case "reviewer":
        return "bg-accent-green/10 text-accent-green border-accent-green/20";
      case "viewer":
        return "bg-accent-orange/10 text-accent-orange border-accent-orange/20";
      default:
        return "bg-fg-subtle/10 text-fg-muted border-border";
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl font-700 text-fg">Team Members</h1>
        <p className="text-fg-muted text-sm mt-0.5">
          Manage approvers, reviewers, and viewers for PR approvals
        </p>
      </div>

      {error && (
        <div className="bg-accent-red/10 border border-accent-red/20 rounded-lg px-4 py-3 mb-6 text-accent-red text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Role legend */}
          <div className="bg-canvas-inset border-b border-border px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-fg-muted mb-1">Owner</p>
                <p className="text-xs text-fg-subtle">
                  Full access, can manage team and update roles
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-fg-muted mb-1">Reviewer</p>
                <p className="text-xs text-fg-subtle">
                  Can approve/reject PRs and comment on GitHub
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-fg-muted mb-1">Viewer</p>
                <p className="text-xs text-fg-subtle">
                  Can view PRs but cannot approve
                </p>
              </div>
            </div>
          </div>

          {/* Team members table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-canvas-inset/50">
                  <th className="text-left px-6 py-3 text-xs font-medium text-fg-muted">
                    Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-fg-muted">
                    Email
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-fg-muted">
                    GitHub
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-fg-muted">
                    Role
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-fg-muted">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {team.map((member) => (
                  <tr key={member._id} className="border-b border-border/50 hover:bg-canvas-inset/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-blue/20 flex items-center justify-center text-xs font-bold text-accent-blue">
                          {member.avatar || member.initials || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-fg">{member.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-fg-muted">{member.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {member.githubUsername ? (
                          <>
                            <Github size={14} className="text-accent-blue" />
                            <p className="text-sm text-fg">{member.githubUsername}</p>
                          </>
                        ) : (
                          <span className="text-xs text-fg-subtle">Not linked</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingUserId === member._id ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={editingRole}
                            onChange={(e) => setEditingRole(e.target.value)}
                            className="input text-sm py-1"
                          >
                            <option value="owner">Owner</option>
                            <option value="reviewer">Reviewer</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          {user?.role === "owner" && (
                            <button
                              onClick={() => handleUpdateRole(member._id, editingRole)}
                              disabled={savingRole}
                              className="p-1.5 rounded text-accent-green hover:bg-accent-green/10 disabled:opacity-50"
                            >
                              {savingRole ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Check size={14} />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => setEditingUserId(null)}
                            className="p-1.5 rounded text-accent-red hover:bg-accent-red/10"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleColor(
                              member.role
                            )}`}
                          >
                            {member.role}
                          </span>
                          {user?.role === "owner" && user._id !== member._id && (
                            <button
                              onClick={() => {
                                setEditingUserId(member._id);
                                setEditingRole(member.role);
                              }}
                              className="p-1.5 rounded text-fg-muted hover:text-fg hover:bg-canvas-inset transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            member.isActive ? "bg-accent-green" : "bg-fg-subtle"
                          }`}
                        />
                        <span className="text-xs text-fg-muted">
                          {member.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {team.length === 0 && (
            <div className="text-center py-12">
              <Users size={32} className="mx-auto text-fg-subtle/30 mb-3" />
              <p className="text-fg-muted text-sm">No team members yet</p>
            </div>
          )}
        </div>
      )}

      {/* Info box */}
      <div className="mt-6 bg-accent-blue/5 border border-accent-blue/20 rounded-lg px-4 py-3">
        <p className="text-xs text-fg-muted">
          <Shield size={12} className="inline mr-1" />
          GitHub users are automatically synced when they interact with your repositories. You can map them to local accounts and assign roles here.
        </p>
      </div>
    </div>
  );
}
