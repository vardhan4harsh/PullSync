# Pull-Sync — Complete Connection Guide

This document explains how to wire every service together and how to access the client.

---

## Architecture Map

```
Browser (React @ :5173)
        │  HTTP REST
        │  WebSocket (Socket.io)
        ▼
Express API (Node.js @ :4000)
        │  Mongoose ODM
        ├──► MongoDB (:27017)          ← persistent data
        │  
        ├──► In-Memory Store           ← current (no MongoDB needed yet)
        │
        └──► Redis (:6379)             ← optional cache (falls back to in-memory)
```

---

## Step 1 — Prerequisites

Install these once on your machine:

| Tool | Version | Install |
|---|---|---|
| Node.js | ≥ 18 | https://nodejs.org |
| npm | ≥ 9 | included with Node |
| MongoDB | ≥ 6 | https://www.mongodb.com/try/download/community |
| Git | any | https://git-scm.com |

Optional (for production cache):
```bash
# macOS
brew install redis && brew services start redis

# Ubuntu
sudo apt install redis-server && sudo systemctl start redis
```

---

## Step 2 — Clone & Install

```bash
# From the project root:

# Install frontend deps
cd frontend && npm install && cd ..

# Install backend deps
cd backend && npm install && cd ..
```

---

## Step 3 — Configure Environment

```bash
# Frontend
cp frontend/.env.example frontend/.env

# Backend
cp backend/.env.example backend/.env
```

`frontend/.env`:
```
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
```

`backend/.env`:
```
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/pullsync   # Phase 2
USE_REDIS=false                                  # true when Redis is running
REDIS_URL=redis://localhost:6379
```

---

## Step 4 — Start Services

Open **3 terminals**:

### Terminal 1 — Backend API + WebSocket server
```bash
cd backend
npm run dev
# → API ready at http://localhost:4000
# → WebSocket ready on same port
```

You should see:
```
🚀 Pull-Sync API running on http://localhost:4000
📡 WebSocket server ready
Demo token: token_alex (Alex Rivera / owner)
Demo token: token_sam  (Sam Chen / reviewer)
```

### Terminal 2 — Frontend (Client)
```bash
cd frontend
npm run dev
# → Opens at http://localhost:5173
```

### Terminal 3 (Optional) — MongoDB
```bash
mongod --dbpath ./data/db
# Only needed for Phase 2 (persistent storage)
```

---

## Step 5 — Access the Client (Frontend)

Open your browser at:

```
http://localhost:5173
```

You will land on the **Login page** automatically. Use these demo accounts:

| Name | Email | Password | Role | What they can do |
|---|---|---|---|---|
| Alex Rivera | alex@pullsync.dev | password123 | **owner** | Everything |
| Sam Chen | sam@pullsync.dev | password123 | **reviewer** | Read, comment, approve |
| Jordan Kim | jordan@pullsync.dev | password123 | **reviewer** | Read, comment, approve |
| Taylor West | taylor@pullsync.dev | password123 | **viewer** | Read only |

### Pages available:
| URL | Page |
|---|---|
| `/login` | Login form |
| `/signup` | Registration |
| `/dashboard` | PR list with search, filters, stats |
| `/pr/pr-1` | PR detail — diff, comments, approve/reject |
| `/pr/pr-2` | Approved PR example |
| `/pr/pr-3` | Rejected PR example |
| `/analytics` | Charts: activity, approval rate, review time |

---

## Step 6 — Connect Frontend → Backend (API calls)

The frontend currently runs on **mock data** (no backend needed). To switch to **live API**:

Edit `frontend/src/services/api.js` (create this file):

```js
// frontend/src/services/api.js
const BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function getToken() {
  const session = JSON.parse(localStorage.getItem("pull_sync_session") || "{}");
  return session.token;
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "API error");
  }
  return res.json();
}

export const api = {
  getPRs:     (params = "") => apiFetch(`/prs${params}`),
  getPR:      (id)          => apiFetch(`/prs/${id}`),
  createPR:   (body)        => apiFetch("/prs",      { method: "POST", body: JSON.stringify(body) }),
  addComment: (body)        => apiFetch("/comments", { method: "POST", body: JSON.stringify(body) }),
  addReview:  (body)        => apiFetch("/reviews",  { method: "POST", body: JSON.stringify(body) }),
};
```

Then in `Dashboard.jsx`, replace `MOCK_PRS` with:
```js
const [prs, setPRs] = useState([]);
useEffect(() => {
  api.getPRs().then((res) => setPRs(res.data));
}, []);
```

---

## Step 7 — Connect Backend → MongoDB (Phase 2)

1. Make sure MongoDB is running (`mongod`)
2. Set `MONGODB_URI` in `backend/.env`
3. Add this to `backend/app.js`:

```js
const { connect } = require("../database/db");
await connect(process.env.MONGODB_URI);
```

4. Replace `store.*` calls in controllers with Mongoose queries (sample queries are in `database/db.js`)

---

## Step 8 — Enable Redis Cache (Optional)

```bash
# Install Redis locally and start it
redis-server

# Set in backend/.env:
USE_REDIS=true
REDIS_URL=redis://localhost:6379

# Install the ioredis package:
cd backend && npm install ioredis
```

Then in `backend/services/cache.js`, uncomment the `RedisCache` class and change:
```js
const cache = new RedisCache();   // line ~60
```

---

## Step 9 — WebSocket Connection Verification

With both frontend and backend running, open the **browser console** on any authenticated page:

```
[Socket] Connected: <socket-id>
[Socket] Joined room user:u1 as Alex Rivera
```

To test real-time events, approve a PR via API in Terminal 3:
```bash
curl -X POST http://localhost:4000/api/reviews \
  -H "Authorization: Bearer token_sam" \
  -H "Content-Type: application/json" \
  -d '{"prId":"pr-1","decision":"approve","comment":"LGTM!"}'
```
→ The logged-in user (PR author) will instantly see a notification bell update in the UI.

---

## Step 10 — Admin Batch Operations

```bash
# Make the script executable
chmod +x backend/scripts/admin.sh

# Set your owner token
export PULLSYNC_TOKEN=token_alex
export PULLSYNC_API=http://localhost:4000

# Run commands:
./backend/scripts/admin.sh report
./backend/scripts/admin.sh close-stale 14
./backend/scripts/admin.sh assign pr-1 u2,u3
./backend/scripts/admin.sh set-role u4 reviewer
```

---

## Permission Model (Unix-Style)

| Role | Create PR | Read | Comment | Approve/Reject | Admin |
|---|---|---|---|---|---|
| **owner** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **reviewer** | ❌ | ✅ | ✅ | ✅ | ❌ |
| **viewer** | ❌ | ✅ | ❌ | ❌ | ❌ |

Applied automatically by `backend/middleware/permissions.js` on every route.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Frontend shows blank/error | Check `VITE_API_URL` in `frontend/.env` |
| 401 Unauthorized from API | Make sure `Authorization: Bearer token_alex` header is sent |
| 403 Forbidden | Check your user's role — reviewer can't create PRs |
| Socket not connecting | Ensure backend is running and `VITE_SOCKET_URL` is set |
| MongoDB connection refused | Run `mongod` or check `MONGODB_URI` |
| Cache not working | Check `USE_REDIS` and that Redis is running on `REDIS_URL` |

---

## Full Service Start (one-liner)

Install `concurrently` once:
```bash
npm install -g concurrently
```

Then from the project root:
```bash
concurrently \
  "cd backend && npm run dev" \
  "cd frontend && npm run dev"
```

Both start simultaneously. Frontend at `:5173`, backend at `:4000`.
