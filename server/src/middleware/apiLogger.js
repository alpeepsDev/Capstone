import adminService from "../services/admin.service.js";
import logger from "../utils/logger.js";

/**
 * API Logger Middleware
 * Logs all API requests to the database
 */
const apiLogger = async (req, res, next) => {
  const startTime = Date.now();
  const urlForSkip = req.originalUrl || req.url || "";
  const shouldSkip = urlForSkip.startsWith("/api/v1/logs/");

  // Store original end function
  const originalEnd = res.end;

  // Override end function to capture response
  res.end = function (...args) {
    const responseTime = Date.now() - startTime;

    // Log asynchronously (don't block the response)
    setImmediate(async () => {
      if (shouldSkip) return;
      try {
        await adminService.logApiRequest({
          userId: req.user?.id || null,
          username: req.user?.username || null,
          endpoint: req.originalUrl || req.url,
          method: req.method,
          statusCode: res.statusCode,
          responseTime,
          userAgent: req.get("user-agent") || null,
          ipAddress: req.ip || req.connection.remoteAddress || null,
        });
      } catch (error) {
        if (error.message?.includes("fetch failed")) {
          logger.error("API logging failed: Database connection unreachable");
        } else {
          logger.error("API logging error:", error);
        }
      }
    });

    // Call original end function
    originalEnd.apply(res, args);
  };

  next();
};

export default apiLogger;
