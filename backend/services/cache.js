// backend/services/cache.js
// Drop-in cache with TTL. Works in-memory now; swap to Redis by flipping USE_REDIS=true.
//
// Redis swap: npm install ioredis  →  uncomment the Redis block below.

const USE_REDIS = process.env.USE_REDIS === "true";

// ── In-Memory implementation ─────────────────────────────────
class InMemoryCache {
  constructor() {
    this._store = new Map(); // key → { value, expiresAt }
    // GC expired keys every 60 s
    setInterval(() => this._gc(), 60_000).unref();
  }

  async get(key) {
    const entry = this._store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this._store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key, value, ttlSeconds = 300) {
    this._store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  async del(key) {
    this._store.delete(key);
  }

  async delByPrefix(prefix) {
    for (const k of this._store.keys()) {
      if (k.startsWith(prefix)) this._store.delete(k);
    }
  }

  _gc() {
    const now = Date.now();
    for (const [k, v] of this._store) {
      if (v.expiresAt && now > v.expiresAt) this._store.delete(k);
    }
  }
}

// ── Redis implementation (uncomment when USE_REDIS=true) ─────
// const Redis = require("ioredis");
// class RedisCache {
//   constructor() {
//     this._client = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
//     this._client.on("error", (e) => console.error("[Redis]", e.message));
//   }
//   async get(key) {
//     const v = await this._client.get(key);
//     return v ? JSON.parse(v) : null;
//   }
//   async set(key, value, ttlSeconds = 300) {
//     await this._client.set(key, JSON.stringify(value), "EX", ttlSeconds);
//   }
//   async del(key) { await this._client.del(key); }
//   async delByPrefix(prefix) {
//     const keys = await this._client.keys(`${prefix}*`);
//     if (keys.length) await this._client.del(...keys);
//   }
// }

const cache = new InMemoryCache(); // swap to new RedisCache() when ready

// ── Cache keys ───────────────────────────────────────────────
const keys = {
  prList: (filters = "") => `pr:list:${filters}`,
  prDetail: (id) => `pr:detail:${id}`,
  prConsensus: (id) => `pr:consensus:${id}`,
  analytics: () => "analytics:summary",
};

// ── Cache middleware factory ──────────────────────────────────
// Usage: router.get("/prs", auth, cacheMiddleware(keys.prList(), 60), listPRs)
function cacheMiddleware(key, ttl = 60) {
  return async (req, res, next) => {
    const cacheKey = typeof key === "function" ? key(req) : key;
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        res.setHeader("X-Cache", "HIT");
        return res.json(cached);
      }
      // Monkey-patch res.json to cache the response before sending
      const originalJson = res.json.bind(res);
      res.json = async (body) => {
        await cache.set(cacheKey, body, ttl);
        res.setHeader("X-Cache", "MISS");
        return originalJson(body);
      };
      next();
    } catch (err) {
      // Cache errors should never block the request
      console.warn("[Cache] Error:", err.message);
      next();
    }
  };
}

// ── Consensus helper (cached) ─────────────────────────────────
// Returns { approvals, rejections, status } from cache or calculates fresh.
async function getConsensus(prId, store) {
  const cacheKey = keys.prConsensus(prId);
  const cached = await cache.get(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  const reviews = store.getReviewsForPR(prId);
  const approvals = reviews.filter((r) => r.decision === "approve").length;
  const rejections = reviews.filter((r) => r.decision === "reject").length;
  const pr = store.findPR(prId);
  const result = { approvals, rejections, status: pr?.status, prId };

  await cache.set(cacheKey, result, 30); // 30 s TTL
  return { ...result, fromCache: false };
}

module.exports = { cache, keys, cacheMiddleware, getConsensus };
