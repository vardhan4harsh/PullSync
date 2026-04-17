// OWNER: Harsh Vardhan
// services/mockData.js — All mock data for Pull-Sync (offline fallback)

export const MOCK_USERS = [
  { id: "u1",  name: "Harsh Vardhan",   email: "harsh.vardhan@pullsync.dev",   avatar: "HV", role: "owner"    },
  { id: "u2",  name: "Garima Yadav",    email: "garima.yadav@pullsync.dev",    avatar: "GY", role: "reviewer" },
  { id: "u3",  name: "Harsh Gupta",     email: "harsh.gupta@pullsync.dev",     avatar: "HG", role: "reviewer" },
  { id: "u4",  name: "Devesh Tyagi",    email: "devesh.tyagi@pullsync.dev",    avatar: "DT", role: "reviewer" },
  { id: "u5",  name: "Gaurav Parashar", email: "gaurav.parashar@pullsync.dev", avatar: "GP", role: "reviewer" },
  { id: "u6",  name: "Aditya Sharma",   email: "aditya.sharma@pullsync.dev",   avatar: "AS", role: "reviewer" },
  { id: "u7",  name: "Priya Nair",      email: "priya.nair@pullsync.dev",      avatar: "PN", role: "reviewer" },
  { id: "u8",  name: "Rohit Mishra",    email: "rohit.mishra@pullsync.dev",    avatar: "RM", role: "viewer"   },
  { id: "u9",  name: "Sneha Kulkarni",  email: "sneha.kulkarni@pullsync.dev",  avatar: "SK", role: "viewer"   },
  { id: "u10", name: "Vikram Joshi",    email: "vikram.joshi@pullsync.dev",    avatar: "VJ", role: "reviewer" },
];

