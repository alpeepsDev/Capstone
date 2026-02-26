import adminService from "../../services/admin.service.js";
import archiver from "archiver";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AdminController {
  /**
   * Get dashboard high-level stats (counts, recent activity)
   * GET /api/v1/admin/dashboard-stats
   */
  async getDashboardStats(req, res, next) {
    try {
      const stats = await adminService.getDashboardStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get API statistics
   * GET /api/v1/admin/stats
   */
  async getApiStats(req, res, next) {
    try {
      const { timeRange = "24h" } = req.query;

      if (!["1h", "24h", "7d", "30d"].includes(timeRange)) {
        return res.status(400).json({
          success: false,
          message: "Invalid time range. Use: 1h, 24h, 7d, or 30d",
        });
      }

      const stats = await adminService.getApiStatistics(timeRange);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user activity
   * GET /api/v1/admin/stats/users
   */
  async getUserActivity(req, res, next) {
    try {
      const { limit = 10 } = req.query;
      const activity = await adminService.getUserActivity(parseInt(limit));

      res.status(200).json({
        success: true,
        data: activity,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all rate limit configurations
   * GET /api/v1/admin/rate-limits
   */
  async getRateLimits(req, res, next) {
    try {
      const configs = await adminService.getRateLimitConfigs();

      res.status(200).json({
        success: true,
        data: configs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update rate limit configuration
   * PUT /api/v1/admin/rate-limits/:role
   */
  async updateRateLimit(req, res, next) {
    try {
      const { role } = req.params;
      const { limit } = req.body;
      const adminId = req.user.id;

      // Validate
      if (!["ADMIN", "MANAGER", "USER"].includes(role.toUpperCase())) {
        return res.status(400).json({
          success: false,
          message: "Invalid role. Use: ADMIN, MANAGER, or USER",
        });
      }

      if (!limit || limit < 1) {
        return res.status(400).json({
          success: false,
          message: "Limit must be a positive number",
        });
      }

      const config = await adminService.updateRateLimitConfig(
        role.toUpperCase(),
        parseInt(limit),
        adminId,
      );

      res.status(200).json({
        success: true,
        message: "Rate limit updated successfully",
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get endpoint-specific rate limits
   * GET /api/v1/admin/rate-limits/endpoints
   */
  async getEndpointRateLimits(req, res, next) {
    try {
      const endpoints = await adminService.getEndpointRateLimits();

      res.status(200).json({
        success: true,
        data: endpoints,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get list of available API endpoints (for dropdown)
   * GET /api/v1/admin/endpoints
   */
  async listAvailableEndpoints(req, res, next) {
    try {
      // Inspect Express router stack to get registered routes
      const routes = [];
      const stack = req.app._router.stack;

      stack.forEach((layer) => {
        if (layer.route && layer.route.path) {
          const methods = Object.keys(layer.route.methods)
            .map((m) => m.toUpperCase())
            .join(",");
          routes.push({
            endpoint: layer.route.path,
            methods,
          });
        } else if (
          layer.name === "router" &&
          layer.handle &&
          layer.handle.stack
        ) {
          layer.handle.stack.forEach((l) => {
            if (l.route && l.route.path) {
              const methods = Object.keys(l.route.methods)
                .map((m) => m.toUpperCase())
                .join(",");
              routes.push({ endpoint: l.route.path, methods });
            }
          });
        }
      });

      res.status(200).json({ success: true, data: routes });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create endpoint rate limit
   * POST /api/v1/admin/rate-limits/endpoints
   */
  async createEndpointRateLimit(req, res, next) {
    try {
      const { endpoint, method, limit, window } = req.body;
      const adminId = req.user.id;

      if (!endpoint || !method || !limit) {
        return res.status(400).json({
          success: false,
          message: "endpoint, method, and limit are required",
        });
      }

      const config = await adminService.createEndpointRateLimit(
        endpoint,
        method,
        parseInt(limit),
        parseInt(window || 60),
        adminId,
      );

      res.status(201).json({
        success: true,
        message: "Endpoint rate limit created successfully",
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update endpoint rate limit
   * PUT /api/v1/admin/rate-limits/endpoints/:id
   */
  async updateEndpointRateLimit(req, res, next) {
    try {
      const { id } = req.params;
      const { limit, window, enabled } = req.body;
      const adminId = req.user.id;

      const updateData = {};
      if (limit !== undefined) updateData.limit = parseInt(limit);
      if (window !== undefined) updateData.window = parseInt(window);
      if (enabled !== undefined) updateData.enabled = enabled;

      const config = await adminService.updateEndpointRateLimit(
        id,
        updateData,
        adminId,
      );

      res.status(200).json({
        success: true,
        message: "Endpoint rate limit updated successfully",
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete endpoint rate limit
   * DELETE /api/v1/admin/rate-limits/endpoints/:id
   */
  async deleteEndpointRateLimit(req, res, next) {
    try {
      const { id } = req.params;
      const adminId = req.user.id;

      await adminService.deleteEndpointRateLimit(id, adminId);

      res.status(200).json({
        success: true,
        message: "Endpoint rate limit deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user-specific rate limits
   * GET /api/v1/admin/rate-limits/users
   */
  async getUserRateLimits(req, res, next) {
    try {
      const limits = await adminService.getUserRateLimits();

      res.status(200).json({
        success: true,
        data: limits,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Set user rate limit
   * POST /api/v1/admin/rate-limits/users/:userId
   */
  async setUserRateLimit(req, res, next) {
    try {
      const { userId } = req.params;
      const { limit, window } = req.body;
      const adminId = req.user.id;

      if (!limit || limit < 1) {
        return res.status(400).json({
          success: false,
          message: "Limit must be a positive number",
        });
      }

      const config = await adminService.setUserRateLimit(
        userId,
        parseInt(limit),
        parseInt(window || 3600),
        adminId,
      );

      res.status(200).json({
        success: true,
        message: "User rate limit set successfully",
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove user rate limit
   * DELETE /api/v1/admin/rate-limits/users/:userId
   */
  async removeUserRateLimit(req, res, next) {
    try {
      const { userId } = req.params;
      const adminId = req.user.id;

      await adminService.removeUserRateLimit(userId, adminId);

      res.status(200).json({
        success: true,
        message: "User rate limit removed successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current system health
   * GET /api/v1/admin/health
   */
  async getSystemHealth(req, res, next) {
    try {
      const health = await adminService.getSystemHealth();

      res.status(200).json({
        success: true,
        data: health,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get system health history
   * GET /api/v1/admin/health/history
   */
  async getHealthHistory(req, res, next) {
    try {
      const { hours = 24 } = req.query;
      const history = await adminService.getSystemHealthHistory(
        parseInt(hours),
      );

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all users with stats
   * GET /api/v1/admin/users
   */
  async getUsers(req, res, next) {
    try {
      const users = await adminService.getAllUsersWithStats();

      res.status(200).json({
        success: true,
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user activity details
   * GET /api/v1/admin/users/:userId
   */
  async getUserDetails(req, res, next) {
    try {
      const { userId } = req.params;
      const { days = 7 } = req.query;

      const details = await adminService.getUserActivityDetails(
        userId,
        parseInt(days),
      );

      if (!details.user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        data: details,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user status
   * PATCH /api/v1/admin/users/:userId/status
   */
  async updateUserStatus(req, res, next) {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;
      const adminId = req.user.id;

      if (typeof isActive !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "isActive must be a boolean",
        });
      }

      // Prevent self-deactivation
      if (userId === adminId && !isActive) {
        return res.status(400).json({
          success: false,
          message: "You cannot deactivate your own account",
        });
      }

      const user = await adminService.updateUserStatus(
        userId,
        isActive,
        adminId,
      );

      res.status(200).json({
        success: true,
        message: `User ${isActive ? "activated" : "deactivated"} successfully`,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user role
   * PATCH /api/v1/admin/users/:userId/role
   */
  async updateUserRole(req, res, next) {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      const adminId = req.user.id;

      // Validate role
      if (!["ADMIN", "MANAGER", "USER"].includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role. Use: ADMIN, MANAGER, or USER",
        });
      }

      // Prevent self-demotion
      if (userId === adminId && role !== "ADMIN") {
        return res.status(400).json({
          success: false,
          message: "You cannot change your own role",
        });
      }

      const user = await adminService.updateUserRole(userId, role, adminId);

      res.status(200).json({
        success: true,
        message: "User role updated successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get audit logs
   * GET /api/v1/admin/audit-logs
   */
  async getAuditLogs(req, res, next) {
    try {
      const { limit = 50 } = req.query;
      const logs = await adminService.getAuditLogs(parseInt(limit));

      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Clean old logs
   * DELETE /api/v1/admin/logs/cleanup
   */
  async cleanOldLogs(req, res, next) {
    try {
      const { daysToKeep = 90 } = req.body;
      const result = await adminService.cleanOldLogs(parseInt(daysToKeep));

      res.status(200).json({
        success: true,
        message: "Old logs cleaned successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get database metrics
   * GET /api/v1/admin/health/database
   */
  async getDatabaseMetrics(req, res, next) {
    try {
      const metrics = await adminService.getDatabaseMetrics();
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get error metrics
   * GET /api/v1/admin/health/errors
   */
  async getErrorMetrics(req, res, next) {
    try {
      const metrics = await adminService.getErrorMetrics();
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download system backup
   * GET /api/v1/admin/backup
   */

  async getBackup(req, res, next) {
    try {
      const backup = await adminService.createBackup();
      const filename = `backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;

      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );

      res.status(200).send(JSON.stringify(backup, null, 2));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Download source code backup
   * GET /api/v1/admin/backup/code
   */
  async getSourceCodeBackup(req, res, next) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `source-code-backup-${timestamp}.zip`;

      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`,
      );

      const archive = archiver("zip", {
        zlib: { level: 9 }, // Sets the compression level.
      });

      archive.on("error", function (err) {
        throw err;
      });

      // Pipe archive data to the response
      archive.pipe(res);

      // Define the root directory (assuming server/src/controllers is 3 levels deep from root)
      // Capstone/server/src/controllers -> ../../../
      // Actually, relying on relative paths might be tricky.
      // Let's assume the process runs from 'server' directory (package.json script).
      // So '..' would be the project root.
      const sourceDir = path.resolve(process.cwd(), "..");

      // Glob patterns to include/exclude
      archive.glob("**/*", {
        cwd: sourceDir,
        ignore: [
          "**/node_modules/**",
          "**/.git/**",
          "**/.env",
          "**/dist/**",
          "**/build/**",
          "**/coverage/**",
          "**/.DS_Store",
          "**/.vscode/**",
          "**/.idea/**",
          "**/tmp/**",
        ],
        dot: true, // Include dotfiles like .gitignore
      });

      await archive.finalize();
    } catch (error) {
      // If headers are already sent, we can't send a JSON error
      if (!res.headersSent) {
        next(error);
      } else {
        console.error("Error during zip streaming:", error);
      }
    }
  }
}

export default new AdminController();
