import prisma from "../config/database.js";

/**
 * In-memory store for IP-based rate limiting
 * Maps IP addresses to { count, resetTime }
 */
const ipRateLimitStore = new Map();

/**
 * IP-based rate limit configuration
 */
const IP_RATE_LIMIT = parseInt(process.env.IP_RATE_LIMIT) || 100;
const IP_RATE_WINDOW_HOURS = parseInt(process.env.IP_RATE_WINDOW_HOURS) || 1;
const IP_RATE_WINDOW_MS = IP_RATE_WINDOW_HOURS * 60 * 60 * 1000;

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

      // Count requests for this endpoint
      const windowStart = new Date(Date.now() - windowMs);
      const whereClause = {
        userId,
        endpoint,
        timestamp: { gte: windowStart },
      };

      if (endpointLimit.method !== "*") {
        whereClause.method = method;
      }

      const requestCount = await prisma.apiLog.count({ where: whereClause });

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", limit);
      res.setHeader("X-RateLimit-Remaining", Math.max(0, limit - requestCount));
      res.setHeader(
        "X-RateLimit-Reset",
        new Date(Date.now() + windowMs).toISOString(),
      );
      res.setHeader("X-RateLimit-Type", "endpoint");

      // Check if limit exceeded
      if (requestCount >= limit) {
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

    // Get user's request count in the current window
    const windowStart = new Date(Date.now() - windowMs);
    const requestCount = await prisma.apiLog.count({
      where: {
        userId,
        timestamp: {
          gte: windowStart,
        },
      },
    });

    // Set rate limit headers
    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, limit - requestCount));
    res.setHeader(
      "X-RateLimit-Reset",
      new Date(Date.now() + windowMs).toISOString(),
    );
    res.setHeader("X-RateLimit-Type", userLimit ? "user" : "role");

    // Check if limit exceeded
    if (requestCount >= limit) {
      return res.status(429).json({
        success: false,
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil(windowMs / 1000), // seconds
        limitType: userLimit ? "user" : "role",
      });
    }

    next();
  } catch (error) {
    console.error("Rate limiting error:", error);
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
    },
    5 * 60 * 1000,
  ); // Every 5 minutes
}

export { rateLimit, endpointRateLimit };
