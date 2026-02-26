import React, { useState } from "react";
import {
  Home,
  Star,
  ChevronDown,
  ChartNoAxesCombined,
  TrendingUp,
  SlidersHorizontal,
  Users,
  Shield,
  FileText,
} from "lucide-react";
import { useTheme } from "../../context";

const Sidebar = ({
  user,
  sidebarOpen,
  setSidebarOpen,
  // Props from Dashboard -> Layout
  projects,
  selectedProjectId,
  onProjectSelect,
  activeView,
  onViewChange,
}) => {
  const { isDark } = useTheme();
  const isAdmin = user?.role === "ADMIN";

  const [isProjectsOpen, setIsProjectsOpen] = useState(true);

  const adminNavigation = [
    { id: "dashboard", label: "Overview", icon: ChartNoAxesCombined },
    { id: "admin-monitoring", label: "API Monitoring", icon: TrendingUp },
    {
      id: "admin-ratelimits",
      label: "Rate Limits",
      icon: SlidersHorizontal,
    },
    { id: "admin-users", label: "User Management", icon: Users },
    { id: "admin-auditlogs", label: "Audit Logs", icon: FileText },
    { id: "admin-backup", label: "System Backup", icon: Shield },
  ];

  // Helper to handle view change or project select
  const handleProjectClick = (projectId) => {
    if (onProjectSelect) {
      onProjectSelect(projectId);
    }
  };

  const handleViewClick = (viewId) => {
    if (onViewChange) {
      onViewChange(viewId);
    }
  };

  const closeSidebarOnMobile = () => {
    if (
      typeof window !== "undefined" &&
      window.innerWidth < 1024 &&
      setSidebarOpen
    ) {
      setSidebarOpen(false);
    }
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 z-50 w-64 ${
        isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
      } border-r transition-transform duration-300 ease-in-out transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } pt-16 flex flex-col h-full`}
    >
      {/* Navigation */}
      <div className="p-4 space-y-4 flex-1 overflow-y-auto min-h-0 pb-24">
        {isAdmin ? (
          <div className="space-y-2">
            <h3 className="px-3 text-xs font-bold uppercase tracking-wide text-gray-500">
              Admin
            </h3>
            {adminNavigation.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  handleViewClick(item.id);
                  if (onProjectSelect) onProjectSelect(null);
                  closeSidebarOnMobile();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all outline-none focus:outline-none ${
                  activeView === item.id
                    ? isDark
                      ? "bg-blue-900 text-blue-100"
                      : "bg-blue-50 text-blue-700"
                    : isDark
                      ? "text-gray-400 hover:bg-gray-700 hover:text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={() => {
                handleViewClick("dashboard");
                if (onProjectSelect) onProjectSelect(null);
                closeSidebarOnMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all outline-none focus:outline-none ${
                activeView === "dashboard" && !selectedProjectId
                  ? isDark
                    ? "bg-blue-900 text-blue-100"
                    : "bg-blue-50 text-blue-700"
                  : isDark
                    ? "text-gray-400 hover:bg-gray-700 hover:text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Home className="w-5 h-5" />
              <span>Home</span>
            </button>

            <button
              onClick={() => {
                handleViewClick("favorites");
                if (onProjectSelect) onProjectSelect(null);
                closeSidebarOnMobile();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all outline-none focus:outline-none ${
                activeView === "favorites"
                  ? isDark
                    ? "bg-blue-900 text-blue-100"
                    : "bg-blue-50 text-blue-700"
                  : isDark
                    ? "text-gray-400 hover:bg-gray-700 hover:text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Star className="w-5 h-5" />
              <span>Favorites</span>
            </button>
          </div>
        )}

        {/* Workspaces - Only show for Non-Admins if projects exist */}
        {!isAdmin && projects && projects.length > 0 && (
          <div>
            <div
              className={`flex items-center justify-between px-3 py-2 mb-2 cursor-pointer rounded-lg transition-colors ${
                isDark ? "hover:bg-gray-800" : "hover:bg-gray-100"
              }`}
              onClick={() => setIsProjectsOpen(!isProjectsOpen)}
            >
              <h3 className="text-xs font-bold uppercase text-gray-500">
                Projects
              </h3>
              <ChevronDown
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                  isProjectsOpen ? "" : "-rotate-90"
                }`}
              />
            </div>

            {/* Projects List */}
            {isProjectsOpen && (
              <div className="space-y-1">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      handleProjectClick(project.id);
                      closeSidebarOnMobile();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 outline-none focus:outline-none ${
                      selectedProjectId === project.id
                        ? isDark
                          ? "bg-blue-600 text-white"
                          : "bg-blue-600 text-white"
                        : isDark
                          ? "text-gray-300 hover:bg-gray-700"
                          : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span className="truncate">{project.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