export const MOCK_PRS = [
  {
    id: "pr-1", number: 247,
    title: "feat: implement real-time collaborative editing with CRDT",
    description: "This PR introduces conflict-free replicated data types for collaborative text editing. Replaces the existing lock-based system.\n\n## Changes\n- Added `@syncedstore/core`\n- Implemented CRDT document model\n- Updated WebSocket handlers\n- Added operational transform fallback",
    authorId: "u1", author: "Harsh Vardhan",
    reviewers: ["u2", "u3"], status: "open",
    branch: "feat/crdt-collab", baseBranch: "main",
    commitsCount: 12, changedFiles: 8, additions: 342, deletions: 89,
    createdAt: "2024-03-15T10:30:00Z", updatedAt: "2024-03-15T14:22:00Z",
    commentCount: 7, labels: ["feature", "breaking-change"],
  },
  {
    id: "pr-2", number: 246,
    title: "fix: resolve race condition in webhook delivery queue",
    description: "Fixes a critical race condition where webhook events could be delivered out of order under high load. Added mutex locks and retry logic.",
    authorId: "u2", author: "Garima Yadav",
    reviewers: ["u1"], status: "approved",
    branch: "fix/webhook-race", baseBranch: "main",
    commitsCount: 3, changedFiles: 4, additions: 67, deletions: 23,
    createdAt: "2024-03-14T09:15:00Z", updatedAt: "2024-03-14T16:45:00Z",
    commentCount: 3, labels: ["bug", "critical"],
  },
  {
    id: "pr-3", number: 245,
    title: "refactor: migrate auth service to OAuth 2.0 PKCE flow",
    description: "Migrates authentication from implicit flow to PKCE (Proof Key for Code Exchange) for enhanced security.",
    authorId: "u3", author: "Harsh Gupta",
    reviewers: ["u1", "u2"], status: "rejected",
    branch: "refactor/oauth-pkce", baseBranch: "main",
    commitsCount: 6, changedFiles: 11, additions: 189, deletions: 234,
    createdAt: "2024-03-13T11:00:00Z", updatedAt: "2024-03-13T18:30:00Z",
    commentCount: 12, labels: ["security", "refactor"],
  },
  {
    id: "pr-4", number: 244,
    title: "docs: add comprehensive API reference for webhooks",
    description: "Adds complete API documentation for the webhook system including event types, payload schemas, and security verification.",
    authorId: "u4", author: "Devesh Tyagi",
    reviewers: ["u2", "u5"], status: "open",
    branch: "docs/webhook-api", baseBranch: "main",
    commitsCount: 2, changedFiles: 5, additions: 412, deletions: 12,
    createdAt: "2024-03-12T14:00:00Z", updatedAt: "2024-03-12T14:00:00Z",
    commentCount: 1, labels: ["documentation"],
  },
  {
    id: "pr-5", number: 243,
    title: "perf: optimize database query for PR listing with pagination",
    description: "Query time reduced by 87% through proper indexing and cursor-based pagination.",
    authorId: "u1", author: "Harsh Vardhan",
    reviewers: ["u3", "u6"], status: "approved",
    branch: "perf/pr-listing-query", baseBranch: "main",
    commitsCount: 4, changedFiles: 3, additions: 55, deletions: 98,
    createdAt: "2024-03-11T08:00:00Z", updatedAt: "2024-03-11T15:20:00Z",
    commentCount: 5, labels: ["performance"],
  },
  {
    id: "pr-6", number: 242,
    title: "feat: add multi-language i18n support (Hindi + English)",
    description: "Introduces react-i18next with Hindi and English locale files. All UI strings are now translatable.",
    authorId: "u5", author: "Gaurav Parashar",
    reviewers: ["u1", "u4"], status: "open",
    branch: "feat/i18n-hindi", baseBranch: "main",
    commitsCount: 9, changedFiles: 22, additions: 580, deletions: 45,
    createdAt: "2024-03-10T09:00:00Z", updatedAt: "2024-03-10T12:00:00Z",
    commentCount: 4, labels: ["feature", "i18n"],
  },
  {
    id: "pr-7", number: 241,
    title: "fix: memory leak in Socket.io room cleanup on disconnect",
    description: "Rooms were never cleaned up when users disconnected unexpectedly. Adds cleanup handler and periodic GC sweep.",
    authorId: "u6", author: "Aditya Sharma",
    reviewers: ["u2", "u3"], status: "approved",
    branch: "fix/socket-room-leak", baseBranch: "main",
    commitsCount: 2, changedFiles: 2, additions: 31, deletions: 8,
    createdAt: "2024-03-09T13:00:00Z", updatedAt: "2024-03-09T17:30:00Z",
    commentCount: 2, labels: ["bug"],
  },
  {
    id: "pr-8", number: 240,
    title: "chore: upgrade all dependencies to latest stable",
    description: "Bumps all npm packages. Key upgrades: Vite 5→6, React 18→19, Express 4→5.",
    authorId: "u7", author: "Priya Nair",
    reviewers: ["u1"], status: "rejected",
    branch: "chore/dep-upgrade", baseBranch: "main",
    commitsCount: 1, changedFiles: 2, additions: 89, deletions: 89,
    createdAt: "2024-03-08T10:00:00Z", updatedAt: "2024-03-08T14:00:00Z",
    commentCount: 2, labels: ["chore"],
  },
  {
    id: "pr-9", number: 239,
    title: "feat: dark/light theme toggle with system preference sync",
    description: "Adds a theme toggle that respects OS prefers-color-scheme and persists the user choice in localStorage.",
    authorId: "u4", author: "Devesh Tyagi",
    reviewers: ["u5", "u7"], status: "open",
    branch: "feat/theme-toggle", baseBranch: "main",
    commitsCount: 5, changedFiles: 14, additions: 210, deletions: 60,
    createdAt: "2024-03-07T11:00:00Z", updatedAt: "2024-03-07T16:00:00Z",
    commentCount: 1, labels: ["feature", "ui"],
  },
  {
    id: "pr-10", number: 238,
    title: "test: add E2E test suite with Playwright for PR review flow",
    description: "Covers the full reviewer journey: login → view PR → review diff → approve → notification.",
    authorId: "u2", author: "Garima Yadav",
    reviewers: ["u1", "u3"], status: "open",
    branch: "test/playwright-e2e", baseBranch: "main",
    commitsCount: 7, changedFiles: 10, additions: 640, deletions: 0,
    createdAt: "2024-03-06T08:30:00Z", updatedAt: "2024-03-06T12:00:00Z",
    commentCount: 1, labels: ["testing"],
  },
];

export const MOCK_COMMENTS = {
  "pr-1": [
    {
      id: "c1", userId: "u2", author: "Garima Yadav", avatar: "GY",
      content: "Have you benchmarked the memory overhead with large documents? Saw ~12MB overhead in similar setups.",
      timestamp: "2024-03-15T11:00:00Z", line: 42, file: "src/collab/crdt.ts",
      replies: [
        {
          id: "c1r1", userId: "u1", author: "Harsh Vardhan", avatar: "HV",
          content: "Yes, tested with 10k-word docs — ~12MB overhead vs ~2MB previously. Adding lazy serialization in the next commit.",
          timestamp: "2024-03-15T11:30:00Z",
        }
      ]
    },
    {
      id: "c2", userId: "u3", author: "Harsh Gupta", avatar: "HG",
      content: "OT fallback is smart. Should we have a feature flag to disable CRDT in prod emergencies?",
      timestamp: "2024-03-15T12:15:00Z", line: 87, file: "src/collab/sync.ts",
      replies: []
    },
  ],
};

