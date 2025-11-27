import prisma from "../config/database.js";

/**
 * Rate Limiter Middleware
 * Implements multi-level rate limiting:
 * 1. Endpoint-specific limits (highest priority)
 * 2. User-specific limits
 * 3. Role-based limits (fallback)
 */
const rateLimit = async (req, res, next) => {
  try {
    // Skip rate limiting for non-authenticated requests (they'll fail at auth middleware)
    if (!req.user) {
      return next();
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
        new Date(Date.now() + windowMs).toISOString()
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
      new Date(Date.now() + windowMs).toISOString()
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
      Math.max(0, maxRequests - data.count)
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

// Cleanup old entries periodically
setInterval(
  () => {
    const now = Date.now();
    const requestMap = new Map();
    for (const [key, data] of requestMap.entries()) {
      if (now > data.resetTime) {
        requestMap.delete(key);
      }
    }
  },
  5 * 60 * 1000
); // Every 5 minutes

export { rateLimit, endpointRateLimit };
