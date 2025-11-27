import React, { useState } from "react";
import { useTheme } from "../../context";
import { Header, Sidebar } from "../navigation";
import { ThemeToggle } from "../ui";

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

  // Determine which activeView to use
  const currentActiveView =
    propActiveView !== undefined ? propActiveView : localActiveView;

  const handleViewChange = (viewId) => {
    if (onViewChange) {
      onViewChange(viewId);
    } else {
      setLocalActiveView(viewId);
    }
    console.log("Navigating to:", viewId);
  };

  // Render different content based on activeView
  const getViewDescription = (view) => {
    const descriptions = {
      dashboard: "Main Overview",
      tasks: "Task Management",
      projects: "Project Management",
      team: "Team Collaboration",
      exchanges: "Task Exchange",
      calendar: "Schedule View",
      reports: "Analytics",
      settings: "Configuration",
      profile: "User Profile",
    };
    return descriptions[view] || "Current Section";
  };

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
      case "approvals":
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
              Task Approvals
            </h2>
            <p className={`${isDark ? "text-gray-300" : "text-gray-600"}`}>
              Task approval interface coming soon...
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
              Reports
            </h2>
            <p className={`${isDark ? "text-gray-300" : "text-gray-600"}`}>
              Reports interface coming soon...
            </p>
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
              } mb-6`}
            >
              Settings & Preferences
            </h2>

            {/* Theme Settings */}
            <div className="mb-8">
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
                } border rounded-lg p-6`}
              >
                <div className="space-y-4">
                  <div>
                    <h4
                      className={`font-medium ${
                        isDark ? "text-gray-100" : "text-gray-900"
                      } mb-2`}
                    >
                      Appearance
                    </h4>
                    <p
                      className={`text-sm ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      } mb-4`}
                    >
                      Choose your preferred theme for the interface
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return children; // Fallback to role-based dashboard
    }
  };

  return (
    <div
      className={`h-screen ${
        isDark ? "bg-gray-900" : "bg-gray-100"
      } transition-colors duration-200 overflow-hidden pt-16`}
    >
      {/* Header */}
      <Header
        user={user}
        onLogout={onLogout}
        onNavigateToSettings={() => handleViewChange("settings")}
      />

      <div className="flex h-full">
        {/* Sidebar */}
        {sidebarOpen && (
          <Sidebar
            user={user}
            activeView={currentActiveView}
            onViewChange={handleViewChange}
            // New props
            projects={projects}
            selectedProjectId={selectedProjectId}
            onProjectSelect={onProjectSelect}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
          />
        )}

        {/* Main Content */}
        <main
          className={`flex-1 ${sidebarOpen ? "ml-64" : "ml-0"} transition-all duration-200 h-full overflow-hidden`}
        >
          {/* Page Content - Only show extra content for non-dashboard views */}
          {currentActiveView === "dashboard" ? (
            renderContent()
          ) : (
            <div className="p-4">
              {/* Sidebar Toggle (Mobile) */}
              <div className="lg:hidden mb-4">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 bg-white rounded-md shadow-sm border"
                >
                  {sidebarOpen ? "←" : "→"}
                </button>
              </div>
              {renderContent()}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Layout;
