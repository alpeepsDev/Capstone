import express from "express";
import adminController from "../../controllers/admin/admin.controller.js";
import { authenticateToken, requireAdmin } from "../../middleware/auth.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import {
  updateRateLimitSchema,
  createEndpointRateLimitSchema,
  updateEndpointRateLimitSchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
  setUserRateLimitSchema,
} from "../../validations/admin.validation.js";

const router = express.Router();

// All admin routes require authentication and ADMIN role
router.use(authenticateToken);
router.use(requireAdmin);

// DASHBOARD OVERVIEW
router.get("/dashboard-stats", adminController.getDashboardStats);

// API MONITORING
router.get("/stats", adminController.getApiStats);
router.get("/stats/users", adminController.getUserActivity);

// RATE LIMIT CONFIGURATION
router.get("/rate-limits", adminController.getRateLimits);
router.put(
  "/rate-limits/:role",
  validateRequest(updateRateLimitSchema),
  adminController.updateRateLimit,
);

// Endpoint rate limits
router.get("/rate-limits/endpoints", adminController.getEndpointRateLimits);
router.post(
  "/rate-limits/endpoints",
  validateRequest(createEndpointRateLimitSchema),
  adminController.createEndpointRateLimit,
);
router.put(
  "/rate-limits/endpoints/:id",
  validateRequest(updateEndpointRateLimitSchema),
  adminController.updateEndpointRateLimit,
);
router.delete(
  "/rate-limits/endpoints/:id",
  adminController.deleteEndpointRateLimit,
);

// List available endpoints for configuration UI
router.get("/endpoints", adminController.listAvailableEndpoints);

// User-specific rate limits
router.get("/rate-limits/users", adminController.getUserRateLimits);
router.post(
  "/rate-limits/users/:userId",
  validateRequest(setUserRateLimitSchema),
  adminController.setUserRateLimit,
);
router.delete(
  "/rate-limits/users/:userId",
  adminController.removeUserRateLimit,
);

// SYSTEM HEALTH
router.get("/health", adminController.getSystemHealth);
router.get("/health/history", adminController.getHealthHistory);
router.get("/health/database", adminController.getDatabaseMetrics);
router.get("/health/errors", adminController.getErrorMetrics);

// USER MANAGEMENT
router.get("/users", adminController.getUsers);
router.get("/users/:userId", adminController.getUserDetails);
router.patch(
  "/users/:userId/status",
  validateRequest(updateUserStatusSchema),
  adminController.updateUserStatus,
);
router.patch(
  "/users/:userId/role",
  validateRequest(updateUserRoleSchema),
  adminController.updateUserRole,
);

// AUDIT LOGS
router.get("/audit-logs", adminController.getAuditLogs);

// MAINTENANCE
router.delete("/logs/cleanup", adminController.cleanOldLogs);

// BACKUP
router.get("/backup", adminController.getBackup);
router.get("/backup/code", adminController.getSourceCodeBackup);

export default router;
