import { useState, useEffect } from "react";
import { useAdmin } from "../../hooks/admin/useAdmin";
import { useTheme } from "../../context";
import { useAuth } from "../../context/AuthContext";
import {
  Activity,
  Users,
  Settings,
  TrendingUp,
  Shield,
  ChartNoAxesCombined,
  RefreshCw,
  Sun,
  Moon,
  Plus,
  Edit,
  Trash2,
  ArrowRight,
  FileText,
  Eye,
  UserCheck,
  UserX,
  ChevronDown,
  X,
  Database,
  AlertTriangle,
  BarChart3,
  Clock,
  Cpu,
  HardDrive,
  Trash,
} from "lucide-react";
import RateLimitConfigModal from "../modals/RateLimitConfigModal";
import Button from "../ui/Button";

const VIEW_TO_TAB = {
  dashboard: "overview",
  "admin-monitoring": "monitoring",
  "admin-ratelimits": "ratelimits",
  "admin-users": "users",
  "admin-auditlogs": "auditlogs",
  "admin-backup": "backup",
};

const TAB_TO_VIEW = {
  overview: "dashboard",
  monitoring: "admin-monitoring",
  ratelimits: "admin-ratelimits",
  users: "admin-users",
  auditlogs: "admin-auditlogs",
  backup: "admin-backup",
};

const ROLES = ["ADMIN", "MANAGER", "MODERATOR", "USER"];

// Helper: format relative time
const timeAgo = (dateStr) => {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const OverviewSkeleton = ({ isDark }) => (
  <div className="animate-pulse space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`rounded-xl border p-6 ${isDark ? "bg-gray-800/40 border-gray-700/50" : "bg-white border-gray-100"}`}
        >
          <div className="flex justify-between mb-4">
            <div
              className={`rounded-lg w-12 h-12 ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
            ></div>
            <div
              className={`h-4 w-16 rounded mt-1 ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
            ></div>
          </div>
          <div
            className={`h-4 w-24 mb-2 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
          ></div>
          <div
            className={`h-8 w-16 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
          ></div>
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div
        className={`rounded-xl border p-6 h-80 ${isDark ? "bg-gray-800/40 border-gray-700/50" : "bg-white border-gray-100"}`}
      >
        <div
          className={`h-6 w-32 mb-6 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-12 w-full rounded-lg ${isDark ? "bg-gray-700/50" : "bg-gray-100"}`}
            ></div>
          ))}
        </div>
      </div>
      <div
        className={`rounded-xl border p-6 h-80 ${isDark ? "bg-gray-800/40 border-gray-700/50" : "bg-white border-gray-100"}`}
      >
        <div
          className={`h-6 w-40 mb-6 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
        <div className="space-y-5 mt-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <div className="flex items-center gap-3 w-1/2">
                <div
                  className={`w-8 h-8 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                ></div>
                <div
                  className={`h-4 w-2/3 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                ></div>
              </div>
              <div
                className={`h-6 w-16 rounded-full border ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-200 border-gray-300"}`}
              ></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const ApiMonitoringSkeleton = ({ isDark }) => (
  <div className="animate-pulse space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div
        className={`rounded-xl border p-6 h-80 ${isDark ? "bg-gray-800/40 border-gray-700/50" : "bg-white border-gray-100"}`}
      >
        <div
          className={`h-6 w-48 mb-6 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
        <div className="flex items-end justify-center gap-2 h-48 mt-4">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className={`w-12 rounded-t-md ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
              style={{ height: `${Math.random() * 60 + 20}%` }}
            ></div>
          ))}
        </div>
      </div>
      <div
        className={`rounded-xl border p-6 h-80 ${isDark ? "bg-gray-800/40 border-gray-700/50" : "bg-white border-gray-100"}`}
      >
        <div
          className={`h-6 w-40 mb-6 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-10 w-full rounded-md ${isDark ? "bg-gray-700/50" : "bg-gray-100"}`}
            ></div>
          ))}
        </div>
      </div>
    </div>
    <div
      className={`rounded-xl border p-6 ${isDark ? "bg-gray-800/40 border-gray-700/50" : "bg-white border-gray-100"}`}
    >
      <div
        className={`h-6 w-32 mb-6 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
      ></div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-12 w-full rounded-md ${isDark ? "bg-gray-700/30" : "bg-gray-50"}`}
          ></div>
        ))}
      </div>
    </div>
  </div>
);

