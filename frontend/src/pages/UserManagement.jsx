// OWNER: Garima Yadav
// pages/UserManagement.jsx — Manage user roles (owner only)
import { useState, useEffect } from "react";
import { Users, ArrowLeft, Loader2, AlertTriangle, Shield, Eye, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { adminAPI, prAPI } from "../services/api";
import { useAppContext } from "../utils/context";

export default function UserManagement() {
  const { user } = useAppContext();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [success, setSuccess] = useState(null);

  // Redirect non-owners
  useEffect(() => {
    if (user && user.role !== "owner") {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  // Fetch report to get user list
  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError(null);
      try {
        const report = await adminAPI.getReport();
        // Extract all users from report — combine reviewers + other info
        const allUsers = report.reviewers || [];
        setUsers(allUsers);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "owner") {
      loadUsers();
    }
  }, [user]);

  const handleRoleChange = async (userId, newRole) => {
    setUpdating(userId);
    setSuccess(null);
    try {
      await adminAPI.updateUserRole(userId, newRole);
      
      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role: newRole } : u
        )
      );

      setSuccess(`Updated user role to ${newRole}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(null);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "owner":
        return <Shield size={14} className="text-accent-purple" />;
      case "reviewer":
        return <MessageSquare size={14} className="text-accent-blue" />;
      case "viewer":
        return <Eye size={14} className="text-accent-yellow" />;
      default:
        return null;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "owner":
        return "bg-accent-purple/10 border-accent-purple/30 text-accent-purple";
      case "reviewer":
        return "bg-accent-blue/10 border-accent-blue/30 text-accent-blue";
      case "viewer":
        return "bg-accent-yellow/10 border-accent-yellow/30 text-accent-yellow";
      default:
        return "";
    }
  };

  if (user?.role !== "owner") {
    return null;
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="text-accent-blue animate-spin" />
          <p className="text-fg-muted text-sm">Loading users…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg transition-colors mb-6">
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users size={24} className="text-accent-blue" />
          <h1 className="font-display text-2xl font-700 text-fg">Manage Team Members</h1>
        </div>
        <p className="text-fg-muted text-sm">Assign roles: Owner, Reviewer, or Viewer</p>
      </div>

      {error && (
        <div className="card p-4 mb-6 flex items-center gap-3 bg-accent-red/10 border-accent-red/20">
          <AlertTriangle size={16} className="text-accent-red shrink-0" />
          <p className="text-sm text-accent-red">{error}</p>
        </div>
      )}

      {success && (
        <div className="card p-4 mb-6 flex items-center gap-3 bg-accent-green/10 border-accent-green/20">
          <div className="w-4 h-4 rounded-full bg-accent-green" />
          <p className="text-sm text-accent-green">{success}</p>
        </div>
      )}

      {users.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-fg-muted">No users found</p>
        </div>
      ) : (
        <div className="card p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-fg-muted font-medium">Name</th>
                <th className="text-left py-3 px-4 text-fg-muted font-medium">Reviews</th>
                <th className="text-left py-3 px-4 text-fg-muted font-medium">Current Role</th>
                <th className="text-left py-3 px-4 text-fg-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-canvas-inset transition-colors">
                  <td className="py-3 px-4 text-fg font-medium">{u.name}</td>
                  <td className="py-3 px-4 text-fg-muted">{u.reviews || 0}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium ${getRoleColor(u.role)}`}>
                      {getRoleIcon(u.role)} {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      {["reviewer", "viewer"].map((role) => (
                        <button
                          key={role}
                          onClick={() => handleRoleChange(u.id, role)}
                          disabled={updating === u.id || u.role === role}
                          className={`px-3 py-1.5 rounded border text-xs font-medium transition-colors ${
                            u.role === role
                              ? "bg-canvas-inset border-border text-fg-muted cursor-not-allowed"
                              : "border-border text-fg-muted hover:text-accent-blue hover:border-accent-blue"
                          }`}
                        >
                          {updating === u.id ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            role === "reviewer" ? "Make Reviewer" : "Make Viewer"
                          )}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Role Legend */}
      <div className="card p-6 mt-8">
        <h3 className="text-sm font-medium text-fg mb-4">Role Permissions</h3>
        <div className="space-y-3 text-sm">
          <div className="flex gap-4">
            <div className="flex items-center gap-2 w-32">
              <Shield size={14} className="text-accent-purple" />
              <span className="font-medium text-fg">Owner</span>
            </div>
            <p className="text-fg-muted">Full control: create, review, manage users</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 w-32">
              <MessageSquare size={14} className="text-accent-blue" />
              <span className="font-medium text-fg">Reviewer</span>
            </div>
            <p className="text-fg-muted">Can view PRs, comment, approve/reject</p>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-2 w-32">
              <Eye size={14} className="text-accent-yellow" />
              <span className="font-medium text-fg">Viewer</span>
            </div>
            <p className="text-fg-muted">Read-only access to PRs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
