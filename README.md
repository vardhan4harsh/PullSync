# Pull-Sync 🔀

A full-stack collaborative code review platform — GitHub-inspired UI, real-time notifications via WebSockets, MongoDB-backed persistence.

---

## Architecture Overview

```
pull-sync/
├── frontend/          React + Tailwind + Recharts + Socket.io-client
├── backend/           Node.js + Express + Socket.io (in-memory store)
├── database/          Mongoose schemas + query reference
└── README.md
```

---

## Quick Start

### 1 — Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

**Demo credentials** (pre-seeded in localStorage mock):
| Email | Password | Role |
|---|---|---|
| alex@pullsync.dev | password123 | owner |
| sam@pullsync.dev | password123 | reviewer |

### 2 — Backend

```bash
cd backend
npm install
npm run dev          # http://localhost:4000
```

**Demo tokens** (Bearer header):
| Token | User |
|---|---|
| token_alex | Alex Rivera (owner) |
| token_sam | Sam Chen (reviewer) |
| token_jordan | Jordan Kim (reviewer) |

### 3 — Database (MongoDB schemas only — no running server needed yet)

```bash
cd database
npm install mongoose
# Models are ready to import once you add a MongoDB URI
```

---

## API Reference

### Authentication
All routes (except `/webhook` and `/health`) require:
```
Authorization: Bearer <token>
```

### Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/prs` | List PRs (filter: `?status=open&author=u1`) |
| GET | `/api/prs/:id` | PR detail with comments & reviews |
| POST | `/api/prs` | Create PR |
| POST | `/api/comments` | Add comment |
| POST | `/api/reviews` | Approve / reject PR |
| POST | `/api/webhook` | GitHub-style webhook receiver |

### Example: Create PR
```bash
curl -X POST http://localhost:4000/api/prs \
  -H "Authorization: Bearer token_alex" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "feat: add dark mode",
    "description": "Implements system-aware dark mode toggle.",
    "branch": "feat/dark-mode",
    "baseBranch": "main",
    "reviewers": ["u2"]
  }'
```

### Example: Approve PR
```bash
curl -X POST http://localhost:4000/api/reviews \
  -H "Authorization: Bearer token_sam" \
  -H "Content-Type: application/json" \
  -d '{ "prId": "pr-1", "decision": "approve", "comment": "LGTM!" }'
```

### Example: Send mock GitHub webhook
```bash
curl -X POST http://localhost:4000/api/webhook \
  -H "Content-Type: application/json" \
  -H "x-github-event: pull_request" \
  -d '{
    "action": "opened",
    "pull_request": {
      "title": "chore: update deps",
      "body": "Bumps all dependencies to latest.",
      "number": 249,
      "head": { "ref": "chore/deps" },
      "base": { "ref": "main" },
      "commits": 1,
      "changed_files": 2,
      "additions": 10,
      "deletions": 8
    }
  }'
```

---

## WebSocket Events

### Server → Client
| Event | Payload | Trigger |
|---|---|---|
| `joined` | `{ userId, room, userName }` | After successful `join` |
| `new_pr` | `{ prId, title, author, number }` | PR created |
| `new_comment` | `{ prId, prTitle, author, content }` | Comment added |
| `review_update` | `{ prId, prNumber, reviewerName, decision, newStatus }` | Review submitted |
| `user_online` | `{ userId, name }` | User connects |
| `user_offline` | `{ userId }` | User disconnects |
| `user_typing` | `{ userId, prId }` | Typing indicator |

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `join` | `{ userId, token }` | Authenticate & join personal room |
| `subscribe_pr` | `{ prId }` | Subscribe to a PR's activity |
| `typing` | `{ prId, userId }` | Broadcast typing indicator |

### Frontend Usage
```jsx
import { useSocket } from "./hooks/useSocket";

function MyComponent() {
  const { user } = useAppContext();

  useSocket({
    user,
    onNewPR: (data) => console.log("New PR:", data.title),
    onNewComment: (data) => console.log("Comment:", data.content),
    onReviewUpdate: (data) => console.log("Review:", data.decision),
  });
}
```

---

## Database (MongoDB)

### Collections
| Collection | Key Indexes |
|---|---|
| `users` | `email` (unique), `role` |
| `pullrequests` | `status + createdAt`, `authorId + status`, `reviewers + status`, full-text |
| `comments` | `prId + createdAt`, `prId + parentId` |
| `reviews` | `prId + decision + isLatest`, `reviewerId + createdAt` |

### Connecting
```js
const { connect } = require("./database/db");
await connect("mongodb://localhost:27017/pullsync");
```

### Performance Tips
- Use `.lean()` on all read-only queries (~2× faster)
- Populate only needed fields: `.populate("authorId", "name email")`
- Use cursor-based pagination (`createdAt` + `_id`) for large collections
- Cache analytics aggregations (they're expensive) with a short TTL
- The `{ status: 1, createdAt: -1 }` compound index covers the most common dashboard query

---

## Frontend Routes

| Path | Component | Auth |
|---|---|---|
| `/login` | Login page | Public |
| `/signup` | Signup page | Public |
| `/dashboard` | PR list + search/filter | ✅ |
| `/pr/:id` | PR detail + diff + comments | ✅ |
| `/analytics` | Charts & metrics | ✅ |

---

## Folder Structure

```
frontend/src/
├── components/
│   ├── Navbar.jsx          Sticky nav with notifications + user menu
│   ├── PRCard.jsx          PR list item card
│   ├── DiffViewer.jsx      Code diff with add/remove highlighting
│   └── CommentsSection.jsx Threaded comments with reply support
├── pages/
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── Dashboard.jsx       PR list + filters + stats
│   ├── PRDetail.jsx        PR info + diff + review actions
│   └── Analytics.jsx       Recharts dashboards
├── hooks/
│   ├── useAuth.js
│   ├── useNotifications.js
│   └── useSocket.js        Socket.io integration
├── services/
│   ├── auth.js             localStorage session management
│   └── mockData.js         All mock PRs, comments, analytics
└── utils/
    ├── context.js          React context
    └── format.js           timeAgo, labelColor helpers

backend/
├── app.js                  Express + Socket.io server entry
├── routes/index.js
├── controllers/            prController, commentController,
│                           reviewController, webhookController
├── middleware/             auth.js, errorHandler.js
├── models/store.js         In-memory data store + helpers
├── services/prService.js   Business logic (approvals, merge check)
└── websockets/socket.js    Socket.io rooms + emit helpers

database/
├── db.js                   Mongoose connect + sample queries
└── models/
    ├── User.js
    ├── PullRequest.js
    ├── Comment.js
    ├── Review.js
    └── Counter.js
```

---

## Migrating from In-Memory → MongoDB

1. Add `MONGODB_URI` to backend `.env`
2. Call `connect()` from `database/db.js` in `app.js`
3. Replace `store.*` calls in controllers with Mongoose model calls
4. Sample queries for every operation are documented in `database/db.js`
