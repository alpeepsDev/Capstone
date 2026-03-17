import prisma from "../config/database.js";
import logger from "../utils/logger.js";
import { getRedisAvailability, getConnection } from "../config/redis.js";

/**
 * In-memory store for IP-based rate limiting
 * Maps IP addresses to { count, resetTime }
 */
const ipRateLimitStore = new Map();

/**
 * In-memory store for global rate limiting
 * Keyed by userId when authenticated, else by IP.
 * Maps key to { count, resetTime }
 */
const globalRateStore = new Map();

/**
 * IP-based rate limit configuration
 * Protects unauthenticated endpoints from abuse
 */
const IP_RATE_LIMIT = parseInt(process.env.IP_RATE_LIMIT) || 100;
const IP_RATE_WINDOW_HOURS = parseInt(process.env.IP_RATE_WINDOW_HOURS) || 1;
const IP_RATE_WINDOW_MS = IP_RATE_WINDOW_HOURS * 60 * 60 * 1000;

/**
 * Global rate limit configuration (1000 requests per second by default for concurrent dashboard loads)
 * 
 * This is a server-level safety valve to prevent system overload from:
 * - Automated scrapers/bots
 * - DDoS attacks
 * - Runaway client processes
 * - Burst traffic spikes
 * 
 * 1000/s allows ~5-10 concurrent dashboard API calls without throttling.
 * 
 * Set GLOBAL_RATE_LIMIT env var to override (e.g., 500 for stricter, 5000 for more permissive)
 * 
 * See docs/RATE_LIMITING.md for detailed configuration guide.
 */
const GLOBAL_RATE_LIMIT = parseInt(process.env.GLOBAL_RATE_LIMIT) || 1000;
const GLOBAL_RATE_WINDOW_MS = parseInt(process.env.GLOBAL_RATE_WINDOW_MS) || 1000;
const ADMIN_GLOBAL_RATE_LIMIT = parseInt(process.env.ADMIN_GLOBAL_RATE_LIMIT) || 1000;

/**
 * Get request count for a given key and window.
 * Uses Redis atomic increments for O(1) performance,
 * falls back to Prisma database scans if Redis is down.
 * 
 * @param {string} key Unique key for the rate limit (e.g., 'user:1:endpoint:/api/v1/projects')
 * @param {number} windowMs Time window in milliseconds
 * @param {object} prismaParams Params for Prisma fallback (userId, endpoint, method)
 * @returns {Promise<number>} Current request count including this one
 */
const getRateLimitCount = async (key, windowMs, { userId, endpoint, method } = {}) => {
  if (getRedisAvailability()) {
    try {
      const redis = getConnection();
      const redisKey = `ratelimit:${key}`;
      
      // Increment and set expiry if it's a new key
      const count = await redis.incr(redisKey);
      if (count === 1) {
        await redis.pexpire(redisKey, windowMs);
      }
      
      return count;
    } catch (error) {
      logger.error("[RateLimit] Redis count failed, falling back to DB:", error);
    }
  }

  // Fallback to Prisma (Historical Rolling Window)
  // Note: This accounts for the current request NOT being in the log yet
  const windowStart = new Date(Date.now() - windowMs);
  const whereClause = {
    userId,
    timestamp: { gte: windowStart },
  };

  if (endpoint) whereClause.endpoint = endpoint;
  if (method && method !== "*") whereClause.method = method;

  const count = await prisma.apiLog.count({ where: whereClause });
  return count + 1; // +1 to include the current (pending) request
};

const getClientIp = (req) => req.ip || req.connection?.remoteAddress || "unknown";

/**
 * Check if endpoint should be exempt from global rate limit
 */
const isExemptFromGlobalLimit = (req) => {
  const exemptPaths = [
    "/api/health",
    "/api/v1/logs/", // Log forwarding endpoint
  ];

  return exemptPaths.some((path) => req.path.startsWith(path));
};

/**
 * Global limiter (fixed window). Returns true if request is blocked and response is sent.
 */
