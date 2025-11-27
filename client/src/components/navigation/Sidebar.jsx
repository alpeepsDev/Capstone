import React, { useState } from "react";
import { Menu, X, Home, Star, Plus, ChevronDown, Settings } from "lucide-react";
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
  const [expandedWorkspace, setExpandedWorkspace] = useState(true);

  // If sidebarOpen prop is not provided (e.g. used in other contexts), default to true
  // But here we expect it from Layout.
  // If setSidebarOpen is not provided, we can't toggle.

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

  return (
    <div
      className={`w-64 ${
        isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
      } border-r transition-all duration-300 overflow-y-auto flex flex-col fixed left-0 top-16 h-[calc(100vh-4rem)] z-40`}
    >
      {/* Navigation */}
      <div className="p-4 space-y-4 flex-1">
        {/* Quick Links */}
        <div className="space-y-2">
          <button
            onClick={() => {
              handleViewClick("dashboard");
              if (onProjectSelect) onProjectSelect(null);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
              activeView === "dashboard"
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
            onClick={() => handleViewClick("favorites")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
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

        {/* Workspaces - Only show if projects exist (User role) */}
        {projects && projects.length > 0 && (
          <div>
            <div className="flex items-center justify-between px-3 py-2 mb-2">
              <h3 className="text-xs font-bold uppercase text-gray-500">
                Workspaces
              </h3>
              <Plus className="w-4 h-4 cursor-pointer hover:text-blue-600" />
            </div>

            {/* Workspace Selector */}
            <div
              onClick={() => setExpandedWorkspace(!expandedWorkspace)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                M
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">Main Workspace</p>
              </div>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  expandedWorkspace ? "rotate-180" : ""
                }`}
              />
            </div>

            {/* Projects List */}
            {expandedWorkspace && (
              <div className="mt-2 ml-2 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => handleProjectClick(project.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                      selectedProjectId === project.id
                        ? isDark
                          ? "bg-blue-600 text-white"
                          : "bg-blue-600 text-white"
                        : isDark
                          ? "text-gray-300 hover:bg-gray-700"
                          : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full bg-current opacity-60"></div>
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
