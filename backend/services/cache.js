// ============================================================
// services/cache.js — Simple in-memory cache with expiry
// OWNER: Gaurav Parashar
// Caching means storing a response temporarily so we don't have
// to recalculate or re-query the database every single time.
//
// Right now this uses in-memory storage (data is lost on restart).
// To switch to Redis (persistent cache), set USE_REDIS=true in .env
// and uncomment the Redis section below.
// ============================================================

const USE_REDIS = process.env.USE_REDIS === "true";

// In-memory cache implementation
class InMemoryCache {
  constructor() {
    this._store = new Map(); // stores key → { value, expiresAt }

    // Clean up expired entries every 60 seconds automatically
    setInterval(() => this._gc(), 60_000).unref();
  }

  // Get a value by key — returns null if missing or expired
  async get(key) {
    const entry = this._store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this._store.delete(key); // expired — clean it up
      return null;
    }
    return entry.value;
  }

  // Store a value with a time-to-live in seconds (default 300s = 5 minutes)
  async set(key, value, ttlSeconds = 300) {
    this._store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
    });
  }

  // Delete one specific key
  async del(key) {
    this._store.delete(key);
  }

  // Delete all keys that start with a given prefix
  // Useful for clearing all PR list cache entries at once
  async delByPrefix(prefix) {
    for (const k of this._store.keys()) {
      if (k.startsWith(prefix)) this._store.delete(k);
    }
  }

  // Garbage collector — removes all expired entries
  _gc() {
    const now = Date.now();
    for (const [k, v] of this._store) {
      if (v.expiresAt && now > v.expiresAt) this._store.delete(k);
    }
  }
}

// ── Redis implementation (uncomment this when USE_REDIS=true) ─
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

// Switch to Redis by changing: new InMemoryCache() → new RedisCache()
const cache = new InMemoryCache();

// Standardized key names so we don't accidentally use different strings in different places
const keys = {
  prList: (filters = "") => `pr:list:${filters}`,
  prDetail: (id) => `pr:detail:${id}`,
  prConsensus: (id) => `pr:consensus:${id}`,
  analytics: () => "analytics:summary",
};

// Middleware factory — wraps a route with caching
// Usage: router.get("/prs", auth, cacheMiddleware(keys.prList(), 60), listPRs)
// If the cached response exists, it returns immediately without hitting the controller
function cacheMiddleware(key, ttl = 60) {
  return async (req, res, next) => {
    const cacheKey = typeof key === "function" ? key(req) : key;
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        res.setHeader("X-Cache", "HIT"); // tells the client this came from cache
        return res.json(cached);
      }
      // Cache miss — intercept res.json to cache the response before sending
      const originalJson = res.json.bind(res);
      res.json = async (body) => {
        await cache.set(cacheKey, body, ttl);
        res.setHeader("X-Cache", "MISS");
        return originalJson(body);
      };
      next();
    } catch (err) {
      // Cache errors should never break real requests — just skip caching
      console.warn("[Cache] Error:", err.message);
      next();
    }
  };
}

// Get the approval consensus for a PR (how many approvals vs rejections)
// Checks cache first to avoid re-reading all reviews every time
async function getConsensus(prId, store) {
  const cacheKey = keys.prConsensus(prId);
  const cached = await cache.get(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  const reviews = store.getReviewsForPR(prId);
  const approvals = reviews.filter((r) => r.decision === "approve").length;
  const rejections = reviews.filter((r) => r.decision === "reject").length;
  const pr = store.findPR(prId);
  const result = { approvals, rejections, status: pr?.status, prId };

  await cache.set(cacheKey, result, 30); // keep this cached for 30 seconds
  return { ...result, fromCache: false };
}

module.exports = { cache, keys, cacheMiddleware, getConsensus };
