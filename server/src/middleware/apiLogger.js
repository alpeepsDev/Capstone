import adminService from "../services/admin.service.js";
import { emitThrottledAdminDashboardEvent } from "../services/websocket.service.js";
import logger from "../utils/logger.js";

const API_DASHBOARD_EVENT_THROTTLE_MS = 5000;
const HEALTH_DASHBOARD_EVENT_THROTTLE_MS = 15000;
const DASHBOARD_READ_PREFIXES = [
  "/api/v1/admin/dashboard-stats",
  "/api/v1/admin/stats",
  "/api/v1/admin/health",
  "/api/v1/admin/rate-limits",
  "/api/v1/admin/endpoints",
  "/api/v1/admin/users",
  "/api/v1/admin/audit-logs",
];

const shouldEmitDashboardRealtime = (method, requestUrl) => {
  if (requestUrl.startsWith("/api/v1/logs/")) {
    return false;
  }

  if (
    method === "GET" &&
    DASHBOARD_READ_PREFIXES.some((prefix) => requestUrl.startsWith(prefix))
  ) {
    return false;
  }

  return true;
};

/**
 * API Logger Middleware
 * Logs all API requests to the database
 */
const apiLogger = async (req, res, next) => {
  const startTime = Date.now();
  const urlForSkip = req.originalUrl || req.url || "";
  const normalizedUrl = urlForSkip.split("?")[0];
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

        if (shouldEmitDashboardRealtime(req.method, normalizedUrl)) {
          const baseEvent = {
            reason: "api-log",
            sourceEndpoint: normalizedUrl,
            method: req.method,
            userId: req.user?.id || null,
          };

          emitThrottledAdminDashboardEvent(
            {
              ...baseEvent,
              type: "dashboard:api-stats",
            },
            API_DASHBOARD_EVENT_THROTTLE_MS,
          );
          emitThrottledAdminDashboardEvent(
            {
              ...baseEvent,
              type: "dashboard:user-activity",
            },
            API_DASHBOARD_EVENT_THROTTLE_MS,
          );
          emitThrottledAdminDashboardEvent(
            {
              ...baseEvent,
              type: "dashboard:health",
            },
            HEALTH_DASHBOARD_EVENT_THROTTLE_MS,
          );
        }
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
