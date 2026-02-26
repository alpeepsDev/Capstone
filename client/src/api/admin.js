import api from "./index";

const adminApi = {
  // Dashboard Overview

  getDashboardStats: async () => {
    const response = await api.get("/admin/dashboard-stats");
    return response.data;
  },

  // API Monitoring

  getApiStats: async (timeRange = "24h") => {
    const response = await api.get(`/admin/stats?timeRange=${timeRange}`);
    return response.data;
  },

  getUserActivity: async (limit = 10) => {
    const response = await api.get(`/admin/stats/users?limit=${limit}`);
    return response.data;
  },

  // Rate Limit Configuration

  getRateLimits: async () => {
    const response = await api.get("/admin/rate-limits");
    return response.data;
  },

  updateRateLimit: async (role, limit) => {
    const response = await api.put(`/admin/rate-limits/${role}`, { limit });
    return response.data;
  },

  getEndpointRateLimits: async () => {
    const response = await api.get("/admin/rate-limits/endpoints");
    return response.data;
  },

  getAvailableEndpoints: async () => {
    const response = await api.get("/admin/endpoints");
    return response.data;
  },

  createEndpointRateLimit: async (endpoint, method, limit, window) => {
    const response = await api.post("/admin/rate-limits/endpoints", {
      endpoint,
      method,
      limit,
      window,
    });
    return response.data;
  },

  updateEndpointRateLimit: async (id, data) => {
    const response = await api.put(`/admin/rate-limits/endpoints/${id}`, data);
    return response.data;
  },

  deleteEndpointRateLimit: async (id) => {
    const response = await api.delete(`/admin/rate-limits/endpoints/${id}`);
    return response.data;
  },

  getUserRateLimits: async () => {
    const response = await api.get("/admin/rate-limits/users");
    return response.data;
  },

  setUserRateLimit: async (userId, limit, window) => {
    const response = await api.post(`/admin/rate-limits/users/${userId}`, {
      limit,
      window,
    });
    return response.data;
  },

  removeUserRateLimit: async (userId) => {
    const response = await api.delete(`/admin/rate-limits/users/${userId}`);
    return response.data;
  },

  // System Health

  getSystemHealth: async () => {
    const response = await api.get("/admin/health");
    return response.data;
  },

  getHealthHistory: async (hours = 24) => {
    const response = await api.get(`/admin/health/history?hours=${hours}`);
    return response.data;
  },

  getDatabaseMetrics: async () => {
    const response = await api.get("/admin/health/database");
    return response.data;
  },

  getErrorMetrics: async () => {
    const response = await api.get("/admin/health/errors");
    return response.data;
  },

  // User Management

  getUsers: async () => {
    const response = await api.get("/admin/users");
    return response.data;
  },

  getUserDetails: async (userId, days = 7) => {
    const response = await api.get(`/admin/users/${userId}?days=${days}`);
    return response.data;
  },

  updateUserStatus: async (userId, isActive) => {
    const response = await api.patch(`/admin/users/${userId}/status`, {
      isActive,
    });
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await api.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  // Audit Logs

  getAuditLogs: async (limit = 50) => {
    const response = await api.get(`/admin/audit-logs?limit=${limit}`);
    return response.data;
  },

  // Maintenance

  cleanOldLogs: async (daysToKeep = 90) => {
    const response = await api.delete("/admin/logs/cleanup", {
      data: { daysToKeep },
    });
    return response.data;
  },

  // Backup

  getBackup: async () => {
    // Return the response object directly to handle blob/headers
    const response = await api.get("/admin/backup", {
      responseType: "json", // Although we return JSON, axios handles it.
    });
    return response;
  },

  getSourceCodeBackup: async () => {
    const response = await api.get("/admin/backup/code", {
      responseType: "blob", // Important for zip files
    });
    return response;
  },
};

export default adminApi;
