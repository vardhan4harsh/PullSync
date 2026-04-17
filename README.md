# Pull-Sync — PR Review Dashboard

A real-time pull request review tool built with Node.js, MongoDB, React, and Socket.io.
Team members can view, comment on, approve, or reject pull requests — and get live notifications when things change.

---

## Team & Work Split

| Member | Role | What they own |
|---|---|---|
| **Harsh Vardhan** | Owner (Full Stack) | Frontend: Dashboard, PRDetail, Login, Signup pages · Components: CommentsSection, DiffViewer, PRCard, CreatePRModal · Hooks: useAuth, usePRs · Services: api.js, mockData.js · Utils: format.js |
| **Garima Yadav** | Full Stack | Frontend: Analytics, Team, UserManagement pages · Navbar component · Hooks: useNotifications, useSocket · Services: auth.js · Utils: context.js · App.jsx · Backend: authController.js, middleware/auth.js · DB Models: User.js, Session.js |
| **Harsh Gupta** | Backend | prController.js, commentController.js, reviewController.js, prService.js · DB: db.js, PullRequest.js, Comment.js, Review.js, Counter.js |
| **Devesh Tyagi** | Backend | webhookController.js, approvalController.js · Services: githubService.js, githubApprovalService.js |
| **Gaurav Parashar** | Backend | app.js, routes/index.js · middleware/permissions.js, errorHandler.js · services/cache.js · websockets/socket.js · models/store.js · adminController.js |

---

## Project Structure

```
pull-sync/
├── backend/
│   ├── app.js                        # Server entry point
│   ├── routes/index.js               # All API routes
│   ├── controllers/
│   │   ├── authController.js         # Login & signup
│   │   ├── prController.js           # PR CRUD
│   │   ├── commentController.js      # Comments
│   │   ├── reviewController.js       # Approve/reject
│   │   ├── adminController.js        # Admin batch ops
│   │   ├── approvalController.js     # GitHub actions
│   │   └── webhookController.js      # GitHub webhooks
│   ├── middleware/
│   │   ├── auth.js                   # Token verification
│   │   ├── permissions.js            # Role-based access
│   │   └── errorHandler.js           # Global error handler
│   ├── models/
│   │   └── store.js                  # In-memory data store
│   ├── services/
│   │   ├── cache.js                  # In-memory cache
│   │   ├── githubService.js          # GitHub API client
│   │   ├── githubApprovalService.js  # Per-user GitHub actions
│   │   └── prService.js              # PR helper utilities
│   ├── websockets/
│   │   └── socket.js                 # Socket.io setup
│   └── scripts/
│       └── seed.js                   # Seed MongoDB with demo data
├── database/
│   ├── db.js                         # MongoDB connection
│   └── models/
│       ├── User.js
│       ├── PullRequest.js
│       ├── Comment.js
│       ├── Review.js
│       ├── Session.js
│       └── Counter.js
└── frontend/
    ├── src/
    │   ├── pages/                    # Full page components
    │   ├── components/               # Reusable UI components
    │   ├── hooks/                    # Custom React hooks
    │   ├── services/                 # API call functions
    │   └── utils/                    # Shared helpers
    └── index.html
```

---

## Prerequisites

Make sure you have these installed before starting:

