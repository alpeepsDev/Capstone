import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { useTheme, useAuth } from "../../context";
import { Header, Sidebar } from "../navigation";
import { ThemeToggle } from "../ui";
import NovaAssistant from "../assistant/NovaAssistant";
import AIPreferencesSettings from "../dashboard/AIPreferencesSettings";
import ReportPage from "../../pages/ReportPage";
import logger from "../../utils/logger.js";
import { Shield } from "lucide-react";

const Layout = ({
  user,
  children,
  onLogout,
  // Props for Sidebar
  projects,
  selectedProjectId,
  onProjectSelect,
  activeView: propActiveView,
  onViewChange,
}) => {
  // Local state for when activeView is not controlled by parent
  const [localActiveView, setLocalActiveView] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { isDark } = useTheme();
  const { toggleMfa } = useAuth();
  const [isTogglingMfa, setIsTogglingMfa] = useState(false);

  const handleToggleMfa = async () => {
    setIsTogglingMfa(true);
    try {
      await toggleMfa(!user?.mfaEnabled);
      toast.success(`MFA has been ${!user?.mfaEnabled ? 'enabled' : 'disabled'}.`);
    } catch (error) {
      toast.error(error.message || "Failed to toggle MFA.");
    } finally {
      setIsTogglingMfa(false);
    }
  };

  // Determine which activeView to use
  const currentActiveView =
    propActiveView !== undefined ? propActiveView : localActiveView;

  const handleViewChange = (viewId) => {
    if (onViewChange) {
      onViewChange(viewId);
    } else {
      setLocalActiveView(viewId);
    }
    logger.info("Navigating to:", viewId);
  };

  // Global notification listener
  React.useEffect(() => {
    const handleRealtimeNotification = (event) => {
      const notification = event.detail;

      // Show toast based on notification type
      if (notification.type === "MENTION") {
        toast(
          (t) => (
            <div
              className="flex items-start gap-3 cursor-pointer p-1"
              onClick={() => {
                toast.dismiss(t.id);
                const taskId = notification.taskId || notification.task?.id;
                const projectId =
                  notification.projectId || notification.project?.id;

                if (taskId && projectId) {
                  // Dispatch custom event for immediate response
                  window.dispatchEvent(
                    new CustomEvent("openTaskFromNotification", {
                      detail: { taskId, projectId },
                    }),
                  );
                  // Change URL for full navigation
                  window.location.href = `/dashboard?projectId=${projectId}&taskId=${taskId}`;
                }
              }}
            >
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {notification.title}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {notification.message}
                </p>
              </div>
            </div>
          ),
          {
            duration: 5000,
            position: "top-right",
            icon: "👋",
            style: {
              background: isDark ? "#1f2937" : "#ffffff",
              color: isDark ? "#ffffff" : "#111827",
              border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
            },
          },
        );
      } else if (notification.type === "TASK_CHANGES_REQUESTED") {
        toast.error(notification.message, {
          duration: 5000,
          position: "top-right",
        });
      } else {
        // Default notification toast
        toast(notification.message, {
          duration: 4000,
          position: "top-right",
          icon: "📢",
        });
      }
    };

    window.addEventListener("realtimeNotification", handleRealtimeNotification);

    return () => {
      window.removeEventListener(
        "realtimeNotification",
        handleRealtimeNotification,
      );
    };
  }, [isDark]);

  const renderContent = () => {
    switch (currentActiveView) {
      case "dashboard":
        return children; // Show the role-based dashboard
      case "my-tasks":
      case "tasks":
        return (
          <div
            className={`${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } rounded-lg shadow-sm border p-6`}
          >
            <h2
              className={`text-2xl font-bold ${
                isDark ? "text-gray-100" : "text-gray-900"
              } mb-4`}
            >
              Task Management
            </h2>
            <p className={`${isDark ? "text-gray-300" : "text-gray-600"}`}>
              Task management interface coming soon...
            </p>
          </div>
        );
      case "projects":
        return (
          <div
            className={`${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } rounded-lg shadow-sm border p-6`}
          >
            <h2
              className={`text-2xl font-bold ${
                isDark ? "text-gray-100" : "text-gray-900"
              } mb-4`}
            >
              Projects
            </h2>
            <p className={`${isDark ? "text-gray-300" : "text-gray-600"}`}>
              Project management interface coming soon...
            </p>
          </div>
        );
      case "exchanges":
        return (
          <div
            className={`${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } rounded-lg shadow-sm border p-6`}
          >
            <h2
              className={`text-2xl font-bold ${
                isDark ? "text-gray-100" : "text-gray-900"
              } mb-4`}
            >
              Task Exchanges
            </h2>
            <p className={`${isDark ? "text-gray-300" : "text-gray-600"}`}>
              Task exchange interface coming soon...
            </p>
          </div>
        );
      case "team":
        return (
          <div
            className={`${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } rounded-lg shadow-sm border p-6`}
          >
            <h2
              className={`text-2xl font-bold ${
                isDark ? "text-gray-100" : "text-gray-900"
              } mb-4`}
            >
              Team Overview
            </h2>
            <p className={`${isDark ? "text-gray-300" : "text-gray-600"}`}>
              Team management interface coming soon...
            </p>
          </div>
        );

      case "monitoring":
        return (
          <div
            className={`${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } rounded-lg shadow-sm border p-6`}
          >
            <h2
              className={`text-2xl font-bold ${
                isDark ? "text-gray-100" : "text-gray-900"
              } mb-4`}
            >
              Activity Monitor
            </h2>
            <p className={`${isDark ? "text-gray-300" : "text-gray-600"}`}>
              Activity monitoring interface coming soon...
            </p>
          </div>
        );
      case "flagged":
        return (
          <div
            className={`${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } rounded-lg shadow-sm border p-6`}
          >
            <h2
              className={`text-2xl font-bold ${
                isDark ? "text-gray-100" : "text-gray-900"
              } mb-4`}
            >
              Flagged Content
            </h2>
            <p className={`${isDark ? "text-gray-300" : "text-gray-600"}`}>
              Flagged content interface coming soon...
            </p>
          </div>
        );
      case "reports":
        return (
          <div className="h-full overflow-y-auto">
            <ReportPage />
          </div>
        );
      case "users":
        return (
          <div
            className={`${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } rounded-lg shadow-sm border p-6`}
          >
            <h2
              className={`text-2xl font-bold ${
                isDark ? "text-gray-100" : "text-gray-900"
              } mb-4`}
            >
              User Management
            </h2>
            <p className={`${isDark ? "text-gray-300" : "text-gray-600"}`}>
              User management interface coming soon...
            </p>
          </div>
        );
      case "system":
        return (
          <div
            className={`${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } rounded-lg shadow-sm border p-6`}
          >
            <h2
              className={`text-2xl font-bold ${
                isDark ? "text-gray-100" : "text-gray-900"
              } mb-4`}
            >
              System Configuration
            </h2>
            <p className={`${isDark ? "text-gray-300" : "text-gray-600"}`}>
              System configuration interface coming soon...
            </p>
          </div>
        );
      case "analytics":
        return (
          <div
            className={`${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } rounded-lg shadow-sm border p-6`}
          >
            <h2
              className={`text-2xl font-bold ${
                isDark ? "text-gray-100" : "text-gray-900"
              } mb-4`}
            >
              System Analytics
            </h2>
            <p className={`${isDark ? "text-gray-300" : "text-gray-600"}`}>
              Analytics interface coming soon...
            </p>
          </div>
        );
      case "logs":
        return (
          <div
            className={`${
              isDark
                ? "bg-gray-800 border-gray-700"
                : "bg-white border-gray-200"
            } rounded-lg shadow-sm border p-6`}
          >
            <h2
              className={`text-2xl font-bold ${
                isDark ? "text-gray-100" : "text-gray-900"
              } mb-4`}
            >
              System Logs
            </h2>
            <p className={`${isDark ? "text-gray-300" : "text-gray-600"}`}>
              System logs interface coming soon...
            </p>
          </div>
        );
      case "settings":
        return (
          <div className="max-w-4xl mx-auto">
            <h2
              className={`text-2xl font-bold ${
                isDark ? "text-gray-100" : "text-gray-900"
              } mb-6`}
            >
              Settings & Preferences
            </h2>

            {/* Theme Settings */}
            <div className="mb-6">
              <h3
                className={`text-lg font-semibold ${
                  isDark ? "text-gray-200" : "text-gray-800"
                } mb-4`}
              >
                Theme
              </h3>
              <div
                className={`${
                  isDark
                    ? "bg-gray-700 border-gray-600"
                    : "bg-gray-50 border-gray-200"
                } border rounded-lg p-4`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4
                      className={`font-medium ${
                        isDark ? "text-gray-100" : "text-gray-900"
                      }`}
                    >
                      Appearance
                    </h4>
                    <p
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      Choose your preferred theme for the interface
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </div>

            {/* Security Settings */}
            <div className="mb-6">
              <h3 className={`text-lg font-semibold ${isDark ? "text-gray-200" : "text-gray-800"} mb-4`}>
                Security
              </h3>
              <div className={`${isDark ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"} border rounded-lg p-4`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium flex items-center gap-2 ${isDark ? "text-gray-100" : "text-gray-900"}`}>
                      <Shield size={16} className="text-blue-500" />
                      Multi-Factor Authentication (MFA)
                    </h4>
                    <p className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      Add an extra layer of security to your account with Email OTP.
                    </p>
                  </div>
                  <button
                    onClick={handleToggleMfa}
                    disabled={isTogglingMfa}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      user?.mfaEnabled ? 'bg-blue-600' : isDark ? 'bg-gray-600' : 'bg-gray-300'
                    } disabled:opacity-50`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        user?.mfaEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* AI Preferences */}
            {user?.role === "MANAGER" && (
              <div className="mb-6">
                <h3
                  className={`text-lg font-semibold ${
                    isDark ? "text-gray-200" : "text-gray-800"
                  } mb-4`}
                >
                  AI Preferences
                </h3>
                <div
                  className={`${
                    isDark
                      ? "bg-gray-700 border-gray-600"
                      : "bg-gray-50 border-gray-200"
                  } border rounded-lg p-4`}
                >
                  <AIPreferencesSettings isDark={isDark} />
                </div>
              </div>
            )}
          </div>
        );
      default:
        return children; // Fallback to role-based dashboard
    }
  };

  // Views that need scrollable content instead of overflow-hidden
  const scrollableViews = [
    "dashboard",
    "project-analytics",
    "budget",
    "table",
    "gantt",
    "kanban",
    "calendar",
    "approvals",
    "admin-monitoring",
    "admin-ratelimits",
    "admin-users",
    "admin-auditlogs",
    "admin-backup",
  ];
  const adminViews = [
    "admin-monitoring",
    "admin-ratelimits",
    "admin-users",
    "admin-auditlogs",
    "admin-backup",
  ];
  const isAdminDashboard =
    user?.role === "ADMIN" && currentActiveView === "dashboard";
  const isAdminView = adminViews.includes(currentActiveView);
  const needsScroll =
    scrollableViews.includes(currentActiveView) &&
    !isAdminView &&
    !isAdminDashboard;
  const showSidebar = true;

  return (
    <div
      className={`fixed inset-0 z-[100] transition-colors duration-300 ${
        isDark ? "bg-[#111827]" : "bg-gray-100"
      } overflow-hidden`}
    >
      {/* Header */}
      <Header
        user={user}
        onLogout={onLogout}
        onNavigateToSettings={() => handleViewChange("settings")}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        showSidebarToggle={showSidebar}
        className={
          showSidebar ? (sidebarOpen ? "lg:left-56" : "lg:left-16") : "left-0"
        }
      />

      {/* Mobile Sidebar Overlay */}
      {showSidebar && sidebarOpen && (
        <div
          className={`fixed inset-0 z-[105] bg-black/60 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
            sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex h-full pt-16">
        {/* Sidebar */}
        {showSidebar && (
          <Sidebar
            user={user}
            activeView={currentActiveView}
            onViewChange={handleViewChange}
            // New props
            projects={projects}
            selectedProjectId={selectedProjectId}
            onProjectSelect={onProjectSelect}
            onLogout={onLogout}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        )}

        {/* Main Content */}
        <main
          className={`flex-1 ml-0 ${showSidebar ? (sidebarOpen ? "lg:ml-56" : "lg:ml-16") : ""} transition-all duration-300 h-full ${needsScroll ? "overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600" : "overflow-hidden"}`}
        >
          {/* Page Content - Optimized for mobile */}
          <div className="h-full w-full max-w-[100vw] overflow-x-hidden">
            {currentActiveView === "dashboard" ? (
              renderContent()
            ) : (
              <div
                className={`h-full flex flex-col ${needsScroll ? "overflow-visible" : "overflow-hidden"}`}
              >
                {/* Sidebar Toggle (Mobile) */}
                {showSidebar && (
                  <div className="lg:hidden p-4 pb-0">
                    <button
                      onClick={() => setSidebarOpen(!sidebarOpen)}
                      className={`p-2 rounded-md shadow-sm border ${isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"}`}
                    >
                      {sidebarOpen ? "←" : "→"}
                    </button>
                  </div>
                )}
                <div
                  className={`flex-1 min-h-0 ${needsScroll ? "overflow-visible" : "overflow-hidden"}`}
                >
                  {renderContent()}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* AI Assistant */}
      {user?.role !== "ADMIN" && <NovaAssistant />}
    </div>
  );
};

export default Layout;
