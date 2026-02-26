import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../../context";
import { NotificationBell } from "../notifications";
import webSocketService from "../../services/websocket.service";
import { authService } from "../../api/auth";

import {
  Menu,
  X,
  Camera,
  Search,
  ChevronDown,
  Settings,
  LogOut,
  ChartNoAxesCombined,
} from "lucide-react";
import GlobalSearch from "../search/GlobalSearch";

const Header = ({
  user,
  onLogout,
  onNavigateToSettings,
  sidebarOpen,
  setSidebarOpen,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(
    webSocketService.getConnectionStatus().isConnected,
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const { isDark } = useTheme();
  const isAdmin = user?.role === "ADMIN";

  // ... (keep existing useEffect and helper functions)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Listen for WebSocket connection changes
  useEffect(() => {
    const unsubscribe = webSocketService.addConnectionListener((connected) => {
      setIsConnected(connected);
    });
    return unsubscribe;
  }, []);

  const getRoleColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "bg-red-100 text-red-800";
      case "MODERATOR":
        return "bg-yellow-100 text-yellow-800";
      case "MANAGER":
        return "bg-green-100 text-green-800";
      case "USER":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size should be less than 5MB");
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("avatar", file);

      await authService.uploadAvatar(formData);

      // Force reload to show new avatar (or update context if we had access to setUser)
      // Since we don't have setUser from props, we rely on the parent or a full reload
      // Ideally, Header should receive a setUser prop or useAuth hook
      window.location.reload();
    } catch (error) {
      console.error("Failed to upload avatar:", error);
      alert("Failed to upload avatar");
    } finally {
      setIsUploading(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "ADMIN":
        return "🧑‍💻";
      case "MODERATOR":
        return "🛡️";
      case "MANAGER":
        return "👨‍💼";
      case "USER":
        return "👤";
      default:
        return "👤";
    }
  };

  // Helper to get avatar URL
  const getAvatarUrl = (avatarPath) => {
    if (!avatarPath) return null;
    if (avatarPath.startsWith("http")) return avatarPath;
    return `${import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"}/${avatarPath}`;
  };

  // If user is not loaded yet, show loading state
  if (!user) {
    return (
      <header className="bg-white border-b border-gray-200 h-16">
        <div className="flex items-center justify-between h-full px-6">
          <div className="flex items-center">
            <div className="text-2xl font-bold text-blue-600">TaskForge</div>
          </div>
          <div className="flex items-center gap-4">
            <div className="animate-pulse w-8 h-8 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header
      className={`${isDark ? "bg-gray-900/95 border-gray-700" : "bg-white/95 border-gray-200"} border-b h-16 fixed top-0 left-0 right-0 z-[100] transition-colors duration-200 backdrop-blur-md`}
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left Section - Logo & Menu */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setSidebarOpen && setSidebarOpen(!sidebarOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              isDark
                ? "text-gray-400 hover:bg-gray-800 hover:text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <div className="flex items-center gap-3">
            {isAdmin ? (
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDark ? "bg-blue-900/40" : "bg-blue-100"
                }`}
              >
                <ChartNoAxesCombined className="w-5 h-5 text-blue-600" />
              </div>
            ) : (
              <img
                src="/logo.svg"
                alt="TaskForge Logo"
                className="w-8 h-8 rounded-lg object-cover"
              />
            )}
            <span
              className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              TaskForge
            </span>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="hidden lg:flex flex-1 max-w-md mx-8">
          <GlobalSearch />
        </div>

        {/* Right Section - Tools and User */}
        <div className="flex items-center gap-3">
          {/* Mobile Search Button */}
          <button
            className={`lg:hidden p-2 ${isDark ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"} rounded-lg transition-colors`}
          >
            <Search className="w-5 h-5" />
          </button>

          {/* Notification Bell */}
          <NotificationBell />

          {/* User Avatar and Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*"
            />
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-2 p-1 ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"} rounded-lg transition-colors`}
            >
              <div className="relative group">
                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                  {user?.avatar ? (
                    <img
                      src={getAvatarUrl(user.avatar)}
                      alt={user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white font-medium text-sm">
                      {user?.username?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                  )}

                  {/* Upload Overlay */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAvatarClick();
                    }}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {isUploading ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Camera className="w-3 h-3 text-white" />
                    )}
                  </div>
                </div>
                <span
                  className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ring-2 ${
                    isDark ? "ring-gray-900" : "ring-white"
                  } ${isConnected ? "bg-green-500" : "bg-red-500"}`}
                  title={isConnected ? "Online" : "Offline"}
                />
              </div>
              <div className="hidden sm:block text-left">
                <div
                  className={`text-sm font-medium ${isDark ? "text-gray-100" : "text-gray-900"}`}
                >
                  {user?.username || "User"}
                </div>
                <div
                  className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  {user?.role || "USER"}
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div
                className={`absolute right-0 mt-2 w-64 ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-lg shadow-lg border py-2 z-10`}
              >
                {/* User Info */}
                <div
                  className={`px-4 py-3 border-b ${isDark ? "border-gray-700" : "border-gray-100"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                      {user?.avatar ? (
                        <img
                          src={getAvatarUrl(user.avatar)}
                          alt={user.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-medium">
                          {user?.username?.charAt(0)?.toUpperCase() || "U"}
                        </span>
                      )}
                    </div>
                    <div>
                      <div
                        className={`font-medium ${isDark ? "text-gray-100" : "text-gray-900"}`}
                      >
                        {user?.name || user?.username}
                      </div>
                      <div
                        className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        {user?.email}
                      </div>
                      <div
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getRoleColor(user?.role)}`}
                      >
                        {getRoleIcon(user?.role)} {user?.role || "USER"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={() => {
                      onNavigateToSettings && onNavigateToSettings();
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm ${isDark ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-50"} flex items-center gap-3`}
                  >
                    <Settings className="w-4 h-4" />
                    Preferences
                  </button>
                  <div
                    className={`border-t ${isDark ? "border-gray-700" : "border-gray-100"} my-2`}
                  ></div>
                  <button
                    onClick={onLogout}
                    className={`w-full text-left px-4 py-2 text-sm ${isDark ? "text-red-400 hover:bg-gray-700" : "text-red-700 hover:bg-red-50"} flex items-center gap-3`}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
