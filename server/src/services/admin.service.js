import prisma from "../config/database.js";
import os from "os";

class AdminService {
  // ==================== API MONITORING ====================

  /**
   * Get API usage statistics
   */
  async getApiStatistics(timeRange = "24h") {
    const timeRanges = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };

    const startTime = new Date(Date.now() - timeRanges[timeRange]);

    // Total requests
    const totalRequests = await prisma.apiLog.count({
      where: {
        timestamp: { gte: startTime },
      },
    });

    // Requests today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const requestsToday = await prisma.apiLog.count({
      where: {
        timestamp: { gte: todayStart },
      },
    });

    // Average response time
    const avgResponseTime = await prisma.apiLog.aggregate({
      where: {
        timestamp: { gte: startTime },
      },
      _avg: {
        responseTime: true,
      },
    });

    // Error rate
    const errorCount = await prisma.apiLog.count({
      where: {
        timestamp: { gte: startTime },
        statusCode: { gte: 400 },
      },
    });
    const errorRate =
      totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

    // Top endpoints
    const topEndpoints = await prisma.apiLog.groupBy({
      by: ["endpoint", "method"],
      where: {
        timestamp: { gte: startTime },
      },
      _count: {
        id: true,
      },
      _avg: {
        responseTime: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 10,
    });

    // Requests per hour (for chart)
    const requestsPerHour = await this.getRequestsPerHour(startTime);

    return {
      totalRequests,
      requestsToday,
      averageResponseTime: Math.round(avgResponseTime._avg.responseTime || 0),
      errorRate: parseFloat(errorRate.toFixed(2)),
      topEndpoints: topEndpoints.map((ep) => ({
        endpoint: `${ep.method} ${ep.endpoint}`,
        count: ep._count.id,
        avgTime: Math.round(ep._avg.responseTime || 0),
      })),
      requestsPerHour,
    };
  }

  /**
   * Get requests grouped by hour
   */
  async getRequestsPerHour(startTime) {
    const logs = await prisma.apiLog.findMany({
      where: {
        timestamp: { gte: startTime },
      },
      select: {
        timestamp: true,
      },
    });

    // Group by hour
    const hourlyData = {};
    logs.forEach((log) => {
      const hour = new Date(log.timestamp).setMinutes(0, 0, 0);
      hourlyData[hour] = (hourlyData[hour] || 0) + 1;
    });

    return Object.entries(hourlyData)
      .map(([timestamp, count]) => ({
        timestamp: parseInt(timestamp),
        count,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get user activity statistics
   */
  async getUserActivity(limit = 10) {
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: {
            apiLogs: {
              where: {
                timestamp: {
                  gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
                },
              },
            },
          },
        },
      },
      orderBy: {
        apiLogs: {
          _count: "desc",
        },
      },
      take: limit,
    });

    // Get rate limit configs
    const rateLimitConfigs = await prisma.rateLimitConfig.findMany();
    const configMap = {};
    rateLimitConfigs.forEach((config) => {
      configMap[config.role] = config.limit;
    });

    return users.map((user) => ({
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      requestCount: user._count.apiLogs,
      rateLimit: configMap[user.role] || 200,
      percentage: (
        (user._count.apiLogs / (configMap[user.role] || 200)) *
        100
      ).toFixed(1),
    }));
  }

  /**
   * Log API request
   */
  async logApiRequest(data) {
    return await prisma.apiLog.create({
      data: {
        userId: data.userId || null,
        username: data.username || null,
        endpoint: data.endpoint,
        method: data.method,
        statusCode: data.statusCode,
        responseTime: data.responseTime,
        userAgent: data.userAgent || null,
        ipAddress: data.ipAddress || null,
      },
    });
  }

  // ==================== RATE LIMIT CONFIGURATION ====================

  /**
   * Get all rate limit configurations
   */
  async getRateLimitConfigs() {
    const configs = await prisma.rateLimitConfig.findMany({
      orderBy: {
        role: "asc",
      },
    });

    // Get current usage for each role
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const usagePromises = configs.map(async (config) => {
      const usage = await prisma.apiLog.count({
        where: {
          user: {
            role: config.role,
          },
          timestamp: {
            gte: oneHourAgo,
          },
        },
      });

      return {
        ...config,
        currentUsage: usage,
        percentage: ((usage / config.limit) * 100).toFixed(1),
      };
    });

    return await Promise.all(usagePromises);
  }

  /**
   * Update rate limit configuration
   */
  async updateRateLimitConfig(role, limit, adminId) {
    const config = await prisma.rateLimitConfig.upsert({
      where: { role },
      update: { limit },
      create: { role, limit },
    });

    // Log audit
    await this.logAuditAction({
      adminId,
      action: "RATE_LIMIT_UPDATED",
      targetId: config.id,
      details: {
        role,
        newLimit: limit,
      },
    });

    return config;
  }

  /**
   * Get endpoint-specific rate limits
   */
  async getEndpointRateLimits() {
    const endpoints = await prisma.endpointRateLimit.findMany({
      orderBy: {
        endpoint: "asc",
      },
    });

    // Get current usage for each endpoint
    const usagePromises = endpoints.map(async (endpointConfig) => {
      const windowMs = endpointConfig.window * 1000;
      const windowStart = new Date(Date.now() - windowMs);

      const whereClause = {
        endpoint: endpointConfig.endpoint,
        timestamp: { gte: windowStart },
      };

      // Add method filter if not wildcard
      if (endpointConfig.method !== "*") {
        whereClause.method = endpointConfig.method;
      }

      const usage = await prisma.apiLog.count({ where: whereClause });

      return {
        ...endpointConfig,
        currentUsage: usage,
        percentage: ((usage / endpointConfig.limit) * 100).toFixed(1),
      };
    });

    return await Promise.all(usagePromises);
  }

  /**
   * Create endpoint rate limit
   */
  async createEndpointRateLimit(endpoint, method, limit, window, adminId) {
    const config = await prisma.endpointRateLimit.create({
      data: {
        endpoint,
        method,
        limit,
        window,
      },
    });

    await this.logAuditAction({
      adminId,
      action: "ENDPOINT_RATE_LIMIT_CREATED",
      targetId: config.id,
      details: { endpoint, method, limit, window },
    });

    return config;
  }

  /**
   * Update endpoint rate limit
   */
  async updateEndpointRateLimit(id, data, adminId) {
    const config = await prisma.endpointRateLimit.update({
      where: { id },
      data,
    });

    await this.logAuditAction({
      adminId,
      action: "ENDPOINT_RATE_LIMIT_UPDATED",
      targetId: id,
      details: data,
    });

    return config;
  }

  /**
   * Delete endpoint rate limit
   */
  async deleteEndpointRateLimit(id, adminId) {
    const config = await prisma.endpointRateLimit.delete({
      where: { id },
    });

    await this.logAuditAction({
      adminId,
      action: "ENDPOINT_RATE_LIMIT_DELETED",
      targetId: id,
      details: { endpoint: config.endpoint, method: config.method },
    });

    return config;
  }

  /**
   * Get user-specific rate limits
   */
  async getUserRateLimits() {
    const limits = await prisma.userRateLimit.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return limits;
  }

  /**
   * Set user rate limit
   */
  async setUserRateLimit(userId, limit, window, adminId) {
    const config = await prisma.userRateLimit.upsert({
      where: { userId },
      update: { limit, window },
      create: { userId, limit, window },
    });

    await this.logAuditAction({
      adminId,
      action: "USER_RATE_LIMIT_SET",
      targetId: userId,
      details: { limit, window },
    });

    return config;
  }

  /**
   * Remove user rate limit
   */
  async removeUserRateLimit(userId, adminId) {
    const config = await prisma.userRateLimit.delete({
      where: { userId },
    });

    await this.logAuditAction({
      adminId,
      action: "USER_RATE_LIMIT_REMOVED",
      targetId: userId,
    });

    return config;
  }

  // ==================== SYSTEM HEALTH MONITORING ====================

  /**
   * Get current system health metrics
   */
  async getSystemHealth() {
    // Server metrics
    const cpuUsage = os.loadavg()[0];
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;
    const uptime = os.uptime();

    // Database metrics
    const dbMetrics = await this.getDatabaseMetrics();

    // Error metrics
    const errorMetrics = await this.getErrorMetrics();

    // Log to database
    await prisma.systemHealthLog.create({
      data: {
        cpuUsage,
        memoryUsage,
        totalMemory: totalMemory / (1024 * 1024 * 1024), // GB
        freeMemory: freeMemory / (1024 * 1024 * 1024), // GB
        uptime,
        activeConnections: dbMetrics.connectionPool?.active || 0,
      },
    });

    return {
      server: {
        cpu: parseFloat(cpuUsage.toFixed(2)),
        memory: parseFloat(memoryUsage.toFixed(2)),
        totalMemory: parseFloat(
          (totalMemory / (1024 * 1024 * 1024)).toFixed(2)
        ),
        freeMemory: parseFloat((freeMemory / (1024 * 1024 * 1024)).toFixed(2)),
        uptime: this.formatUptime(uptime),
      },
      database: dbMetrics,
      errors: errorMetrics,
      status: this.getOverallStatus(cpuUsage, memoryUsage, errorMetrics),
    };
  }

  /**
   * Get database metrics
   */
  async getDatabaseMetrics() {
    try {
      // Test connection
      await prisma.$queryRaw`SELECT 1`;

      // Get connection pool info (Prisma doesn't expose this directly)
      // We'll estimate based on configuration
      const poolSize = 10; // Default Prisma pool size
      const activeConnections = 3; // Estimate (you can track this with middleware)

      // Average query time (last 100 queries)
      const recentLogs = await prisma.apiLog.findMany({
        take: 100,
        orderBy: { timestamp: "desc" },
        select: { responseTime: true },
      });

      const avgQueryTime =
        recentLogs.length > 0
          ? recentLogs.reduce((sum, log) => sum + log.responseTime, 0) /
            recentLogs.length
          : 0;

      return {
        status: "healthy",
        connectionPool: {
          total: poolSize,
          active: activeConnections,
          idle: poolSize - activeConnections,
        },
        avgQueryTime: Math.round(avgQueryTime),
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
      };
    }
  }

  /**
   * Get error metrics
   */
  async getErrorMetrics() {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const [errorsLast24h, errorsLastHour, criticalErrors] = await Promise.all([
      prisma.apiLog.count({
        where: {
          statusCode: { gte: 400 },
          timestamp: { gte: oneDayAgo },
        },
      }),
      prisma.apiLog.count({
        where: {
          statusCode: { gte: 400 },
          timestamp: { gte: oneHourAgo },
        },
      }),
      prisma.apiLog.count({
        where: {
          statusCode: { gte: 500 },
          timestamp: { gte: oneDayAgo },
        },
      }),
    ]);

    // Get most common errors
    const commonErrors = await prisma.apiLog.groupBy({
      by: ["statusCode", "endpoint"],
      where: {
        statusCode: { gte: 400 },
        timestamp: { gte: oneDayAgo },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: "desc",
        },
      },
      take: 5,
    });

    return {
      last24h: errorsLast24h,
      lastHour: errorsLastHour,
      critical: criticalErrors,
      commonErrors: commonErrors.map((err) => ({
        statusCode: err.statusCode,
        endpoint: err.endpoint,
        count: err._count.id,
      })),
    };
  }

  /**
   * Get system health history
   */
  async getSystemHealthHistory(hours = 24) {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const logs = await prisma.systemHealthLog.findMany({
      where: {
        timestamp: { gte: startTime },
      },
      orderBy: {
        timestamp: "asc",
      },
    });

    return logs.map((log) => ({
      timestamp: log.timestamp.getTime(),
      cpu: parseFloat(log.cpuUsage.toFixed(2)),
      memory: parseFloat(log.memoryUsage.toFixed(2)),
      activeConnections: log.activeConnections,
    }));
  }

  /**
   * Determine overall system status
   */
  getOverallStatus(cpu, memory, errors) {
    // CPU load average is per core, so normalize it (values can be 0-1+ per core)
    // Memory is a percentage (0-100)
    const cpuPercent = cpu * 100; // Convert load average to approximate percentage

    if (memory > 90 || cpuPercent > 80 || errors.critical > 10) {
      return "critical";
    } else if (memory > 75 || cpuPercent > 60 || errors.critical > 5) {
      return "warning";
    }
    return "healthy";
  }

  /**
   * Format uptime in human-readable format
   */
  formatUptime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }

  // ==================== USER ACCOUNT MANAGEMENT ====================

  /**
   * Get all users with activity stats
   */
  async getAllUsersWithStats() {
    const users = await prisma.user.findMany({
      include: {
        _count: {
          select: {
            apiLogs: {
              where: {
                timestamp: {
                  gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
                },
              },
            },
            managedProjects: true,
            projectMemberships: true,
            assignedTasks: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return users.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      stats: {
        apiRequests: user._count.apiLogs,
        managedProjects: user._count.managedProjects,
        projectMemberships: user._count.projectMemberships,
        assignedTasks: user._count.assignedTasks,
      },
    }));
  }

  /**
   * Update user status (activate/deactivate)
   */
  async updateUserStatus(userId, isActive, adminId) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    // Log audit
    await this.logAuditAction({
      adminId,
      action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      targetId: userId,
      details: {
        username: user.username,
        email: user.email,
      },
    });

    return user;
  }

  /**
   * Update user role
   */
  async updateUserRole(userId, newRole, adminId) {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    // Log audit
    await this.logAuditAction({
      adminId,
      action: "USER_ROLE_CHANGED",
      targetId: userId,
      details: {
        username: user.username,
        newRole,
      },
    });

    return user;
  }

  /**
   * Get user activity details
   */
  async getUserActivityDetails(userId, days = 7) {
    const startTime = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [user, apiLogs, recentActivity] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: {
              managedProjects: true,
              projectMemberships: true,
              assignedTasks: true,
            },
          },
        },
      }),
      prisma.apiLog.findMany({
        where: {
          userId,
          timestamp: { gte: startTime },
        },
        orderBy: { timestamp: "desc" },
      }),
      prisma.apiLog.groupBy({
        by: ["endpoint", "method"],
        where: {
          userId,
          timestamp: { gte: startTime },
        },
        _count: { id: true },
        _avg: { responseTime: true },
        orderBy: {
          _count: { id: "desc" },
        },
        take: 10,
      }),
    ]);

    // Group requests by day
    const requestsByDay = {};
    apiLogs.forEach((log) => {
      const day = new Date(log.timestamp).toDateString();
      requestsByDay[day] = (requestsByDay[day] || 0) + 1;
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
      },
      stats: {
        totalRequests: apiLogs.length,
        averageRequestsPerDay: (apiLogs.length / days).toFixed(1),
        managedProjects: user._count.managedProjects,
        projectMemberships: user._count.projectMemberships,
        assignedTasks: user._count.assignedTasks,
      },
      requestsByDay: Object.entries(requestsByDay).map(([day, count]) => ({
        day,
        count,
      })),
      topEndpoints: recentActivity.map((ep) => ({
        endpoint: `${ep.method} ${ep.endpoint}`,
        count: ep._count.id,
        avgTime: Math.round(ep._avg.responseTime || 0),
      })),
    };
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(limit = 50) {
    return await prisma.auditLog.findMany({
      take: limit,
      orderBy: { timestamp: "desc" },
      include: {
        admin: {
          select: {
            username: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Log audit action
   */
  async logAuditAction(data) {
    return await prisma.auditLog.create({
      data: {
        adminId: data.adminId,
        action: data.action,
        targetId: data.targetId || null,
        details: data.details || {},
      },
    });
  }

  // ==================== CLEANUP ====================

  /**
   * Clean old logs (should be run periodically)
   */
  async cleanOldLogs(daysToKeep = 90) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);

    const [deletedApiLogs, deletedHealthLogs] = await Promise.all([
      prisma.apiLog.deleteMany({
        where: {
          timestamp: { lt: cutoffDate },
        },
      }),
      prisma.systemHealthLog.deleteMany({
        where: {
          timestamp: { lt: cutoffDate },
        },
      }),
    ]);

    return {
      deletedApiLogs: deletedApiLogs.count,
      deletedHealthLogs: deletedHealthLogs.count,
    };
  }
}

export default new AdminService();