const handleGlobalRateLimit = (req, res) => {
  // Skip global rate limit for exempt endpoints
  if (isExemptFromGlobalLimit(req)) {
    return false;
  }

  const now = Date.now();
  const key = req.user?.id ? `user:${req.user.id}` : `ip:${getClientIp(req)}`;
  const limit = req.user?.role === "ADMIN" ? ADMIN_GLOBAL_RATE_LIMIT : GLOBAL_RATE_LIMIT;

  const existing = globalRateStore.get(key);
  if (!existing || now > existing.resetTime) {
    globalRateStore.set(key, { count: 1, resetTime: now + GLOBAL_RATE_WINDOW_MS });
    return false;
  }

  existing.count += 1;

  if (existing.count > limit) {
    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", 0);
    res.setHeader("X-RateLimit-Reset", new Date(existing.resetTime).toISOString());
    res.setHeader("X-RateLimit-Type", "global");

    return res.status(429).json({
      success: false,
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: Math.max(1, Math.ceil((existing.resetTime - now) / 1000)),
      limitType: "global",
    });
  }

  return false;
};

/**
 * Handle IP-based rate limiting for unauthenticated requests
 */
const handleIpBasedRateLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  // Get or initialize IP data
  if (!ipRateLimitStore.has(ip)) {
    ipRateLimitStore.set(ip, { count: 1, resetTime: now + IP_RATE_WINDOW_MS });

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", IP_RATE_LIMIT);
    res.setHeader("X-RateLimit-Remaining", IP_RATE_LIMIT - 1);
    res.setHeader(
      "X-RateLimit-Reset",
      new Date(now + IP_RATE_WINDOW_MS).toISOString(),
    );
    res.setHeader("X-RateLimit-Type", "ip");

    return next();
  }

  const data = ipRateLimitStore.get(ip);

  // Reset window if expired
  if (now > data.resetTime) {
    data.count = 1;
    data.resetTime = now + IP_RATE_WINDOW_MS;

    res.setHeader("X-RateLimit-Limit", IP_RATE_LIMIT);
    res.setHeader("X-RateLimit-Remaining", IP_RATE_LIMIT - 1);
    res.setHeader("X-RateLimit-Reset", new Date(data.resetTime).toISOString());
    res.setHeader("X-RateLimit-Type", "ip");

    return next();
  }

  // Increment count
  data.count++;

  // Set headers
  res.setHeader("X-RateLimit-Limit", IP_RATE_LIMIT);
  res.setHeader(
    "X-RateLimit-Remaining",
    Math.max(0, IP_RATE_LIMIT - data.count),
  );
  res.setHeader("X-RateLimit-Reset", new Date(data.resetTime).toISOString());
  res.setHeader("X-RateLimit-Type", "ip");

  // Check limit
  if (data.count > IP_RATE_LIMIT) {
    return res.status(429).json({
      success: false,
      message: "Rate limit exceeded. Please try again later.",
      retryAfter: Math.ceil((data.resetTime - now) / 1000),
      limitType: "ip",
    });
  }

  next();
};

/**
 * Rate Limiter Middleware
 * Implements multi-level rate limiting:
 * 1. IP-based limits for unauthenticated users
 * 2. Endpoint-specific limits (highest priority for authenticated)
 * 3. User-specific limits
 * 4. Role-based limits (fallback)
 */