const UsersSkeleton = ({ isDark }) => (
  <div className="animate-pulse">
    <div
      className={`rounded-xl border overflow-hidden ${isDark ? "bg-gray-800/40 border-gray-700/50" : "bg-white border-gray-100"}`}
    >
      <div
        className={`h-12 w-full border-b ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}
      ></div>
      <div className="p-0">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className={`flex items-center justify-between p-4 border-b ${isDark ? "border-gray-700/50" : "border-gray-100"}`}
          >
            <div className="flex items-center w-1/3 gap-3">
              <div
                className={`w-8 h-8 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
              ></div>
              <div
                className={`h-4 w-32 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
              ></div>
            </div>
            <div
              className={`h-4 w-40 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
            ></div>
            <div
              className={`h-8 w-24 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
            ></div>
            <div
              className={`h-6 w-16 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
            ></div>
            <div
              className={`h-8 w-8 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
            ></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const RateLimitsSkeleton = ({ isDark }) => (
  <div className="animate-pulse space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={`rounded-xl border p-6 ${isDark ? "bg-gray-800/40 border-gray-700/50" : "bg-white border-gray-100"}`}
        >
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-2">
              <div
                className={`h-5 w-24 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
              ></div>
              <div
                className={`h-3 w-16 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
              ></div>
            </div>
            <div
              className={`h-8 w-8 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
            ></div>
          </div>
          <div
            className={`h-8 w-20 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
          ></div>
        </div>
      ))}
    </div>
    <div
      className={`rounded-xl border p-6 ${isDark ? "bg-gray-800/40 border-gray-700/50" : "bg-white border-gray-100"}`}
    >
      <div className="flex justify-between mb-6">
        <div
          className={`h-6 w-48 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
        <div
          className={`h-9 w-32 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-16 w-full rounded-xl ${isDark ? "bg-gray-700/40" : "bg-gray-50"}`}
          ></div>
        ))}
      </div>
    </div>
  </div>
);

const AuditLogsSkeleton = ({ isDark }) => (
  <div className="animate-pulse">
    <div
      className={`rounded-xl border ${isDark ? "bg-gray-800/40 border-gray-700/50" : "bg-white border-gray-100"}`}
    >
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between">
        <div
          className={`h-6 w-32 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
        <div
          className={`h-9 w-32 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
        ></div>
      </div>
      <div className="p-0">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div
            key={i}
            className={`flex items-center p-4 border-b ${isDark ? "border-gray-700/50" : "border-gray-100"}`}
          >
            <div
              className={`h-4 w-24 rounded mr-6 ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
            ></div>
            <div
              className={`h-4 w-32 rounded mr-6 ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
            ></div>
            <div
              className={`h-6 w-24 rounded-full mr-6 ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
            ></div>
            <div
              className={`h-4 w-32 rounded mr-6 ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
            ></div>
            <div
              className={`h-4 w-48 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
            ></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const BackupSkeleton = ({ isDark }) => (
  <div className="animate-pulse space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[1, 2].map((i) => (
        <div
          key={i}
          className={`rounded-xl border p-6 flex items-center justify-between ${isDark ? "bg-gray-800/40 border-gray-700/50" : "bg-white border-gray-100"}`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
            ></div>
            <div className="space-y-2">
              <div
                className={`h-5 w-32 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
              ></div>
              <div
                className={`h-4 w-48 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
              ></div>
            </div>
          </div>
          <div
            className={`h-10 w-24 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
          ></div>
        </div>
      ))}
    </div>
    <div
      className={`rounded-xl border p-6 ${isDark ? "bg-gray-800/40 border-gray-700/50" : "bg-white border-gray-100"}`}
    >
      <div
        className={`h-6 w-48 mb-6 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
      ></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-24 rounded-xl ${isDark ? "bg-gray-700/50" : "bg-gray-100"}`}
          ></div>
        ))}
      </div>
    </div>
  </div>
);

const AdminDashboard = ({ activeView, onViewChange }) => {
  const { isDark, toggleTheme } = useTheme();
  const { user: currentUser } = useAuth();
  const {
    isAdmin,
    loading,
    error,
    dashboardStats,
    fetchDashboardStats,
    apiStats,
    systemHealth,
    healthHistory,
    users,
    rateLimits,
    endpointLimits,
    userLimits,
    userActivity,
    selectedUser,
    setSelectedUser,
    auditLogs,
    databaseMetrics,
    errorMetrics,
    fetchApiStats,
    fetchSystemHealth,
    fetchHealthHistory,
    fetchUsers,
    fetchRateLimits,
    fetchEndpointLimits,
    fetchUserLimits,
    fetchUserActivity,
    fetchUserDetails,
    fetchAuditLogs,
    fetchDatabaseMetrics,
    fetchErrorMetrics,
    updateRateLimit,
    updateUserStatus,
    updateUserRole,
    createEndpointLimit,
    updateEndpointLimit,
    deleteEndpointLimit,
    setUserLimit,
    removeUserLimit,
    cleanOldLogs,
    availableEndpoints,
    fetchAvailableEndpoints,
    downloadBackup,
    downloadSourceCode,
  } = useAdmin();

  const [activeTab, setActiveTab] = useState("overview");
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(null);
  const [cleanupDays, setCleanupDays] = useState(90);
  const [cleanupLoading, setCleanupLoading] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    confirmText: "Confirm",
    cancelText: "Cancel",
    isDestructive: false,
  });

  // Rate Limit Config Modal State
  const [configModal, setConfigModal] = useState({
    isOpen: false,
    type: null, // 'role', 'user', or 'endpoint'
    data: null,
  });

  useEffect(() => {
    const nextTab = VIEW_TO_TAB[activeView];
    if (nextTab && nextTab !== activeTab) {
      setActiveTab(nextTab);
    }
  }, [activeView, activeTab]);

  // Load data on mount
  useEffect(() => {
    if (isAdmin) {
      fetchDashboardStats();
      fetchApiStats();
      fetchSystemHealth();
      fetchHealthHistory();
      fetchUsers();
      fetchRateLimits();
      fetchEndpointLimits();
      fetchUserLimits();
      fetchUserActivity();
      fetchAvailableEndpoints();
      fetchAuditLogs();
      fetchDatabaseMetrics();
      fetchErrorMetrics();
    }
  }, [
    isAdmin,
    fetchDashboardStats,
    fetchApiStats,
    fetchSystemHealth,
    fetchHealthHistory,
    fetchUsers,
    fetchRateLimits,
    fetchEndpointLimits,
    fetchUserLimits,
    fetchUserActivity,
    fetchAvailableEndpoints,
    fetchAuditLogs,
    fetchDatabaseMetrics,
    fetchErrorMetrics,
  ]);

  // Auto-refresh overview tab every 30 seconds
  useEffect(() => {
    if (isAdmin && activeTab === "overview") {
      // Note: Data is now also updated in real-time via WebSockets in useAdmin.js
      const interval = setInterval(() => {
        fetchApiStats();
        fetchSystemHealth();
        setLastUpdate(new Date());
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [isAdmin, activeTab, fetchApiStats, fetchSystemHealth]);

  // Auto-refresh monitoring tab every 30 seconds
  useEffect(() => {
    if (isAdmin && activeTab === "monitoring") {
      const interval = setInterval(() => {
        fetchUserActivity();
        fetchApiStats();
        setLastUpdate(new Date());
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [isAdmin, activeTab, fetchUserActivity, fetchApiStats]);

  // Auto-refresh rate limits tab every 30 seconds
  useEffect(() => {
    if (isAdmin && activeTab === "ratelimits") {
      const interval = setInterval(() => {
        fetchRateLimits();
        fetchEndpointLimits();
        fetchUserLimits();
        setLastUpdate(new Date());
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [
    isAdmin,
    activeTab,
    fetchRateLimits,
    fetchEndpointLimits,
    fetchUserLimits,
  ]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchApiStats(),
        fetchSystemHealth(),
        fetchHealthHistory(),
        fetchUsers(),
        fetchRateLimits(),
        fetchEndpointLimits(),
        fetchUserLimits(),
        fetchUserActivity(),
        fetchAuditLogs(),
        fetchDatabaseMetrics(),
        fetchErrorMetrics(),
      ]);
      setLastUpdate(new Date());
    } finally {
      setRefreshing(false);
    }
  };

  // User management handlers
  const handleToggleUserStatus = async (userId, currentStatus) => {
    if (userId === currentUser?.id) return;
    setConfirmDialog({
      isOpen: true,
      title: currentStatus ? "Deactivate User" : "Activate User",
      message: `Are you sure you want to ${currentStatus ? "deactivate" : "activate"} this user?`,
      confirmText: currentStatus ? "Deactivate" : "Activate",
      isDestructive: currentStatus,
      onConfirm: async () => {
        try {
          await updateUserStatus(userId, !currentStatus);
        } catch (err) {
          console.error("Failed to update user status:", err);
        }
      },
    });
  };

  const handleRoleChange = async (userId, newRole) => {
    if (userId === currentUser?.id) return;
    setConfirmDialog({
      isOpen: true,
      title: "Change User Role",
      message: `Are you sure you want to change this user's role to ${newRole}?`,
      confirmText: "Change Role",
      isDestructive: false,
      onConfirm: async () => {
        try {
          await updateUserRole(userId, newRole);
          setRoleDropdownOpen(null);
        } catch (err) {
          console.error("Failed to update user role:", err);
        }
      },
    });
  };

  const handleViewUserDetails = (userObj) => {
    // 1. Instantly set the basic user details to open the modal without waiting
    setSelectedUser({
      user: userObj,
      summary: null,
      recentTasks: null,
      recentApiActivity: null,
    });
    setUserDetailOpen(true);

    // 2. Fetch the extra details (summary, tasks, api activity) in background
    fetchUserDetails(userObj.id, 7).catch((err) => {
      console.error("Failed to fetch user details:", err);
    });
  };

  const handleCleanLogs = async () => {
    setConfirmDialog({
      isOpen: true,
      title: "Clean Old Logs",
      message: `Delete all logs older than ${cleanupDays} days? This cannot be undone.`,
      confirmText: "Delete Logs",
      isDestructive: true,
      onConfirm: async () => {
        setCleanupLoading(true);
        try {
          await cleanOldLogs(cleanupDays);
          await fetchAuditLogs();
        } catch (err) {
          console.error("Failed to clean logs:", err);
        } finally {
          setCleanupLoading(false);
        }
      },
    });
  };

  const handleSaveRateLimit = async (formData) => {
    try {
      if (configModal.type === "role") {
        await updateRateLimit(formData.role, formData.limit);
      } else if (configModal.type === "user") {
        await setUserLimit(formData.userId, formData.limit, formData.window);
      } else if (configModal.type === "endpoint") {
        if (configModal.data?.id) {
          await updateEndpointLimit(configModal.data.id, {
            limit: formData.limit,
            window: formData.window,
          });
        } else {
          await createEndpointLimit(
            formData.endpoint,
            formData.method,
            formData.limit,
            formData.window,
          );
        }
      }
      setConfigModal({ isOpen: false, type: null, data: null });
    } catch (error) {
      console.error("Failed to save rate limit:", error);
    }
  };

  const handleDeleteEndpointLimit = async (id) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Endpoint Limit",
      message: "Are you sure you want to delete this endpoint limit?",
      confirmText: "Delete",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await deleteEndpointLimit(id);
        } catch (error) {
          console.error("Failed to delete endpoint limit:", error);
        }
      },
    });
  };

  const handleRemoveUserLimit = async (userId) => {
    setConfirmDialog({
      isOpen: true,
      title: "Remove Custom Limit",
      message: "Are you sure you want to remove this user's custom rate limit?",
      confirmText: "Remove",
      isDestructive: true,
      onConfirm: async () => {
        try {
          await removeUserLimit(userId);
        } catch (error) {
          console.error("Failed to remove user limit:", error);
        }
      },
    });
  };

  const isCurrentTabLoading = () => {
    switch (activeTab) {
      case "overview":
        return loading && !dashboardStats;
      case "api":
        return loading && (!apiStats || !systemHealth);
      case "limits":
        return (
          loading &&
          rateLimits.length === 0 &&
          endpointLimits.length === 0 &&
          userLimits.length === 0
        );
      case "users":
        return loading && users.length === 0;
      case "audit":
        return loading && auditLogs.length === 0;
      case "backup":
        return false;
      default:
        return loading;
    }
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (onViewChange) {
      onViewChange(TAB_TO_VIEW[tabId] || "dashboard");
    }
  };

  if (!isAdmin) {
    return (
      <div
        className={`p-6 min-h-screen ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <p className={`${isDark ? "text-red-400" : "text-red-600"}`}>
          Access Denied: Admin privileges required
        </p>
      </div>
    );
  }

  const TABS = [
    { id: "overview", label: "Overview", icon: ChartNoAxesCombined },
    { id: "monitoring", label: "API Monitoring", icon: TrendingUp },
    { id: "ratelimits", label: "Rate Limits", icon: Settings },
    { id: "users", label: "User Management", icon: Users },
    { id: "auditlogs", label: "Audit Logs", icon: FileText },
    { id: "backup", label: "System Backup", icon: Shield },
  ];

  return (
    <div
      className={`flex h-[calc(100vh-64px)] overflow-hidden ${isDark ? "bg-[#0b0f19]" : "bg-gray-50"}`}
    >
      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col relative z-10 w-full">
        {/* Top Header */}
        <header
          className={`shrink-0 flex items-center justify-between p-4 sm:px-8 sm:py-5 border-b sticky top-0 z-10 backdrop-blur-xl ${isDark ? "bg-[#0b0f19]/80 border-gray-800/80" : "bg-white/80 border-gray-200 shadow-sm"}`}
        >
          <div>
            <h2
              className={`text-2xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}
            >
              {TABS.find((t) => t.id === activeTab)?.label}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-2 h-2 rounded-full ${refreshing ? "bg-yellow-500 animate-pulse" : "bg-emerald-500"}`}
              ></span>
              <p
                className={`text-xs font-medium uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                Last updated {lastUpdate.toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {error && (
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium mr-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                Error Details
              </div>
            )}

            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                isDark
                  ? "bg-gray-800/50 text-yellow-400 hover:bg-gray-700 border border-gray-700/50"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm"
              }`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-sm ${
                refreshing
                  ? "bg-blue-600/50 text-white/80 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md hover:-translate-y-0.5"
              }`}
            >
              <RefreshCw
                className={refreshing ? "animate-spin w-4 h-4" : "w-4 h-4"}
              />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar">
          {error && (
            <div
              className={`md:hidden px-4 py-3 rounded-xl mb-6 flex items-start gap-3 ${isDark ? "bg-red-900/20 border border-red-900/50 text-red-400" : "bg-red-50 border border-red-100 text-red-600"}`}
            >
              <span className="mt-0.5 shrink-0 block w-2 h-2 rounded-full bg-red-500"></span>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {isCurrentTabLoading() ? (
            <>
              {activeTab === "overview" && <OverviewSkeleton isDark={isDark} />}
              {activeTab === "api" && <ApiMonitoringSkeleton isDark={isDark} />}
              {activeTab === "users" && <UsersSkeleton isDark={isDark} />}
              {activeTab === "limits" && <RateLimitsSkeleton isDark={isDark} />}
              {activeTab === "audit" && <AuditLogsSkeleton isDark={isDark} />}
              {activeTab === "backup" && <BackupSkeleton isDark={isDark} />}
            </>
          ) : (
            <div className="max-w-7xl mx-auto">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Business KPIs */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Users Card */}
                    <div
                      className={`rounded-2xl border p-6 transition-all duration-300 ${
                        isDark
                          ? "bg-gray-800/40 border-gray-700/50 backdrop-blur-sm shadow-xl"
                          : "bg-white border-gray-100 shadow-sm hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className={`p-3 rounded-lg ${isDark ? "bg-blue-900/50" : "bg-blue-100"}`}
                        >
                          <Users
                            className={`w-6 h-6 ${isDark ? "text-blue-400" : "text-blue-600"}`}
                          />
                        </div>
                        <span
                          className={`text-sm font-medium ${isDark ? "text-green-400" : "text-green-600"}`}
                        >
                          {dashboardStats?.users?.active || 0} active
                        </span>
                      </div>
                      <p
                        className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
                        Total Users
                      </p>
                      <p
                        className={`text-3xl font-bold mt-1 ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        {dashboardStats?.users?.total || 0}
                      </p>
                    </div>

                    {/* Projects Card */}
                    <div
                      className={`rounded-2xl border p-6 transition-all duration-300 ${
                        isDark
                          ? "bg-gray-800/40 border-gray-700/50 backdrop-blur-sm shadow-xl"
                          : "bg-white border-gray-100 shadow-sm hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className={`p-3 rounded-lg ${isDark ? "bg-purple-900/50" : "bg-purple-100"}`}
                        >
                          <RefreshCw
                            className={`w-6 h-6 ${isDark ? "text-purple-400" : "text-purple-600"}`}
                          />
                        </div>
                        <span
                          className={`text-sm font-medium ${isDark ? "text-green-400" : "text-green-600"}`}
                        >
                          {dashboardStats?.projects?.active || 0} active
                        </span>
                      </div>
                      <p
                        className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
                        Total Projects
                      </p>
                      <p
                        className={`text-3xl font-bold mt-1 ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        {dashboardStats?.projects?.total || 0}
                      </p>
                    </div>

                    {/* Tasks Card */}
                    <div
                      className={`rounded-2xl border p-6 transition-all duration-300 ${
                        isDark
                          ? "bg-gray-800/40 border-gray-700/50 backdrop-blur-sm shadow-xl"
                          : "bg-white border-gray-100 shadow-sm hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className={`p-3 rounded-lg ${isDark ? "bg-pink-900/50" : "bg-pink-100"}`}
                        >
                          <Activity
                            className={`w-6 h-6 ${isDark ? "text-pink-400" : "text-pink-600"}`}
                          />
                        </div>
                        <span
                          className={`text-sm font-medium ${isDark ? "text-green-400" : "text-green-600"}`}
                        >
                          {dashboardStats?.tasks?.completed || 0} done
                        </span>
                      </div>
                      <p
                        className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
                        Total Tasks
                      </p>
                      <p
                        className={`text-3xl font-bold mt-1 ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        {dashboardStats?.tasks?.total || 0}
                      </p>
                    </div>

                    {/* System Status Card */}
                    <div
                      className={`rounded-2xl border p-6 transition-all duration-300 ${
                        isDark
                          ? "bg-gray-800/40 border-gray-700/50 backdrop-blur-sm shadow-xl"
                          : "bg-white border-gray-100 shadow-sm hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div
                          className={`p-3 rounded-lg ${isDark ? "bg-green-900/50" : "bg-green-100"}`}
                        >
                          <Shield
                            className={`w-6 h-6 ${isDark ? "text-green-400" : "text-green-600"}`}
                          />
                        </div>
                        <span
                          className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}
                        >
                          {systemHealth?.uptime
                            ? `${Math.floor(systemHealth.uptime / 3600)}h uptime`
                            : "Online"}
                        </span>
                      </div>
                      <p
                        className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
                        System Health
                      </p>
                      <p
                        className={`text-2xl font-bold mt-1 capitalize ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        {systemHealth?.status || "Unknown"}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Projects */}
                    <div
                      className={`rounded-2xl border p-6 ${isDark ? "bg-gray-800/40 border-gray-700/50 backdrop-blur-sm shadow-xl" : "bg-white border-gray-100 shadow-sm hover:shadow-md"}`}
                    >
                      <h3
                        className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        Recent Projects
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead
                            className={`sticky top-0 z-10 shadow-sm backdrop-blur-md ${isDark ? "bg-gray-800/90" : "bg-white/90"}`}
                          >
                            <tr>
                              <th
                                className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}
                              >
                                Project
                              </th>
                              <th
                                className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}
                              >
                                Manager
                              </th>
                              <th
                                className={`px-4 py-2 text-left text-xs font-medium uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}
                              >
                                Members
                              </th>
                            </tr>
                          </thead>
                          <tbody
                            className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-200"}`}
                          >
                            {dashboardStats?.recentProjects?.map((project) => (
                              <tr key={project.id}>
                                <td
                                  className={`px-4 py-3 text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-900"}`}
                                >
                                  {project.name}
                                </td>
                                <td
                                  className={`px-4 py-3 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                                >
                                  {project.manager?.name || "Unknown"}
                                </td>
                                <td
                                  className={`px-4 py-3 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                                >
                                  {project._count?.members || 0}
                                </td>
                              </tr>
                            ))}
                            {(!dashboardStats?.recentProjects ||
                              dashboardStats.recentProjects.length === 0) && (
                              <tr>
                                <td
                                  colSpan="3"
                                  className={`px-4 py-4 text-center text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}
                                >
                                  No projects created yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Quick System Stats (Compact) */}
                    <div
                      className={`rounded-2xl border p-6 flex flex-col ${isDark ? "bg-gray-800/40 border-gray-700/50 backdrop-blur-sm shadow-xl" : "bg-white border-gray-100 shadow-sm hover:shadow-md"}`}
                    >
                      <h3
                        className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        System Performance
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                          <span
                            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Total Requests (24h)
                          </span>
                          <span
                            className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                          >
                            {apiStats?.totalRequests?.toLocaleString() || "0"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                          <span
                            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Avg Response Time
                          </span>
                          <span
                            className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                          >
                            {apiStats?.averageResponseTime || 0} ms
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                          <span
                            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Error Rate
                          </span>
                          <span
                            className={`font-semibold ${
                              (apiStats?.errorRate || 0) > 5
                                ? "text-red-500"
                                : "text-green-500"
                            }`}
                          >
                            {apiStats?.errorRate || 0}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span
                            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Active Connections
                          </span>
                          <span
                            className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                          >
                            {systemHealth?.activeConnections || 0}
                          </span>
                        </div>
                      </div>
                      <div className="mt-6 flex justify-end">
                        <button
                          onClick={() => handleTabChange("monitoring")}
                          className="text-sm text-blue-500 hover:text-blue-400 inline-flex items-center gap-1"
                        >
                          View detailed monitoring{" "}
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "monitoring" && (
                <div className="space-y-6">
                  {/* Top Endpoints */}
                  <div
                    className={`rounded-2xl border p-6 flex flex-col ${isDark ? "bg-gray-800/40 border-gray-700/50 backdrop-blur-sm shadow-xl" : "bg-white border-gray-100 shadow-sm hover:shadow-md"}`}
                  >
                    <h3
                      className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      Top Endpoints
                    </h3>
                    {apiStats?.topEndpoints?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead
                            className={`sticky top-0 z-10 shadow-sm backdrop-blur-md ${isDark ? "bg-gray-800/90" : "bg-white/90"}`}
                          >
                            <tr>
                              <th
                                className={`px-4 py-2 text-left text-sm font-medium ${
                                  isDark ? "text-gray-300" : "text-gray-600"
                                }`}
                              >
                                Endpoint
                              </th>
                              <th
                                className={`px-4 py-2 text-left text-sm font-medium ${
                                  isDark ? "text-gray-300" : "text-gray-600"
                                }`}
                              >
                                Requests
                              </th>
                              <th
                                className={`px-4 py-2 text-left text-sm font-medium ${
                                  isDark ? "text-gray-300" : "text-gray-600"
                                }`}
                              >
                                Avg Time
                              </th>
                            </tr>
                          </thead>
                          <tbody
                            className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-200"}`}
                          >
                            {apiStats.topEndpoints.map((endpoint, idx) => (
                              <tr
                                key={idx}
                                className={
                                  isDark
                                    ? "hover:bg-gray-700"
                                    : "hover:bg-gray-50"
                                }
                              >
                                <td
                                  className={`px-4 py-3 text-sm ${isDark ? "text-gray-200" : "text-gray-900"}`}
                                >
                                  {endpoint.endpoint}
                                </td>
                                <td
                                  className={`px-4 py-3 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                                >
                                  {endpoint.count.toLocaleString()}
                                </td>
                                <td
                                  className={`px-4 py-3 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                                >
                                  {endpoint.avgTime}ms
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p
                        className={`text-center py-4 ${isDark ? "text-gray-500" : "text-gray-500"}`}
                      >
                        No API data available yet. Data will appear as requests
                        are made.
                      </p>
                    )}
                  </div>

                  {/* User Activity */}
                  <div
                    className={`rounded-2xl border p-6 flex flex-col ${isDark ? "bg-gray-800/40 border-gray-700/50 backdrop-blur-sm shadow-xl" : "bg-white border-gray-100 shadow-sm hover:shadow-md"}`}
                  >
                    <h3
                      className={`text-lg font-semibold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      User Activity (Last 24h)
                    </h3>
                    {userActivity?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead
                            className={`sticky top-0 z-10 shadow-sm backdrop-blur-md ${isDark ? "bg-gray-800/90" : "bg-white/90"}`}
                          >
                            <tr>
                              <th
                                className={`px-4 py-2 text-left text-sm font-medium ${
                                  isDark ? "text-gray-300" : "text-gray-600"
                                }`}
                              >
                                Username
                              </th>
                              <th
                                className={`px-4 py-2 text-left text-sm font-medium ${
                                  isDark ? "text-gray-300" : "text-gray-600"
                                }`}
                              >
                                Email
                              </th>
                              <th
                                className={`px-4 py-2 text-left text-sm font-medium ${
                                  isDark ? "text-gray-300" : "text-gray-600"
                                }`}
                              >
                                Role
                              </th>
                              <th
                                className={`px-4 py-2 text-left text-sm font-medium ${
                                  isDark ? "text-gray-300" : "text-gray-600"
                                }`}
                              >
                                Requests
                              </th>
                              <th
                                className={`px-4 py-2 text-left text-sm font-medium ${
                                  isDark ? "text-gray-300" : "text-gray-600"
                                }`}
                              >
                                Rate Limit
                              </th>
                              <th
                                className={`px-4 py-2 text-left text-sm font-medium ${
                                  isDark ? "text-gray-300" : "text-gray-600"
                                }`}
                              >
                                Usage
                              </th>
                            </tr>
                          </thead>
                          <tbody
                            className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-200"}`}
                          >
                            {userActivity.map((user) => (
                              <tr
                                key={user.userId}
                                className={
                                  isDark
                                    ? "hover:bg-gray-700"
                                    : "hover:bg-gray-50"
                                }
                              >
                                <td
                                  className={`px-4 py-3 text-sm ${isDark ? "text-gray-200" : "text-gray-900"}`}
                                >
                                  {user.username}
                                </td>
                                <td
                                  className={`px-4 py-3 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                                >
                                  {user.email}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`px-2 py-1 text-xs rounded-full ${
                                      user.role === "ADMIN"
                                        ? "bg-purple-100 text-purple-800"
                                        : user.role === "MANAGER"
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {user.role}
                                  </span>
                                </td>
                                <td
                                  className={`px-4 py-3 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                                >
                                  {user.requestCount}
                                </td>
                                <td
                                  className={`px-4 py-3 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                                >
                                  {user.rateLimit}/hr
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-24 rounded-full h-2 ${
                                        isDark ? "bg-gray-700" : "bg-gray-200"
                                      }`}
                                    >
                                      <div
                                        className={`h-2 rounded-full ${
                                          parseFloat(user.percentage) > 90
                                            ? "bg-red-600"
                                            : parseFloat(user.percentage) > 75
                                              ? "bg-yellow-600"
                                              : "bg-green-600"
                                        }`}
                                        style={{
                                          width: `${Math.min(
                                            parseFloat(user.percentage),
                                            100,
                                          )}%`,
                                        }}
                                      ></div>
                                    </div>
                                    <span
                                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                                    >
                                      {user.percentage}%
                                    </span>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p
                        className={`text-center py-4 ${isDark ? "text-gray-500" : "text-gray-500"}`}
                      >
                        No user activity in the last 24 hours.
                      </p>
                    )}
                  </div>

                  {/* ===== Health History Chart ===== */}
                  <div
                    className={`rounded-2xl border p-6 flex flex-col ${isDark ? "bg-gray-800/40 border-gray-700/50 backdrop-blur-sm shadow-xl" : "bg-white border-gray-100 shadow-sm hover:shadow-md"}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3
                        className={`text-lg font-semibold flex items-center gap-2 ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        <Cpu className="w-5 h-5 text-blue-500" />
                        System Health History (24h)
                      </h3>
                    </div>
                    {healthHistory?.length > 0 ? (
                      <div>
                        <div className="flex items-center gap-4 mb-6">
                          <span className="flex items-center gap-1 text-xs">
                            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>{" "}
                            <span
                              className={
                                isDark ? "text-gray-400" : "text-gray-600"
                              }
                            >
                              CPU %
                            </span>
                          </span>
                          <span className="flex items-center gap-1 text-xs">
                            <span className="w-3 h-3 rounded-full bg-purple-500 inline-block"></span>{" "}
                            <span
                              className={
                                isDark ? "text-gray-400" : "text-gray-600"
                              }
                            >
                              Memory %
                            </span>
                          </span>
                        </div>
                        <div
                          className="flex items-end justify-start gap-1"
                          style={{ height: "160px" }}
                        >
                          {healthHistory.map((point, idx) => {
                            const cpu = Math.round(point.cpu || 0);
                            const mem = Math.round(point.memory || 0);
                            return (
                              <div
                                key={idx}
                                className="flex-1 flex flex-col items-center gap-0.5 group relative"
                                style={{ minWidth: 0, maxWidth: "40px" }}
                              >
                                <div className="absolute bottom-full mb-2 hidden group-hover:block z-50">
                                  <div
                                    className={`text-xs px-2 py-1 rounded shadow whitespace-nowrap ${isDark ? "bg-gray-700 text-white" : "bg-gray-900 text-white"}`}
                                  >
                                    CPU: {cpu}% | Mem: {mem}%
                                  </div>
                                </div>
                                <div
                                  className="flex gap-px w-full justify-center"
                                  style={{
                                    height: "150px",
                                    alignItems: "flex-end",
                                  }}
                                >
                                  <div
                                    className="w-full max-w-[12px] bg-blue-500 rounded-t transition-all"
                                    style={{
                                      height: `${Math.max(cpu * 1.5, 4)}px`,
                                      opacity: 0.8,
                                    }}
                                  ></div>
                                  <div
                                    className="w-full max-w-[12px] bg-purple-500 rounded-t transition-all"
                                    style={{
                                      height: `${Math.max(mem * 1.5, 4)}px`,
                                      opacity: 0.8,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between mt-1">
                          <span
                            className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
                          >
                            24h ago
                          </span>
                          <span
                            className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
                          >
                            Now
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p
                        className={`text-center py-8 ${isDark ? "text-gray-500" : "text-gray-500"}`}
                      >
                        No health history data available yet. Data is collected
                        periodically.
                      </p>
                    )}
                  </div>

                  {/* ===== Request Trends Graph ===== */}
                  <div
                    className={`rounded-2xl border p-6 flex flex-col ${isDark ? "bg-gray-800/40 border-gray-700/50 backdrop-blur-sm shadow-xl" : "bg-white border-gray-100 shadow-sm hover:shadow-md"}`}
                  >
                    <h3
                      className={`text-lg font-semibold flex items-center gap-2 mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
                    >
                      <BarChart3 className="w-5 h-5 text-green-500" />
                      Request Trends (Per Hour)
                    </h3>
                    {apiStats?.requestsPerHour?.length > 0 ? (
                      <div>
                        <div
                          className="flex items-end gap-1"
                          style={{ height: "140px" }}
                        >
                          {apiStats.requestsPerHour.map((hourData, idx) => {
                            const maxCount = Math.max(
                              ...apiStats.requestsPerHour.map(
                                (h) => h.count || 0,
                              ),
                              1,
                            );
                            const height =
                              ((hourData.count || 0) / maxCount) * 130;
                            return (
                              <div
                                key={idx}
                                className="flex-1 flex flex-col items-center group relative"
                                style={{ minWidth: 0 }}
                              >
                                <div className="absolute bottom-full mb-1 hidden group-hover:block z-10">
                                  <div
                                    className={`text-xs px-2 py-1 rounded shadow whitespace-nowrap ${isDark ? "bg-gray-700 text-white" : "bg-gray-900 text-white"}`}
                                  >
                                    {hourData.count || 0} requests
                                  </div>
                                </div>
                                <div
                                  className="w-full bg-green-500 rounded-t transition-all hover:bg-green-400"
                                  style={{
                                    height: `${Math.max(height, 2)}px`,
                                    opacity: 0.8,
                                  }}
                                ></div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex justify-between mt-1">
                          <span
                            className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
                          >
                            24h ago
                          </span>
                          <span
                            className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
                          >
                            Now
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p
                        className={`text-center py-8 ${isDark ? "text-gray-500" : "text-gray-500"}`}
                      >
                        No request data available yet.
                      </p>
                    )}
                  </div>

                  {/* ===== Database Metrics & Error Analytics (side by side) ===== */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Database Metrics */}
                    <div
                      className={`rounded-2xl border p-6 flex flex-col ${isDark ? "bg-gray-800/40 border-gray-700/50 backdrop-blur-sm shadow-xl" : "bg-white border-gray-100 shadow-sm hover:shadow-md"}`}
                    >
                      <h3
                        className={`text-lg font-semibold flex items-center gap-2 mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        <Database className="w-5 h-5 text-indigo-500" />
                        Database Metrics
                      </h3>
                      {databaseMetrics ? (
                        <div className="space-y-3">
                          <div
                            className={`flex justify-between items-center pb-2 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
                          >
                            <span
                              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                            >
                              Status
                            </span>
                            <span
                              className={`px-2 py-1 text-xs rounded-full font-medium ${
                                databaseMetrics.status === "healthy"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {databaseMetrics.status}
                            </span>
                          </div>
                          <div
                            className={`flex justify-between items-center pb-2 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
                          >
                            <span
                              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                            >
                              Avg Query Time
                            </span>
                            <span
                              className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                            >
                              {databaseMetrics.avgQueryTime || 0}ms
                            </span>
                          </div>
                          {databaseMetrics.connectionPool && (
                            <>
                              <div
                                className={`flex justify-between items-center pb-2 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
                              >
                                <span
                                  className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                                >
                                  Pool Total
                                </span>
                                <span
                                  className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                                >
                                  {databaseMetrics.connectionPool.total}
                                </span>
                              </div>
                              <div
                                className={`flex justify-between items-center pb-2 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
                              >
                                <span
                                  className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                                >
                                  Active Connections
                                </span>
                                <span
                                  className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                                >
                                  {databaseMetrics.connectionPool.active}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span
                                  className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                                >
                                  Idle Connections
                                </span>
                                <span
                                  className={`font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                                >
                                  {databaseMetrics.connectionPool.idle}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <p
                          className={`text-center py-4 ${isDark ? "text-gray-500" : "text-gray-500"}`}
                        >
                          Loading database metrics...
                        </p>
                      )}
                    </div>

                    {/* Error Analytics */}
                    <div
                      className={`rounded-lg shadow p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}
                    >
                      <h3
                        className={`text-lg font-semibold flex items-center gap-2 mb-4 ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        Error Analytics (24h)
                      </h3>
                      {errorMetrics ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div
                              className={`text-center p-3 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-50"}`}
                            >
                              <p
                                className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                              >
                                {errorMetrics.last24h}
                              </p>
                              <p
                                className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                              >
                                24h Errors
                              </p>
                            </div>
                            <div
                              className={`text-center p-3 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-50"}`}
                            >
                              <p
                                className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                              >
                                {errorMetrics.lastHour}
                              </p>
                              <p
                                className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                              >
                                Last Hour
                              </p>
                            </div>
                            <div
                              className={`text-center p-3 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-50"}`}
                            >
                              <p className={`text-2xl font-bold text-red-500`}>
                                {errorMetrics.critical}
                              </p>
                              <p
                                className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                              >
                                Critical (5xx)
                              </p>
                            </div>
                          </div>
                          {errorMetrics.commonErrors?.length > 0 ? (
                            <div>
                              <p
                                className={`text-sm font-medium mb-2 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                              >
                                Top Errors
                              </p>
                              <div className="space-y-2">
                                {errorMetrics.commonErrors.map((err, idx) => (
                                  <div
                                    key={idx}
                                    className={`flex items-center justify-between text-sm px-3 py-2 rounded ${isDark ? "bg-gray-700" : "bg-gray-50"}`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`px-2 py-0.5 text-xs rounded font-mono ${
                                          err.statusCode >= 500
                                            ? "bg-red-100 text-red-800"
                                            : "bg-yellow-100 text-yellow-800"
                                        }`}
                                      >
                                        {err.statusCode}
                                      </span>
                                      <span
                                        className={`truncate max-w-[200px] ${isDark ? "text-gray-300" : "text-gray-700"}`}
                                      >
                                        {err.endpoint}
                                      </span>
                                    </div>
                                    <span
                                      className={`font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
                                    >
                                      ×{err.count}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p
                              className={`text-center text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}
                            >
                              No errors recorded 🎉
                            </p>
                          )}
                        </div>
                      ) : (
                        <p
                          className={`text-center py-4 ${isDark ? "text-gray-500" : "text-gray-500"}`}
                        >
                          Loading error metrics...
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "backup" && (
                <div
                  className={`rounded-lg shadow p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3
                        className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        System Backup
                      </h3>
                      <p
                        className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
                        Download a full JSON export of the database. This
                        includes users, projects, tasks, and system logs.
                      </p>
                    </div>
                    <Shield
                      className={`w-12 h-12 ${isDark ? "text-gray-700" : "text-gray-200"}`}
                    />
                  </div>

                  <div
                    className={`mt-6 p-4 rounded-lg border ${
                      isDark
                        ? "bg-blue-900/20 border-blue-800"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Shield className="h-5 w-5 text-blue-400" />
                      </div>
                      <div className="ml-3">
                        <h3
                          className={`text-sm font-medium ${isDark ? "text-blue-300" : "text-blue-800"}`}
                        >
                          Backup Information
                        </h3>
                        <div
                          className={`mt-2 text-sm ${isDark ? "text-blue-200" : "text-blue-700"}`}
                        >
                          <ul className="list-disc pl-5 space-y-1">
                            <li>
                              The backup file contains sensitive data. Store it
                              securely.
                            </li>
                            <li>
                              This is a snapshot of the system at the current
                              time.
                            </li>
                            <li>
                              To restore data, please contact the system
                              administrator or developer.
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col md:flex-row gap-4">
                    <Button onClick={downloadBackup} disabled={loading}>
                      <Shield className="w-4 h-4 mr-2" />
                      {loading ? "Generating..." : "Download System Backup"}
                    </Button>
                    <Button
                      onClick={downloadSourceCode}
                      disabled={loading}
                      variant="outline"
                    >
                      <RefreshCw
                        className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
                      />
                      {loading ? "Zipping..." : "Download Source Code"}
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === "ratelimits" && (
                <div className="space-y-6">
                  {/* Per-Role Limits */}
                  <div
                    className={`rounded-lg shadow p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3
                        className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        Per-Role Rate Limits
                      </h3>
                    </div>
                    {rateLimits?.length > 0 ? (
                      <div className="space-y-4">
                        {rateLimits.map((config) => (
                          <div
                            key={config.role}
                            className={`border rounded-lg p-4 ${
                              isDark ? "border-gray-700" : "border-gray-200"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3">
                                  <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                                      config.role === "ADMIN"
                                        ? "bg-purple-100 text-purple-800"
                                        : config.role === "MANAGER"
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-gray-100 text-gray-800"
                                    }`}
                                  >
                                    {config.role}
                                  </span>
                                  <span
                                    className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                                  >
                                    {config.limit}
                                  </span>
                                  <span
                                    className={
                                      isDark ? "text-gray-400" : "text-gray-600"
                                    }
                                  >
                                    requests/hour
                                  </span>
                                </div>
                                <div className="mt-2">
                                  <div
                                    className={`flex justify-between text-sm mb-1 ${
                                      isDark ? "text-gray-400" : "text-gray-600"
                                    }`}
                                  >
                                    <span>Current Usage</span>
                                    <span>
                                      {config.currentUsage || 0} /{" "}
                                      {config.limit}
                                    </span>
                                  </div>
                                  <div
                                    className={`w-full rounded-full h-2 ${
                                      isDark ? "bg-gray-700" : "bg-gray-200"
                                    }`}
                                  >
                                    <div
                                      className={`h-2 rounded-full ${
                                        parseFloat(config.percentage || 0) > 90
                                          ? "bg-red-600"
                                          : parseFloat(config.percentage || 0) >
                                              75
                                            ? "bg-yellow-600"
                                            : "bg-green-600"
                                      }`}
                                      style={{
                                        width: `${Math.min(
                                          parseFloat(config.percentage || 0),
                                          100,
                                        )}%`,
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  setConfigModal({
                                    isOpen: true,
                                    type: "role",
                                    data: config,
                                  })
                                }
                                className="ml-4"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p
                        className={`text-center py-4 ${isDark ? "text-gray-500" : "text-gray-500"}`}
                      >
                        No rate limit configurations found.
                      </p>
                    )}
                  </div>

                  {/* Per-User Limits */}
                  <div
                    className={`rounded-lg shadow p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3
                        className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        Per-User Rate Limits
                      </h3>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          setConfigModal({
                            isOpen: true,
                            type: "user",
                            data: null,
                          })
                        }
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Set User Limit
                      </Button>
                    </div>
                    {userLimits?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead
                            className={isDark ? "bg-gray-700" : "bg-gray-50"}
                          >
                            <tr>
                              <th
                                className={`px-4 py-2 text-left text-sm font-medium ${
                                  isDark ? "text-gray-300" : "text-gray-600"
                                }`}
                              >
                                User
                              </th>
                              <th
                                className={`px-4 py-2 text-left text-sm font-medium ${
                                  isDark ? "text-gray-300" : "text-gray-600"
                                }`}
                              >
                                Limit
                              </th>
                              <th
                                className={`px-4 py-2 text-left text-sm font-medium ${
                                  isDark ? "text-gray-300" : "text-gray-600"
                                }`}
                              >
                                Window
                              </th>
                              <th
                                className={`px-4 py-2 text-left text-sm font-medium ${
                                  isDark ? "text-gray-300" : "text-gray-600"
                                }`}
                              >
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody
                            className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-200"}`}
                          >
                            {userLimits.map((limit) => (
                              <tr
                                key={limit.userId}
                                className={
                                  isDark
                                    ? "hover:bg-gray-700"
                                    : "hover:bg-gray-50"
                                }
                              >
                                <td
                                  className={`px-4 py-3 text-sm ${isDark ? "text-gray-200" : "text-gray-900"}`}
                                >
                                  {limit.user?.username || "Unknown"}
                                </td>
                                <td
                                  className={`px-4 py-3 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                                >
                                  {limit.limit} req
                                </td>
                                <td
                                  className={`px-4 py-3 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                                >
                                  {limit.window}s
                                </td>
                                <td className="px-4 py-3">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                      handleRemoveUserLimit(limit.userId)
                                    }
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p
                        className={`text-center py-4 ${isDark ? "text-gray-500" : "text-gray-500"}`}
                      >
                        No user-specific rate limits configured.
                      </p>
                    )}
                  </div>

                  {/* Endpoint Throttling */}
                  <div
                    className={`rounded-lg shadow p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3
                        className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        Endpoint Throttling
                      </h3>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() =>
                          setConfigModal({
                            isOpen: true,
                            type: "endpoint",
                            data: null,
                          })
                        }
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Configure Endpoint
                      </Button>
                    </div>
                    {endpointLimits?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead
                            className={isDark ? "bg-gray-700" : "bg-gray-50"}
                          >
                            <tr>
                              <th
                                className={`px-4 py-2 text-left text-sm font-medium ${
                                  isDark ? "text-gray-300" : "text-gray-600"
                                }`}
                              >
                                Endpoint
                              </th>
                              <th
                                className={`px-4 py-2 text-left text-sm font-medium ${
                                  isDark ? "text-gray-300" : "text-gray-600"
                                }`}
                              >
                                Method
                              </th>
                              <th
                                className={`px-4 py-2 text-left text-sm font-medium ${
                                  isDark ? "text-gray-300" : "text-gray-600"
                                }`}
                              >
                                Limit
                              </th>
                              <th
                                className={`px-4 py-2 text-left text-sm font-medium ${
                                  isDark ? "text-gray-300" : "text-gray-600"
                                }`}
                              >
                                Usage
                              </th>
                              <th
                                className={`px-4 py-2 text-left text-sm font-medium ${
                                  isDark ? "text-gray-300" : "text-gray-600"
                                }`}
                              >
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody
                            className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-200"}`}
                          >
                            {endpointLimits.map((limit) => (
                              <tr
                                key={limit.id}
                                className={
                                  isDark
                                    ? "hover:bg-gray-700"
                                    : "hover:bg-gray-50"
                                }
                              >
                                <td
                                  className={`px-4 py-3 text-sm font-mono ${isDark ? "text-gray-200" : "text-gray-900"}`}
                                >
                                  {limit.endpoint}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`px-2 py-1 text-xs rounded-full ${
                                      limit.method === "*"
                                        ? "bg-purple-100 text-purple-800"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    {limit.method}
                                  </span>
                                </td>
                                <td
                                  className={`px-4 py-3 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                                >
                                  {limit.limit}/{limit.window}s
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-20 rounded-full h-2 ${
                                        isDark ? "bg-gray-700" : "bg-gray-200"
                                      }`}
                                    >
                                      <div
                                        className={`h-2 rounded-full ${
                                          parseFloat(limit.percentage || 0) > 90
                                            ? "bg-red-600"
                                            : parseFloat(
                                                  limit.percentage || 0,
                                                ) > 75
                                              ? "bg-yellow-600"
                                              : "bg-green-600"
                                        }`}
                                        style={{
                                          width: `${Math.min(
                                            parseFloat(limit.percentage || 0),
                                            100,
                                          )}%`,
                                        }}
                                      ></div>
                                    </div>
                                    <span
                                      className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                                    >
                                      {limit.percentage || 0}%
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        setConfigModal({
                                          isOpen: true,
                                          type: "endpoint",
                                          data: limit,
                                        })
                                      }
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleDeleteEndpointLimit(limit.id)
                                      }
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p
                        className={`text-center py-4 ${isDark ? "text-gray-500" : "text-gray-500"}`}
                      >
                        No endpoint throttling configured.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "users" && (
                <div className="space-y-6">
                  {/* Users Table */}
                  <div
                    className={`rounded-2xl border overflow-hidden flex flex-col ${isDark ? "bg-gray-800/40 border-gray-700/50 backdrop-blur-sm shadow-xl" : "bg-white border-gray-100 shadow-sm hover:shadow-md"}`}
                  >
                    <div className="p-6">
                      <h3
                        className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        All Users
                      </h3>
                      <p
                        className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
                        Total users: {users?.length || 0} — Manage roles,
                        status, and view activity.
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead
                          className={`sticky top-0 z-10 shadow-sm backdrop-blur-md ${isDark ? "bg-gray-800/90" : "bg-white/90"}`}
                        >
                          <tr>
                            <th
                              className={`px-6 py-3 text-left text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}
                            >
                              Username
                            </th>
                            <th
                              className={`px-6 py-3 text-left text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}
                            >
                              Email
                            </th>
                            <th
                              className={`px-6 py-3 text-left text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}
                            >
                              Role
                            </th>
                            <th
                              className={`px-6 py-3 text-left text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}
                            >
                              Status
                            </th>
                            <th
                              className={`px-6 py-3 text-left text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}
                            >
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody
                          className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-200"}`}
                        >
                          {users?.map((u) => {
                            const isSelf = u.id === currentUser?.id;
                            return (
                              <tr
                                key={u.id}
                                className={
                                  isDark
                                    ? "hover:bg-gray-700"
                                    : "hover:bg-gray-50"
                                }
                              >
                                <td
                                  className={`px-6 py-4 text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-900"}`}
                                >
                                  {u.username}
                                  {isSelf && (
                                    <span className="ml-2 text-xs text-blue-500">
                                      (you)
                                    </span>
                                  )}
                                </td>
                                <td
                                  className={`px-6 py-4 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                                >
                                  {u.email}
                                </td>
                                <td className="px-6 py-4">
                                  <div className="relative">
                                    <button
                                      onClick={() =>
                                        !isSelf &&
                                        setRoleDropdownOpen(
                                          roleDropdownOpen === u.id
                                            ? null
                                            : u.id,
                                        )
                                      }
                                      disabled={isSelf}
                                      className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-colors ${
                                        isSelf
                                          ? "cursor-not-allowed opacity-60"
                                          : "cursor-pointer hover:ring-2 hover:ring-blue-500/50"
                                      } ${
                                        u.role === "ADMIN"
                                          ? "bg-purple-100 text-purple-800"
                                          : u.role === "MANAGER"
                                            ? "bg-blue-100 text-blue-800"
                                            : u.role === "MODERATOR"
                                              ? "bg-teal-100 text-teal-800"
                                              : "bg-gray-100 text-gray-800"
                                      }`}
                                    >
                                      {u.role}
                                      {!isSelf && (
                                        <ChevronDown className="w-3 h-3" />
                                      )}
                                    </button>
                                    {roleDropdownOpen === u.id && (
                                      <div
                                        className={`absolute z-20 mt-1 w-36 rounded-lg shadow-lg border ${isDark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"}`}
                                      >
                                        {ROLES.filter((r) => r !== u.role).map(
                                          (role) => (
                                            <button
                                              key={role}
                                              onClick={() =>
                                                handleRoleChange(u.id, role)
                                              }
                                              className={`w-full text-left px-3 py-2 text-sm first:rounded-t-lg last:rounded-b-lg ${
                                                isDark
                                                  ? "hover:bg-gray-600 text-gray-200"
                                                  : "hover:bg-gray-50 text-gray-700"
                                              }`}
                                            >
                                              {role}
                                            </button>
                                          ),
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`px-2 py-1 text-xs rounded-full ${u.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                                  >
                                    {u.isActive ? "Active" : "Inactive"}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() =>
                                        handleToggleUserStatus(u.id, u.isActive)
                                      }
                                      disabled={isSelf}
                                      title={
                                        isSelf
                                          ? "Cannot modify your own account"
                                          : u.isActive
                                            ? "Deactivate user"
                                            : "Activate user"
                                      }
                                      className={`p-1.5 rounded-lg transition-colors ${
                                        isSelf
                                          ? "opacity-40 cursor-not-allowed"
                                          : u.isActive
                                            ? `${isDark ? "hover:bg-red-900/50 text-red-400" : "hover:bg-red-50 text-red-600"}`
                                            : `${isDark ? "hover:bg-green-900/50 text-green-400" : "hover:bg-green-50 text-green-600"}`
                                      }`}
                                    >
                                      {u.isActive ? (
                                        <UserX className="w-4 h-4" />
                                      ) : (
                                        <UserCheck className="w-4 h-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={() => handleViewUserDetails(u)}
                                      title="View user details"
                                      className={`p-1.5 rounded-lg transition-colors ${isDark ? "hover:bg-gray-600 text-gray-400" : "hover:bg-gray-100 text-gray-600"}`}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== AUDIT LOGS TAB ===== */}
              {activeTab === "auditlogs" && (
                <div className="space-y-6">
                  <div
                    className={`rounded-2xl border p-6 flex flex-col ${isDark ? "bg-gray-800/40 border-gray-700/50 backdrop-blur-sm shadow-xl" : "bg-white border-gray-100 shadow-sm hover:shadow-md"}`}
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                      <div>
                        <h3
                          className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                          Audit Logs
                        </h3>
                        <p
                          className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                        >
                          Track admin actions and system changes. Total:{" "}
                          {auditLogs?.length || 0} entries.
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <label
                            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Keep last
                          </label>
                          <input
                            type="number"
                            value={cleanupDays}
                            onChange={(e) =>
                              setCleanupDays(parseInt(e.target.value) || 90)
                            }
                            min={1}
                            className={`w-20 px-2 py-1.5 text-sm rounded-lg border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"}`}
                          />
                          <span
                            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                          >
                            days
                          </span>
                        </div>
                        <Button
                          onClick={handleCleanLogs}
                          disabled={cleanupLoading}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash className="w-4 h-4 mr-1" />
                          {cleanupLoading ? "Cleaning..." : "Clean Old Logs"}
                        </Button>
                      </div>
                    </div>

                    {auditLogs?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead
                            className={`sticky top-0 z-10 shadow-sm backdrop-blur-md ${isDark ? "bg-gray-800/90" : "bg-white/90"}`}
                          >
                            <tr>
                              <th
                                className={`px-4 py-2 text-left text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}
                              >
                                Time
                              </th>
                              <th
                                className={`px-4 py-2 text-left text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}
                              >
                                Admin
                              </th>
                              <th
                                className={`px-4 py-2 text-left text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}
                              >
                                Action
                              </th>
                              <th
                                className={`px-4 py-2 text-left text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}
                              >
                                Target
                              </th>
                              <th
                                className={`px-4 py-2 text-left text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}
                              >
                                Details
                              </th>
                            </tr>
                          </thead>
                          <tbody
                            className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-200"}`}
                          >
                            {auditLogs.map((log) => (
                              <tr
                                key={log.id}
                                className={
                                  isDark
                                    ? "hover:bg-gray-700"
                                    : "hover:bg-gray-50"
                                }
                              >
                                <td
                                  className={`px-4 py-3 text-sm whitespace-nowrap ${isDark ? "text-gray-400" : "text-gray-600"}`}
                                >
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {timeAgo(log.timestamp)}
                                  </div>
                                </td>
                                <td
                                  className={`px-4 py-3 text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-900"}`}
                                >
                                  {log.admin?.username || "System"}
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`px-2 py-1 text-xs rounded-full font-medium ${
                                      log.action?.includes("DELETE") ||
                                      log.action?.includes("DEACTIVATE")
                                        ? "bg-red-100 text-red-800"
                                        : log.action?.includes("CREATE") ||
                                            log.action?.includes("ACTIVATE")
                                          ? "bg-green-100 text-green-800"
                                          : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    {log.action}
                                  </span>
                                </td>
                                <td
                                  className={`px-4 py-3 text-sm font-mono ${isDark ? "text-gray-400" : "text-gray-600"}`}
                                >
                                  {log.targetId
                                    ? log.targetId.substring(0, 12) + "..."
                                    : "—"}
                                </td>
                                <td
                                  className={`px-4 py-3 text-sm max-w-[200px] truncate ${isDark ? "text-gray-400" : "text-gray-600"}`}
                                >
                                  {log.details
                                    ? typeof log.details === "string"
                                      ? log.details
                                      : JSON.stringify(log.details)
                                    : "—"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p
                        className={`text-center py-8 ${isDark ? "text-gray-500" : "text-gray-500"}`}
                      >
                        No audit logs recorded yet. Admin actions will appear
                        here.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* User Detail Modal */}
      {userDetailOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setUserDetailOpen(false)}
          ></div>
          <div
            className={`relative w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-xl shadow-2xl ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}
          >
            {/* Modal Header */}
            <div
              className={`shrink-0 flex items-center justify-between p-6 border-b rounded-t-xl ${isDark ? "border-gray-700 bg-gray-800/90" : "border-gray-200 bg-white/90"}`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${isDark ? "bg-blue-900/50 text-blue-400" : "bg-blue-100 text-blue-600"}`}
                >
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3
                    className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {selectedUser.user?.name || selectedUser.user?.username}
                  </h3>
                  <p
                    className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    @{selectedUser.user?.username}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setUserDetailOpen(false)}
                className={`p-2 rounded-full transition-colors ${isDark ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-100 text-gray-500"}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-8">
              {/* Status Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                  className={`p-4 rounded-xl border ${isDark ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-100"}`}
                >
                  <p
                    className={`text-xs uppercase tracking-wider font-semibold mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Role
                  </p>
                  <p
                    className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {selectedUser.user?.role}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-xl border ${isDark ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-100"}`}
                >
                  <p
                    className={`text-xs uppercase tracking-wider font-semibold mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Status
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${selectedUser.user?.isActive ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400"}`}
                  >
                    {selectedUser.user?.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div
                  className={`p-4 rounded-xl border ${isDark ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-100"}`}
                >
                  <p
                    className={`text-xs uppercase tracking-wider font-semibold mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Last Login
                  </p>
                  <p
                    className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {selectedUser.user?.lastLogin
                      ? timeAgo(selectedUser.user.lastLogin)
                      : "Never"}
                  </p>
                </div>
                <div
                  className={`p-4 rounded-xl border ${isDark ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-100"}`}
                >
                  <p
                    className={`text-xs uppercase tracking-wider font-semibold mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Joined
                  </p>
                  <p
                    className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    {selectedUser.user?.createdAt
                      ? new Date(
                          selectedUser.user.createdAt,
                        ).toLocaleDateString()
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Contact Info */}
              <div
                className={`p-5 rounded-xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
              >
                <h4
                  className={`text-sm font-bold uppercase tracking-wider mb-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p
                      className={`text-sm mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Email Address
                    </p>
                    <p
                      className={`font-medium ${isDark ? "text-gray-200" : "text-gray-800"}`}
                    >
                      {selectedUser.user?.email || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Activity Summary / Skeleton */}
              {selectedUser.summary ? (
                <div className="space-y-4">
                  <h4
                    className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    7-Day Activity Summary
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-colors ${isDark ? "bg-gray-800 border-gray-700 hover:border-blue-500/50" : "bg-white border-gray-200 hover:border-blue-300"}`}
                    >
                      <Activity
                        className={`w-5 h-5 mb-2 ${isDark ? "text-blue-400" : "text-blue-500"}`}
                      />
                      <p
                        className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        {selectedUser.summary.totalRequests || 0}
                      </p>
                      <p
                        className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        API Requests
                      </p>
                    </div>
                    <div
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-colors ${isDark ? "bg-gray-800 border-gray-700 hover:border-green-500/50" : "bg-white border-gray-200 hover:border-green-300"}`}
                    >
                      <UserCheck
                        className={`w-5 h-5 mb-2 ${isDark ? "text-green-400" : "text-green-500"}`}
                      />
                      <p
                        className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        {selectedUser.summary.tasksCompleted || 0}
                      </p>
                      <p
                        className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        Tasks Completed
                      </p>
                    </div>
                    <div
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-colors ${isDark ? "bg-gray-800 border-gray-700 hover:border-purple-500/50" : "bg-white border-gray-200 hover:border-purple-300"}`}
                    >
                      <FileText
                        className={`w-5 h-5 mb-2 ${isDark ? "text-purple-400" : "text-purple-500"}`}
                      />
                      <p
                        className={`text-2xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        {selectedUser.summary.tasksAssigned || 0}
                      </p>
                      <p
                        className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        Tasks Assigned
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 animate-pulse">
                  <div
                    className={`h-4 w-40 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                  ></div>
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-24 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-200 border-transparent"}`}
                      ></div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Tasks */}
              {selectedUser.recentTasks ? (
                selectedUser.recentTasks.length > 0 && (
                  <div className="space-y-3">
                    <h4
                      className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Recent Tasks
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {selectedUser.recentTasks.map((task) => (
                        <div
                          key={task.id}
                          className={`flex items-center justify-between p-3 rounded-lg border ${isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-100 shadow-sm"}`}
                        >
                          <div className="flex-1 min-w-0 pr-4">
                            <p
                              className={`text-sm font-medium truncate ${isDark ? "text-gray-200" : "text-gray-800"}`}
                            >
                              {task.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}
                              >
                                {task.project?.name || "No project"}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`shrink-0 px-2.5 py-1 text-xs font-medium rounded-full ${
                              task.status === "COMPLETED"
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : task.status === "IN_PROGRESS"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                  : task.status === "IN_REVIEW"
                                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                          >
                            {task.status.replace("_", " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-3 animate-pulse">
                  <div
                    className={`h-4 w-32 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                  ></div>
                  <div
                    className={`h-16 w-full rounded-lg border ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-200 border-transparent"}`}
                  ></div>
                  <div
                    className={`h-16 w-full rounded-lg border ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-200 border-transparent"}`}
                  ></div>
                </div>
              )}

              {/* Recent API Activity */}
              {selectedUser.recentApiActivity ? (
                selectedUser.recentApiActivity.length > 0 && (
                  <div className="space-y-3 pb-8">
                    <h4
                      className={`text-sm font-bold uppercase tracking-wider ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Recent API Activity
                    </h4>
                    <div
                      className={`rounded-lg overflow-hidden border ${isDark ? "bg-gray-800/30 border-gray-700" : "bg-white border-gray-200"}`}
                    >
                      <div className="max-h-64 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700/50">
                          <thead
                            className={isDark ? "bg-gray-800" : "bg-gray-50"}
                          >
                            <tr>
                              <th
                                className={`px-4 py-2 text-left text-[11px] font-semibold tracking-wider uppercase ${isDark ? "text-gray-500" : "text-gray-500"}`}
                              >
                                Method
                              </th>
                              <th
                                className={`px-4 py-2 text-left text-[11px] font-semibold tracking-wider uppercase ${isDark ? "text-gray-500" : "text-gray-500"}`}
                              >
                                Endpoint
                              </th>
                              <th
                                className={`px-4 py-2 text-right text-[11px] font-semibold tracking-wider uppercase ${isDark ? "text-gray-500" : "text-gray-500"}`}
                              >
                                Time
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
                            {selectedUser.recentApiActivity.map((log, idx) => (
                              <tr
                                key={idx}
                                className={
                                  isDark
                                    ? "hover:bg-gray-700/50"
                                    : "hover:bg-gray-50"
                                }
                              >
                                <td className="px-4 py-2 whitespace-nowrap">
                                  <span
                                    className={`px-1.5 py-0.5 rounded font-mono text-[10px] ${
                                      log.method === "GET"
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                        : log.method === "POST"
                                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                          : log.method === "PUT" ||
                                              log.method === "PATCH"
                                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                    }`}
                                  >
                                    {log.method}
                                  </span>
                                </td>
                                <td
                                  className={`px-4 py-2 text-sm truncate max-w-[200px] ${isDark ? "text-gray-300" : "text-gray-700"}`}
                                >
                                  {log.endpoint}
                                </td>
                                <td
                                  className={`px-4 py-2 text-xs text-right whitespace-nowrap ${isDark ? "text-gray-500" : "text-gray-400"}`}
                                >
                                  {timeAgo(log.timestamp)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                <div className="space-y-3 pb-8 animate-pulse">
                  <div
                    className={`h-4 w-40 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                  ></div>
                  <div
                    className={`h-32 w-full rounded-lg border ${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-200 border-transparent"}`}
                  ></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() =>
              setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
            }
          ></div>
          <div
            className={`relative w-full max-w-sm overflow-hidden flex flex-col rounded-xl shadow-2xl ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-100"}`}
          >
            <div
              className={`p-5 border-b ${isDark ? "border-gray-700 bg-gray-800/90" : "border-gray-200 bg-white/90"}`}
            >
              <h3
                className={`text-lg font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                {confirmDialog.title}
              </h3>
            </div>
            <div
              className={`p-5 min-h-[80px] flex items-center ${isDark ? "text-gray-300" : "text-gray-600"}`}
            >
              <p className="text-sm">{confirmDialog.message}</p>
            </div>
            <div className={`flex items-center justify-end gap-3 p-5 pt-0`}>
              <Button
                variant="outline"
                onClick={() =>
                  setConfirmDialog((prev) => ({ ...prev, isOpen: false }))
                }
              >
                {confirmDialog.cancelText || "Cancel"}
              </Button>
              <Button
                variant={confirmDialog.isDestructive ? "danger" : "primary"}
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
                }}
              >
                {confirmDialog.confirmText || "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rate Limit Config Modal */}
      <RateLimitConfigModal
        isOpen={configModal.isOpen}
        onClose={() =>
          setConfigModal({ isOpen: false, type: null, data: null })
        }
        type={configModal.type}
        onSave={handleSaveRateLimit}
        initialData={configModal.data}
        users={users}
        endpoints={availableEndpoints}
      />
    </div>
  );
};

export default AdminDashboard;
