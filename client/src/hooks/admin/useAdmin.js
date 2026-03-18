import { useState, useCallback, useEffect, useRef } from "react";
import adminApi from "../../api/admin";
import { useAuth } from "../../context/AuthContext";
import webSocketService from "../../services/websocket.service";
import logger from "../../utils/logger.js";

const REALTIME_REFRESH_DEBOUNCE_MS = 1000;
const DEFAULT_API_TIME_RANGE = "24h";
const DEFAULT_HEALTH_HISTORY_HOURS = 24;
const DEFAULT_USER_ACTIVITY_LIMIT = 10;
const DEFAULT_AUDIT_LOG_LIMIT = 50;

const LEGACY_MODEL_EVENT_MAP = {
  User: ["dashboard:overview", "dashboard:users", "dashboard:user-activity"],
  Project: ["dashboard:overview"],
  Task: ["dashboard:overview"],
  RateLimitConfig: ["dashboard:rate-limits", "dashboard:user-activity"],
  EndpointRateLimit: ["dashboard:rate-limits"],
  UserRateLimit: ["dashboard:rate-limits"],
  AuditLog: ["dashboard:audit-logs"],
};

export const useAdmin = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dashboard Overview State
  const [dashboardStats, setDashboardStats] = useState(null);

  // API Monitoring State
  const [apiStats, setApiStats] = useState(null);
  const [userActivity, setUserActivity] = useState([]);
  const [userActivityMeta, setUserActivityMeta] = useState({});

  // Rate Limit State
  const [rateLimits, setRateLimits] = useState([]);
  const [rateLimitMeta, setRateLimitMeta] = useState({});
  const [endpointLimits, setEndpointLimits] = useState([]);
  const [userLimits, setUserLimits] = useState([]);
  const [availableEndpoints, setAvailableEndpoints] = useState([]);

  // System Health State
  const [systemHealth, setSystemHealth] = useState(null);
  const [healthHistory, setHealthHistory] = useState([]);

  // User Management State
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);

  // Advanced Analytics State
  const [databaseMetrics, setDatabaseMetrics] = useState(null);
  const [errorMetrics, setErrorMetrics] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(() => new Date());

  const dashboardStatsRef = useRef(null);
  const usersRef = useRef([]);
  const apiTimeRangeRef = useRef(DEFAULT_API_TIME_RANGE);
  const healthHistoryHoursRef = useRef(DEFAULT_HEALTH_HISTORY_HOURS);
  const userActivityLimitRef = useRef(DEFAULT_USER_ACTIVITY_LIMIT);
  const auditLogLimitRef = useRef(DEFAULT_AUDIT_LOG_LIMIT);
  const realtimeRefreshTimestampsRef = useRef({});

  // Check if user is admin
  const isAdmin = user?.role === "ADMIN";

  const markLastUpdated = useCallback(() => {
    setLastUpdate(new Date());
  }, []);

  const shouldRefreshDataset = useCallback((datasetKey) => {
    const now = Date.now();
    const lastRefresh =
      realtimeRefreshTimestampsRef.current[datasetKey] || 0;

    if (now - lastRefresh < REALTIME_REFRESH_DEBOUNCE_MS) {
      return false;
    }

    realtimeRefreshTimestampsRef.current[datasetKey] = now;
    return true;
  }, []);

  const getEventTypes = useCallback((payload = {}) => {
    if (typeof payload.type === "string") {
      return [payload.type];
    }

    if (
      typeof payload.model === "string" &&
      LEGACY_MODEL_EVENT_MAP[payload.model]
    ) {
      return LEGACY_MODEL_EVENT_MAP[payload.model];
    }

    return [];
  }, []);

  // ==================== DASHBOARD OVERVIEW ====================

  const fetchDashboardStats = useCallback(async () => {
    if (!isAdmin) return null;
    const shouldShowLoading = !dashboardStatsRef.current;
    if (shouldShowLoading) setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getDashboardStats();
      dashboardStatsRef.current = data.data;
      setDashboardStats(data.data);
      markLastUpdated();
      return data.data;
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch dashboard stats",
      );
      return null;
    } finally {
      if (shouldShowLoading) setLoading(false);
    }
  }, [isAdmin, markLastUpdated]);

  // ==================== API MONITORING ====================

  const fetchApiStats = useCallback(
    async (timeRange = apiTimeRangeRef.current) => {
      if (!isAdmin) return null;
      apiTimeRangeRef.current = timeRange;
      const shouldShowLoading = !apiStats;
      if (shouldShowLoading) setLoading(true);
      setError(null);
      try {
        const data = await adminApi.getApiStats(timeRange);
        setApiStats(data.data);
        markLastUpdated();
        return data.data;
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch API stats");
        return null;
      } finally {
        if (shouldShowLoading) setLoading(false);
      }
    },
    [isAdmin, markLastUpdated],
  );

  const fetchUserActivity = useCallback(
    async (limit = userActivityLimitRef.current) => {
      if (!isAdmin) return null;
      userActivityLimitRef.current = limit;
      try {
        const data = await adminApi.getUserActivity(limit);
        setUserActivity(data.data);
        setUserActivityMeta(data.meta || {});
        markLastUpdated();
        return data.data;
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch user activity",
        );
        return null;
      }
    },
    [isAdmin, markLastUpdated],
  );

  // ==================== RATE LIMIT CONFIGURATION ====================

  const fetchRateLimits = useCallback(async () => {
    if (!isAdmin) return null;
    const shouldShowLoading =
      rateLimits.length === 0 &&
      endpointLimits.length === 0 &&
      userLimits.length === 0;
    if (shouldShowLoading) setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getRateLimits();
      setRateLimits(data.data);
      setRateLimitMeta(data.meta || {});
      markLastUpdated();
      return data.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch rate limits");
      return null;
    } finally {
      if (shouldShowLoading) setLoading(false);
    }
  }, [isAdmin, markLastUpdated]);

  const updateRateLimit = useCallback(
    async (role, limit) => {
      if (!isAdmin) return null;
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.updateRateLimit(role, limit);
        await fetchRateLimits();
        return data;
      } catch (err) {
        setError(err.response?.data?.message || "Failed to update rate limit");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAdmin, fetchRateLimits],
  );

  const fetchEndpointLimits = useCallback(async () => {
    if (!isAdmin) return null;
    try {
      const data = await adminApi.getEndpointRateLimits();
      setEndpointLimits(data.data);
      markLastUpdated();
      return data.data;
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch endpoint limits",
      );
      return null;
    }
  }, [isAdmin, markLastUpdated]);

  const fetchAvailableEndpoints = useCallback(async () => {
    if (!isAdmin) return null;
    try {
      const data = await adminApi.getAvailableEndpoints();
      setAvailableEndpoints(data.data);
      markLastUpdated();
      return data.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch endpoints");
      return null;
    }
  }, [isAdmin, markLastUpdated]);

  const createEndpointLimit = useCallback(
    async (endpoint, method, limit, window) => {
      if (!isAdmin) return null;
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.createEndpointRateLimit(
          endpoint,
          method,
          limit,
          window,
        );
        await fetchEndpointLimits();
        return data;
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to create endpoint limit",
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAdmin, fetchEndpointLimits],
  );

  const updateEndpointLimit = useCallback(
    async (id, updateData) => {
      if (!isAdmin) return null;
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.updateEndpointRateLimit(id, updateData);
        await fetchEndpointLimits();
        return data;
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to update endpoint limit",
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAdmin, fetchEndpointLimits],
  );

  const deleteEndpointLimit = useCallback(
    async (id) => {
      if (!isAdmin) return null;
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.deleteEndpointRateLimit(id);
        await fetchEndpointLimits();
        return data;
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to delete endpoint limit",
        );
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAdmin, fetchEndpointLimits],
  );

  const fetchUserLimits = useCallback(async () => {
    if (!isAdmin) return null;
    try {
      const data = await adminApi.getUserRateLimits();
      setUserLimits(data.data);
      markLastUpdated();
      return data.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch user limits");
      return null;
    }
  }, [isAdmin, markLastUpdated]);

  const setUserLimit = useCallback(
    async (userId, limit, window) => {
      if (!isAdmin) return null;
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.setUserRateLimit(userId, limit, window);
        await fetchUserLimits();
        return data;
      } catch (err) {
        setError(err.response?.data?.message || "Failed to set user limit");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAdmin, fetchUserLimits],
  );

  const removeUserLimit = useCallback(
    async (userId) => {
      if (!isAdmin) return null;
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.removeUserRateLimit(userId);
        await fetchUserLimits();
        return data;
      } catch (err) {
        setError(err.response?.data?.message || "Failed to remove user limit");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAdmin, fetchUserLimits],
  );

  // ==================== SYSTEM HEALTH ====================

  const fetchSystemHealth = useCallback(async () => {
    if (!isAdmin) return null;
    const shouldShowLoading = !systemHealth;
    if (shouldShowLoading) setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getSystemHealth();
      setSystemHealth(data.data);
      markLastUpdated();
      return data.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch system health");
      return null;
    } finally {
      if (shouldShowLoading) setLoading(false);
    }
  }, [isAdmin, markLastUpdated]);

  const fetchHealthHistory = useCallback(
    async (hours = healthHistoryHoursRef.current) => {
      if (!isAdmin) return null;
      healthHistoryHoursRef.current = hours;
      try {
        const data = await adminApi.getHealthHistory(hours);
        setHealthHistory(data.data);
        markLastUpdated();
        return data.data;
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch health history",
        );
        return null;
      }
    },
    [isAdmin, markLastUpdated],
  );

  const fetchDatabaseMetrics = useCallback(async () => {
    if (!isAdmin) return null;
    try {
      const data = await adminApi.getDatabaseMetrics();
      setDatabaseMetrics(data.data);
      markLastUpdated();
      return data.data;
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch database metrics",
      );
      return null;
    }
  }, [isAdmin, markLastUpdated]);

  const fetchErrorMetrics = useCallback(async () => {
    if (!isAdmin) return null;
    try {
      const data = await adminApi.getErrorMetrics();
      setErrorMetrics(data.data);
      markLastUpdated();
      return data.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch error metrics");
      return null;
    }
  }, [isAdmin, markLastUpdated]);

  // ==================== USER MANAGEMENT ====================

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return null;
    const shouldShowLoading = usersRef.current.length === 0;
    if (shouldShowLoading) setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getUsers();
      usersRef.current = data.data;
      setUsers(data.data);
      markLastUpdated();
      return data.data;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch users");
      return null;
    } finally {
      if (shouldShowLoading) setLoading(false);
    }
  }, [isAdmin, markLastUpdated]);

  const fetchUserDetails = useCallback(
    async (userId, days = 7) => {
      if (!isAdmin) return null;
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.getUserDetails(userId, days);
        setSelectedUser(data.data);
        markLastUpdated();
        return data.data;
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch user details");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAdmin, markLastUpdated],
  );

  const updateUserStatus = useCallback(
    async (userId, isActive) => {
      if (!isAdmin) return null;
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.updateUserStatus(userId, isActive);
        await fetchUsers();
        return data;
      } catch (err) {
        setError(err.response?.data?.message || "Failed to update user status");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAdmin, fetchUsers],
  );

  const updateUserRole = useCallback(
    async (userId, role) => {
      if (!isAdmin) return null;
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.updateUserRole(userId, role);
        await fetchUsers();
        return data;
      } catch (err) {
        setError(err.response?.data?.message || "Failed to update user role");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAdmin, fetchUsers],
  );

  // ==================== AUDIT LOGS ====================

  const fetchAuditLogs = useCallback(
    async (limit = auditLogLimitRef.current) => {
      if (!isAdmin) return null;
      auditLogLimitRef.current = limit;
      const shouldShowLoading = auditLogs.length === 0;
      if (shouldShowLoading) setLoading(true);
      setError(null);
      try {
        const data = await adminApi.getAuditLogs(limit);
        setAuditLogs(data.data);
        markLastUpdated();
        return data.data;
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch audit logs");
        return null;
      } finally {
        if (shouldShowLoading) setLoading(false);
      }
    },
    [isAdmin, markLastUpdated],
  );

  // ==================== MAINTENANCE ====================

  const cleanOldLogs = useCallback(
    async (daysToKeep = 90) => {
      if (!isAdmin) return null;
      setLoading(true);
      setError(null);
      try {
        const data = await adminApi.cleanOldLogs(daysToKeep);
        return data;
      } catch (err) {
        setError(err.response?.data?.message || "Failed to clean old logs");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [isAdmin],
  );

  // ==================== BACKUP ====================

  const downloadBackup = useCallback(async () => {
    if (!isAdmin) return false;
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getBackup();

      const url = window.URL.createObjectURL(
        new Blob([JSON.stringify(response.data, null, 2)]),
      );
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let filename = `backup-${new Date().toISOString()}.json`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to download backup");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const downloadSourceCode = useCallback(async () => {
    if (!isAdmin) return false;
    setLoading(true);
    setError(null);
    try {
      const response = await adminApi.getSourceCodeBackup();

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let filename = `source-code-backup-${new Date().toISOString()}.zip`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match) filename = match[1];
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to download source code");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  const refreshRealtimeDataset = useCallback(
    (eventType) => {
      switch (eventType) {
        case "dashboard:overview":
          if (!shouldRefreshDataset("overview")) return;
          void fetchDashboardStats();
          return;
        case "dashboard:api-stats":
          if (!shouldRefreshDataset("api-stats")) return;
          void fetchApiStats(apiTimeRangeRef.current);
          return;
        case "dashboard:user-activity":
          if (!shouldRefreshDataset("user-activity")) return;
          void fetchUserActivity(userActivityLimitRef.current);
          return;
        case "dashboard:rate-limits":
          if (!shouldRefreshDataset("rate-limits")) return;
          void Promise.all([
            fetchRateLimits(),
            fetchEndpointLimits(),
            fetchUserLimits(),
          ]);
          return;
        case "dashboard:health":
          if (!shouldRefreshDataset("health")) return;
          void Promise.all([
            fetchSystemHealth(),
            fetchHealthHistory(healthHistoryHoursRef.current),
            fetchDatabaseMetrics(),
            fetchErrorMetrics(),
          ]);
          return;
        case "dashboard:audit-logs":
          if (!shouldRefreshDataset("audit-logs")) return;
          void fetchAuditLogs(auditLogLimitRef.current);
          return;
        case "dashboard:users":
          if (!shouldRefreshDataset("users")) return;
          void fetchUsers();
          return;
        default:
          return;
      }
    },
    [
      fetchApiStats,
      fetchAuditLogs,
      fetchDashboardStats,
      fetchDatabaseMetrics,
      fetchEndpointLimits,
      fetchErrorMetrics,
      fetchHealthHistory,
      fetchRateLimits,
      fetchSystemHealth,
      fetchUserActivity,
      fetchUserLimits,
      fetchUsers,
      shouldRefreshDataset,
    ],
  );

  // Realtime updates
  useEffect(() => {
    if (!isAdmin) return undefined;

    const handleAdminUpdate = (payload = {}) => {
      const eventTypes = getEventTypes(payload);

      if (eventTypes.length === 0) {
        return;
      }

      logger.info(
        `🛡️ Admin update received: ${
          payload.type || `${payload.model} (${payload.operation})`
        }`,
      );

      eventTypes.forEach((eventType) => {
        refreshRealtimeDataset(eventType);
      });
    };

    webSocketService.onAdminUpdate(handleAdminUpdate);

    return () => {
      webSocketService.offAdminUpdate(handleAdminUpdate);
    };
  }, [getEventTypes, isAdmin, refreshRealtimeDataset]);

  return {
    // State
    loading,
    error,
    isAdmin,
    lastUpdate,

    // Dashboard Overview
    dashboardStats,
    fetchDashboardStats,

    // API Monitoring
    apiStats,
    userActivity,
    userActivityMeta,
    fetchApiStats,
    fetchUserActivity,

    // Rate Limiting
    rateLimits,
    rateLimitMeta,
    endpointLimits,
    userLimits,
    availableEndpoints,
    fetchRateLimits,
    updateRateLimit,
    fetchEndpointLimits,
    createEndpointLimit,
    updateEndpointLimit,
    deleteEndpointLimit,
    fetchAvailableEndpoints,
    fetchUserLimits,
    setUserLimit,
    removeUserLimit,

    // System Health
    systemHealth,
    healthHistory,
    fetchSystemHealth,
    fetchHealthHistory,
    databaseMetrics,
    errorMetrics,
    fetchDatabaseMetrics,
    fetchErrorMetrics,

    // User Management
    users,
    selectedUser,
    setSelectedUser,
    fetchUsers,
    fetchUserDetails,
    updateUserStatus,
    updateUserRole,

    // Audit Logs
    auditLogs,
    fetchAuditLogs,

    // Maintenance
    cleanOldLogs,

    // Backup
    downloadBackup,
    downloadSourceCode,
  };
};