const rateLimit = async (req, res, next) => {
  try {
    // Global cap first (fast, in-memory). Applies to all requests.
    if (handleGlobalRateLimit(req, res)) return;

    // Apply IP-based rate limiting for unauthenticated requests
    if (!req.user) {
      return handleIpBasedRateLimit(req, res, next);
    }

    const userId = req.user.id;
    const role = req.user.role;
    const endpoint = req.path;
    const method = req.method;

    let limit, windowMs;

    // PRIORITY 1: Check endpoint-specific rate limit
    const endpointLimit = await prisma.endpointRateLimit.findFirst({
      where: {
        endpoint,
        OR: [{ method: method }, { method: "*" }],
        enabled: true,
      },
      orderBy: {
        method: "desc", // Specific method takes priority over wildcard
      },
    });

    if (endpointLimit) {
      limit = endpointLimit.limit;
      windowMs = endpointLimit.window * 1000;

      // Get request count (Redis-first)
      const redisKey = `user:${userId}:endpoint:${endpoint}:${method}`;
      const requestCount = await getRateLimitCount(redisKey, windowMs, {
        userId,
        endpoint,
        method: endpointLimit.method,
      });

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", limit);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, limit - requestCount));
      res.setHeader(
        "X-RateLimit-Reset",
        new Date(Date.now() + windowMs).toISOString(),
      );
      res.setHeader("X-RateLimit-Type", "endpoint");

      // Check if limit exceeded
      if (requestCount > limit) {
        return res.status(429).json({
          success: false,
          message: `Endpoint rate limit exceeded. Please try again later.`,
          retryAfter: Math.ceil(windowMs / 1000), // seconds
          endpoint,
        });
      }

      return next();
    }

    // PRIORITY 2: Check user-specific rate limit
    const userLimit = await prisma.userRateLimit.findUnique({
      where: { userId, enabled: true },
    });

    if (userLimit) {
      limit = userLimit.limit;
      windowMs = userLimit.window * 1000;
    } else {
      // PRIORITY 3: Use role-based rate limit
      const roleConfig = await prisma.rateLimitConfig.findUnique({
        where: { role: role || "USER", enabled: true },
      });

      // Default limits if config not found
      limit = roleConfig ? roleConfig.limit : 200;
      windowMs = roleConfig ? roleConfig.window * 1000 : 3600000; // 1 hour default
    }

    // Get user's request count in the current window (Redis-first)
    const redisKey = `user:${userId}:total`;
    const requestCount = await getRateLimitCount(redisKey, windowMs, { userId });

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, limit - requestCount));
    res.setHeader(
      "X-RateLimit-Reset",
      new Date(Date.now() + windowMs).toISOString(),
    );
    res.setHeader("X-RateLimit-Type", userLimit ? "user" : "role");

    // Check if limit exceeded
    if (requestCount > limit) {
      return res.status(429).json({
        success: false,
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil(windowMs / 1000), // seconds
        limitType: userLimit ? "user" : "role",
      });
    }

    next();
  } catch (error) {
    logger.error("Rate limiting error:", error);
    // Don't block the request if rate limiting fails
    next();
  }
};

/**
 * Endpoint-specific rate limiter
 * More strict limits for sensitive endpoints
 */
const endpointRateLimit = (maxRequests, windowMinutes = 1) => {
  const requestMap = new Map();

  return (req, res, next) => {
    const key = `${req.ip || req.connection.remoteAddress}_${req.originalUrl}`;
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;

    // Get or initialize request data
    if (!requestMap.has(key)) {
      requestMap.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const data = requestMap.get(key);

    // Reset window if expired
    if (now > data.resetTime) {
      data.count = 1;
      data.resetTime = now + windowMs;
      return next();
    }

    // Increment count
    data.count++;

    // Set headers
    res.setHeader("X-RateLimit-Limit", maxRequests);
    res.setHeader(
      "X-RateLimit-Remaining",
      Math.max(0, maxRequests - data.count),
    );
    res.setHeader("X-RateLimit-Reset", new Date(data.resetTime).toISOString());

    // Check limit
    if (data.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((data.resetTime - now) / 1000),
      });
    }

    next();
  };
};

// Cleanup old entries periodically to prevent memory leaks
// Cleanup old entries periodically to prevent memory leaks
if (process.env.NODE_ENV !== "test") {
  setInterval(
    () => {
      const now = Date.now();

      // Clean up IP rate limit store
      for (const [ip, data] of ipRateLimitStore.entries()) {
        if (now > data.resetTime) {
          ipRateLimitStore.delete(ip);
        }
      }

      // Clean up global rate limit store
      for (const [key, data] of globalRateStore.entries()) {
        if (now > data.resetTime) {
          globalRateStore.delete(key);
        }
      }
    },
    5 * 60 * 1000,
  ); // Every 5 minutes
}

export { rateLimit, endpointRateLimit };