export const MOCK_DIFF = [
  { type: "neutral", lineNo: { old: 1, new: 1 }, content: "  import { Document } from './types';" },
  { type: "neutral", lineNo: { old: 2, new: 2 }, content: "  import { EventEmitter } from 'events';" },
  { type: "add",     lineNo: { old: null, new: 3 }, content: "+ import { CRDTDocument, Automerge } from '@syncedstore/core';" },
  { type: "add",     lineNo: { old: null, new: 4 }, content: "+ import { OperationalTransform } from './ot-fallback';" },
  { type: "neutral", lineNo: { old: 3, new: 5 }, content: "  " },
  { type: "neutral", lineNo: { old: 4, new: 6 }, content: "  export class CollaborationManager extends EventEmitter {" },
  { type: "remove",  lineNo: { old: 5, new: null }, content: "-   private locks: Map<string, Mutex> = new Map();" },
  { type: "remove",  lineNo: { old: 6, new: null }, content: "-   private documents: Map<string, Document> = new Map();" },
  { type: "add",     lineNo: { old: null, new: 7 }, content: "+   private crdtDocs: Map<string, CRDTDocument> = new Map();" },
  { type: "add",     lineNo: { old: null, new: 8 }, content: "+   private otFallback: OperationalTransform;" },
  { type: "add",     lineNo: { old: null, new: 9 }, content: "+   private useCRDT: boolean = process.env.FEATURE_CRDT === 'true';" },
];

export const MOCK_NOTIFICATIONS = [
  { id: "n1", type: "review",  message: "Garima Yadav approved PR #246",           time: "2m ago",  read: false, prId: "pr-2"  },
  { id: "n2", type: "comment", message: "Harsh Gupta commented on PR #247",         time: "15m ago", read: false, prId: "pr-1"  },
  { id: "n3", type: "pr",      message: "New PR #247 opened by Harsh Vardhan",      time: "1h ago",  read: true,  prId: "pr-1"  },
  { id: "n4", type: "review",  message: "Harsh Vardhan requested changes on PR #245", time: "3h ago", read: true, prId: "pr-3"  },
  { id: "n5", type: "comment", message: "Gaurav Parashar replied to your comment",  time: "5h ago",  read: true,  prId: "pr-6"  },
];

export const MOCK_ANALYTICS = {
  weeklyActivity: [
    { day: "Mon", opened: 4, merged: 2, rejected: 1 },
    { day: "Tue", opened: 6, merged: 5, rejected: 0 },
    { day: "Wed", opened: 3, merged: 4, rejected: 2 },
    { day: "Thu", opened: 8, merged: 3, rejected: 1 },
    { day: "Fri", opened: 5, merged: 6, rejected: 0 },
    { day: "Sat", opened: 1, merged: 2, rejected: 0 },
    { day: "Sun", opened: 2, merged: 1, rejected: 1 },
  ],
  reviewTime: [
    { label: "< 1h",  value: 12 },
    { label: "1-4h",  value: 28 },
    { label: "4-24h", value: 35 },
    { label: "1-3d",  value: 18 },
    { label: "> 3d",  value: 7  },
  ],
  approvalRate: [
    { name: "Approved", value: 68, color: "#3fb950" },
    { name: "Rejected", value: 12, color: "#f85149" },
    { name: "Pending",  value: 20, color: "#7d8590" },
  ],
  topReviewers: [
    { name: "Garima Yadav",    reviews: 47, avatar: "GY" },
    { name: "Harsh Vardhan",   reviews: 39, avatar: "HV" },
    { name: "Harsh Gupta",     reviews: 31, avatar: "HG" },
    { name: "Devesh Tyagi",    reviews: 28, avatar: "DT" },
    { name: "Gaurav Parashar", reviews: 22, avatar: "GP" },
  ],
  metrics: {
    avgReviewTime: "4.2h",
    approvalRate:  "68%",
    openPRs:       12,
    mergedThisWeek: 23,
  },
};