- **Node.js** v18 or higher — [nodejs.org](https://nodejs.org)
- **MongoDB** v6 or higher — [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
- **Git** — [git-scm.com](https://git-scm.com)
- A **GitHub account** (optional — needed only for live GitHub integration)

---

## Local Setup (Step by Step)

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/pull-sync.git
cd pull-sync
```

### 2. Install dependencies

You need to run `npm install` in three separate folders:

```bash
# Install backend dependencies
cd backend
npm install

# Install database dependencies
cd ../database
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Go back to the root
cd ..
```

### 3. Set up environment variables

**Backend** — create `backend/.env`:

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/pullsync
GITHUB_TOKEN=your_github_personal_access_token
WEBHOOK_SECRET=any_random_secret_string
FRONTEND_URL=http://localhost:5173
```

**Frontend** — create `frontend/.env`:

```env
VITE_API_URL=http://localhost:4000/api
VITE_WS_URL=http://localhost:4000
```

> You can leave `GITHUB_TOKEN` and `WEBHOOK_SECRET` blank to run in demo mode (no real GitHub connection needed).

### 4. Start MongoDB

**Windows:**
```bash
mongod
```

**macOS (with Homebrew):**
```bash
brew services start mongodb-community
```

**Linux:**
```bash
sudo systemctl start mongod
```

### 5. Seed the database with demo data

This creates the five team member accounts and sample PRs in MongoDB:

```bash
cd backend
node scripts/seed.js
```

You should see output like:
```
✅ MongoDB connected
✅ Created users: Harsh Vardhan, Garima Yadav, ...
✅ Created 10 pull requests
✅ Seed complete
```

### 6. Start the backend server

```bash
cd backend
npm start
```

The server starts at **http://localhost:4000**

You should see:
```
🚀 Pull-Sync API running on http://localhost:4000
📡 WebSocket server ready
```

### 7. Start the frontend

Open a **new terminal** and run:

```bash
cd frontend
npm run dev
```

The frontend starts at **http://localhost:5173**

---

## Demo Login Credentials

After seeding, you can log in with these accounts:

| Name | Email | Password | Role |
|---|---|---|---|
| Harsh Vardhan | harsh.vardhan@pullsync.dev | password123 | Owner |
| Garima Yadav | garima.yadav@pullsync.dev | password123 | Reviewer |
| Harsh Gupta | harsh.gupta@pullsync.dev | password123 | Reviewer |
| Devesh Tyagi | devesh.tyagi@pullsync.dev | password123 | Reviewer |
| Gaurav Parashar | gaurav.parashar@pullsync.dev | password123 | Reviewer |

You can also use the quick-login tokens in the API directly:
- `token_harsh_vardhan` (owner — full access)
- `token_garima_yadav` (reviewer)
- `token_harsh_gupta` (reviewer)
- `token_devesh_tyagi` (reviewer)
- `token_gaurav_parashar` (reviewer)

---

## GitHub Setup (Optional)

This section is only needed if you want live GitHub integration (real diffs, real webhook events).

### Step 1: Create a GitHub Personal Access Token

1. Go to GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **Generate new token (classic)**
3. Give it a name like `pull-sync-dev`
4. Select these scopes:
   - `repo` (full control of repositories)
   - `read:user`
5. Click **Generate token** and copy it
6. Paste it into `backend/.env` as `GITHUB_TOKEN=ghp_your_token_here`

### Step 2: Set up a webhook (for receiving GitHub events)

For local development, use **ngrok** to expose your local server to the internet:

```bash
# Install ngrok from ngrok.com, then run:
ngrok http 4000
```

Copy the `https://xxxxx.ngrok.io` URL ngrok gives you.

Then in your GitHub repository:
1. Go to **Settings** → **Webhooks** → **Add webhook**
2. **Payload URL**: `https://xxxxx.ngrok.io/api/webhook`
3. **Content type**: `application/json`
4. **Secret**: use the same value as `WEBHOOK_SECRET` in your `.env`
5. **Events**: select "Send me everything" or pick: Pull requests, Pull request reviews, Pull request review comments, Pushes
6. Click **Add webhook**

Now when someone opens a PR in your repo, Pull-Sync will receive the event automatically.

### Step 3: Link your GitHub account in the app

1. Log in to Pull-Sync
2. Go to **Team** → your profile
3. Click **Link GitHub** and enter your GitHub username and personal access token
4. Now you can approve/reject PRs directly through Pull-Sync

---

## API Quick Reference

All requests need an `Authorization: Bearer <token>` header (except login/signup).

| Method | URL | What it does |
|---|---|---|
| POST | `/api/auth/login` | Login, returns token |
| POST | `/api/auth/signup` | Create account |
| GET | `/api/prs` | List all pull requests |
| GET | `/api/prs/:id` | Get one PR |
| POST | `/api/prs` | Create a PR |
| GET | `/api/prs/:id/diff` | Get code diff |
| POST | `/api/comments` | Add comment |
| POST | `/api/reviews` | Submit review (approve/reject) |
| POST | `/api/approvals/approve` | Approve on GitHub |
| GET | `/api/approvals/team` | List team members |
| POST | `/api/approvals/link-github` | Link GitHub account |
| GET | `/api/admin/report` | Stats report (owner only) |
| GET | `/api/health` | Check server status |

---

## Common Issues

**"MongoDB connection error"**
- Make sure MongoDB is running (`mongod` or `brew services start mongodb-community`)
- Check that `MONGODB_URI` in `.env` is correct

**"GITHUB_TOKEN is not set"**
- The app works without it — you just won't see real code diffs
- Only set it if you want GitHub integration

**Frontend shows no data**
- Make sure the backend is running on port 4000
- Make sure you ran `node scripts/seed.js`
- Check `VITE_API_URL` in `frontend/.env`

**Port already in use**
- Change `PORT=4001` in `backend/.env` and update `VITE_API_URL` in `frontend/.env` to match

---

## Running Without MongoDB

The app has an in-memory fallback. If you skip MongoDB setup, the backend uses `store.js` for data. Everything works except:
- Data is lost when the server restarts
- User accounts from signup won't persist
- You must use the demo tokens for authentication

To run without MongoDB, just remove `MONGODB_URI` from `backend/.env` entirely.
