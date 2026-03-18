import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  Star,
  ChevronDown,
  TrendingUp,
  SlidersHorizontal,
  Users,
  Shield,
  FileText,
  Settings,
  LayoutDashboard,
  PanelLeft,
  ChevronUp,
  Layers,
  ChartNoAxesCombined,
  LogOut,
  Camera,
  X,
} from "lucide-react";
import { useTheme } from "../../context";
import { authService } from "../../api/auth";
import webSocketService from "../../services/websocket.service";
import logger from "../../utils/logger.js";

const NavItem = ({
  icon: Icon,
  label,
  active,
  onClick,
  collapsed,
  isDark,
  labelClassName = "",
}) => {
  return (
    <div className="relative group px-2">
      <button
        onClick={onClick}
        className={`w-full flex items-center ${collapsed ? "justify-center" : "gap-3 px-3"} py-2 rounded-lg transition-all outline-none focus:outline-none ${
          active
            ? isDark
              ? "bg-blue-600 text-white"
              : "bg-blue-600 text-white shadow-sm"
            : isDark
              ? "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        }`}
      >
        <Icon
          className={`${collapsed ? "w-5 h-5" : "w-4 h-4"} flex-shrink-0 transition-transform duration-200 group-hover:scale-110`}
        />
        {!collapsed && (
          <span
            className={`${labelClassName || "text-sm"} font-medium whitespace-nowrap overflow-hidden`}
          >
            {label}
          </span>
        )}
      </button>

      {/* Popover Tooltip for Collapsed State */}
      {collapsed && (
        <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-[120] pointer-events-none shadow-xl border border-slate-800">
          {label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-900" />
        </div>
      )}
    </div>
  );
};

const Sidebar = ({
  user,
  sidebarOpen,
  setSidebarOpen,
  projects,
  selectedProjectId,
  onProjectSelect,
  activeView,
  onViewChange,
  onLogout,
}) => {
  const { isDark } = useTheme();
  const isAdmin = user?.role === "ADMIN";
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1440,
  );
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(
    webSocketService.getConnectionStatus().isConnected,
  );

  const profileMenuRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for WebSocket connection changes
  useEffect(() => {
    const unsubscribe = webSocketService.addConnectionListener((connected) => {
      setIsConnected(connected);
    });
    return unsubscribe;
  }, []);

  // Close avatar preview on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setIsAvatarPreviewOpen(false);
    };
    if (isAvatarPreviewOpen) {
      document.addEventListener("keydown", handleEsc);
    }
    return () => document.removeEventListener("keydown", handleEsc);
  }, [isAvatarPreviewOpen]);

  const isDesktop = viewportWidth >= 1024;
  const mobileSidebarWidth = Math.max(240, Math.min(320, viewportWidth - 24));

  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith("http")) return avatarPath;
    return `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/${avatarPath}`;
  };

  const handleAvatarClick = (e) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("avatar", file);
      await authService.uploadAvatar(formData);
      window.location.reload();
    } catch (error) {
      logger.error("Failed to upload avatar:", error);
      alert("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await onLogout();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = isAdmin
    ? [
        { id: "dashboard", label: "Overview", icon: LayoutDashboard },
        { id: "admin-monitoring", label: "API Monitoring", icon: TrendingUp },
        {
          id: "admin-ratelimits",
          label: "Rate Limits",
          icon: SlidersHorizontal,
        },
        { id: "admin-users", label: "User Management", icon: Users },
        { id: "admin-auditlogs", label: "Audit Logs", icon: FileText },
        { id: "admin-backup", label: "System Backup", icon: Shield },
      ]
    : [
        { id: "dashboard", label: "Home", icon: Home },
        { id: "favorites", label: "Favorites", icon: Star },
        { id: "reports", label: "Reports", icon: FileText },
      ];

  const handleAction = (id, type = "view") => {
    if (type === "view" && onViewChange) {
      onViewChange(id);
      if (onProjectSelect) onProjectSelect(null);
    } else if (type === "project" && onProjectSelect) {
      onProjectSelect(id);
    }

    if (
      typeof window !== "undefined" &&
      window.innerWidth < 1024 &&
      setSidebarOpen
    ) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      <motion.div
        initial={false}
        animate={{
          width: sidebarOpen ? (isDesktop ? 224 : mobileSidebarWidth) : 64,
          x: !isDesktop && !sidebarOpen ? -mobileSidebarWidth : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`fixed inset-y-0 left-0 z-[110] ${
          isDark ? "bg-[#111827] border-slate-800" : "bg-white border-slate-200"
        } border-r flex flex-col h-full overflow-x-hidden transition-colors duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Top Section - Branding */}
        <div className="p-4 mb-2">
          <div
            className={`flex items-center ${sidebarOpen ? "gap-3" : "justify-center"}`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isAdmin ? (isDark ? "bg-blue-900/40" : "bg-blue-100") : ""
              }`}
            >
              {isAdmin ? (
                <ChartNoAxesCombined className="w-5 h-5 text-blue-600" />
              ) : (
                <img
                  src="/logo.svg"
                  alt="Logo"
                  className="w-8 h-8 rounded-lg object-cover"
                />
              )}
            </div>
            {sidebarOpen && (
              <span
                className={`text-lg font-bold truncate ${isDark ? "text-white" : "text-slate-900"}`}
              >
                TaskForge
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-2 space-y-6 scrollbar-hide overflow-x-hidden">
          <div>
            {sidebarOpen && (
              <p className="px-5 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Platform
              </p>
            )}
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavItem
                  key={item.id}
                  {...item}
                  active={activeView === item.id && !selectedProjectId}
                  onClick={() => handleAction(item.id)}
                  collapsed={!sidebarOpen}
                  isDark={isDark}
                />
              ))}
            </div>
          </div>

          {!isAdmin && projects && projects.length > 0 && (
            <div>
              {sidebarOpen && (
                <div
                  className="flex items-center justify-between px-5 mb-2 group cursor-pointer"
                  onClick={() => setIsProjectsOpen(!isProjectsOpen)}
                >
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Workspaces
                  </p>
                  <ChevronDown
                    size={12}
                    className={`text-slate-500 transition-transform ${isProjectsOpen ? "" : "-rotate-90"}`}
                  />
                </div>
              )}

              {(isProjectsOpen || !sidebarOpen) && (
                <div className="space-y-1">
                  {projects.map((project) => (
                    <NavItem
                      key={project.id}
                      label={project.name}
                      icon={Layers}
                      active={selectedProjectId === project.id}
                      onClick={() => handleAction(project.id, "project")}
                      collapsed={!sidebarOpen}
                      isDark={isDark}
                      labelClassName="text-[13px]"
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Section - User Profile */}
        <div
          className={`p-3 mt-auto border-t ${isDark ? "border-slate-800" : "border-slate-200"}`}
        >
          <div className="relative" ref={profileMenuRef}>
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />

            <div
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className={`p-2 rounded-lg flex items-center ${sidebarOpen ? "gap-3" : "justify-center"} hover:bg-slate-500/10 transition-colors cursor-pointer group`}
            >
              <div className="relative">
                <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-slate-200 dark:ring-slate-700 bg-gradient-to-br from-blue-500 to-indigo-600">
                  {user?.avatar ? (
                    <img
                      src={getAvatarUrl(user.avatar)}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                      {user?.username?.charAt(0)?.toUpperCase()}
                    </div>
                  )}

                  {/* Upload Overlay (Only visible when expanded for better UX, or as a small indicator when collapsed) */}
                  <div
                    onClick={handleAvatarClick}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                  >
                    {isUploading ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Camera className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>

                {/* Online Status Dot */}
                <span
                  className={`absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ${
                    isDark ? "ring-slate-900" : "ring-white"
                  } ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                  title={isConnected ? "Online" : "Offline"}
                />
              </div>

              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${isDark ? "text-slate-100" : "text-slate-900"}`}
                  >
                    {user?.username}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {user?.email}
                  </p>
                </div>
              )}
              {sidebarOpen && (
                <ChevronUp
                  size={14}
                  className={`text-slate-500 transition-transform ${isProfileMenuOpen ? "rotate-180" : ""}`}
                />
              )}

              {!sidebarOpen && (
                <div className="absolute left-full ml-4 px-2.5 py-1.5 bg-slate-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-[120] shadow-xl border border-slate-800">
                  {user?.username}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-slate-900" />
                </div>
              )}
            </div>

            <AnimatePresence>
              {isProfileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: -8, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className={`absolute ${sidebarOpen ? "bottom-full left-0 right-0" : "bottom-0 left-full ml-4"} mb-2 w-48 ${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} rounded-xl shadow-2xl border p-1.5 z-[130] origin-bottom`}
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                    <p
                      className={`text-xs font-bold uppercase tracking-wider ${isDark ? "text-slate-500" : "text-slate-400"}`}
                    >
                      Account
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAvatarPreviewOpen(true);
                      setIsProfileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${isDark ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                  >
                    <Camera size={16} />
                    View Avatar
                  </button>
                  <button
                    onClick={() => {
                      onViewChange && onViewChange("settings");
                      setIsProfileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${isDark ? "text-slate-300 hover:bg-slate-800 hover:text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                  >
                    <Settings size={16} />
                    Preferences
                  </button>
                  <div
                    className={`h-px my-1.5 ${isDark ? "bg-slate-800" : "bg-slate-100"}`}
                  />
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors font-medium ${
                      isLoggingOut
                        ? "text-red-400 bg-red-500/5 cursor-not-allowed"
                        : "text-red-500 hover:bg-red-500/10"
                    }`}
                  >
                    {isLoggingOut ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin" />
                        Signing out...
                      </>
                    ) : (
                      <>
                        <LogOut size={16} />
                        Sign Out
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`hidden w-full mt-4 items-center ${sidebarOpen ? "justify-start gap-3 px-3" : "justify-center"} py-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-500/10 transition-all lg:flex`}
          >
            <PanelLeft size={20} className="flex-shrink-0" />
            {sidebarOpen && (
              <span className="text-sm font-medium">Collapse</span>
            )}
          </button>
        </div>
      </motion.div>

      {/* Fullscreen Avatar Preview */}
      {isAvatarPreviewOpen &&
        ReactDOM.createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={() => setIsAvatarPreviewOpen(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-xl transition-all" />
            <div
              className="relative z-10 max-w-sm w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute top-4 right-4 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors"
                onClick={() => setIsAvatarPreviewOpen(false)}
              >
                <X size={18} />
              </button>
              <div className="aspect-square w-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600">
                {user?.avatar ? (
                  <img
                    src={getAvatarUrl(user.avatar)}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-6xl">
                    {user?.username?.charAt(0)?.toUpperCase()}
                  </span>
                )}
              </div>
              <div className="p-6 text-center">
                <h3 className="text-xl font-bold dark:text-white mb-1">
                  {user?.username}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  {user?.email}
                </p>
                <button
                  onClick={handleAvatarClick}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Camera size={18} />
                  Change Avatar
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default Sidebar;
