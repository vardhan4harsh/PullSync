// OWNER: Harsh Vardhan
// services/api.js — Centralized API client for Pull-Sync backend

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

// ── Helpers ────────────────────────────────────────────────────

function getToken() {
  const raw = localStorage.getItem("pull_sync_session");
  if (!raw) return null;
  try {
    return JSON.parse(raw).token;
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const data = await res.json();

  if (!res.ok) {
    const msg = data?.error || `Request failed with status ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

// ── Auth ───────────────────────────────────────────────────────

export const authAPI = {
  /** Login with email + password — returns session user object */
  async login(email, password) {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return data.data; // { id, name, email, role, token }
  },

  /** Sign up — returns session user object */
  async signup(name, email, password) {
    const data = await request("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    return data.data;
  },
};

// ── Pull Requests ──────────────────────────────────────────────

export const prAPI = {
  /** List PRs with optional filters: { status, author } */
  async list(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== "all") params.set("status", filters.status);
    if (filters.author) params.set("author", filters.author);
    const qs = params.toString();
    const data = await request(`/prs${qs ? `?${qs}` : ""}`);
    
    // Transform response: _id → id, author object → string
    return {
      ...data,
      data: data.data.map(pr => ({
        ...pr,
        id: pr._id || pr.id, // Use _id from MongoDB or fallback to id
        author: typeof pr.author === 'object' ? pr.author.name : pr.author, // Extract name from author object
      }))
    };
  },

  /** Get a single PR with full detail (comments, reviews) */
  async get(id) {
    const data = await request(`/prs/${id}`);
    const pr = data.data;
    
    // Transform: _id → id, author object → keep as object for details
    return {
      ...pr,
      id: pr._id || pr.id,
      author: typeof pr.author === 'object' ? pr.author : { name: pr.author },
      comments: (pr.comments || []).map(c => ({
        ...c,
        user: typeof c.user === 'object' ? c.user : { name: c.user },
      })),
      reviews: (pr.reviews || []).map(r => ({
        ...r,
        reviewer: typeof r.reviewer === 'object' ? r.reviewer : { name: r.reviewer },
      })),
    };
  },

  /** Create a new PR */
  async create({ title, description, branch, baseBranch = "main", reviewers = [] }) {
    const data = await request("/prs", {
      method: "POST",
      body: JSON.stringify({ title, description, branch, baseBranch, reviewers }),
    });
    return data.data;
  },
};

// ── Comments ───────────────────────────────────────────────────

export const commentAPI = {
  /** Post a comment on a PR (supports inline comments with file/line/commitSha) */
  async add(prId, content, options = {}) {
    const body = {
      prId,
      content,
      ...options, // { file, line, commitSha, parentId }
    };
    const data = await request("/comments", {
      method: "POST",
      body: JSON.stringify(body),
    });
    return data.data;
  },
};

// ── Reviews ────────────────────────────────────────────────────

export const reviewAPI = {
  /** Submit a review decision: "approve" | "reject" */
  async submit(prId, decision, comment = "") {
    const data = await request("/reviews", {
      method: "POST",
      body: JSON.stringify({ prId, decision, comment }),
    });
    return data.data;
  },
};

// ── Admin ──────────────────────────────────────────────────────

export const adminAPI = {
  async getReport() {
    const data = await request("/admin/report");
    return data.data;
  },

  /** Promote/demote a user: role can be "owner", "reviewer", or "viewer" */
  async updateUserRole(userId, role) {
    const data = await request("/admin/bulk-update-permissions", {
      method: "POST",
      body: JSON.stringify({ userId, role }),
    });
    return data.data;
  },
};

// ── Diffs ──────────────────────────────────────────────────────

export const diffAPI = {
  /** Get the real parsed diff for a PR (requires GitHub token on backend) */
  async get(prId) {
    const data = await request(`/prs/${prId}/diff`);
    return data; // { data: FileDiff[], commits: Commit[], status: string }
  },
};

// ── Team ──────────────────────────────────────────────────────

export const teamAPI = {
  /** Get all team members */
  async getTeam() {
    const data = await request("/approvals/team");
    return data.data; // Array of users
  },

  /** Update a user's role */
  async updateRole(userId, role) {
    const data = await request(`/approvals/team/${userId}/role`, {
      method: "POST",
      body: JSON.stringify({ role }),
    });
    return data.data;
  },
};
