import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "../../context";
import { NotificationBell } from "../notifications";
import logo from "../../assets/logo.svg";

const Header = ({ user, onLogout, onNavigateToSettings }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { isDark } = useTheme();

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
      <div className="flex items-center justify-between h-full px-6">
        {/* Left Section - Logo */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="TaskForge Logo"
              className="w-8 h-8 rounded-lg object-cover"
            />
            <span
              className={`text-xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              TaskForge
            </span>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="hidden lg:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className={`h-4 w-4 ${isDark ? "text-gray-500" : "text-gray-400"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search anything..."
              className={`block w-full pl-10 pr-3 py-2 border ${isDark ? "border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:ring-blue-400" : "border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-blue-500"} rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
            />
          </div>
        </div>

        {/* Right Section - Tools and User */}
        <div className="flex items-center gap-3">
          {/* Mobile Search Button */}
          <button
            className={`lg:hidden p-2 ${isDark ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"} rounded-lg transition-colors`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>

          {/* Notification Bell */}
          <NotificationBell />

          {/* User Avatar and Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={`flex items-center gap-2 p-1 ${isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"} rounded-lg transition-colors`}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {user?.username?.charAt(0)?.toUpperCase() || "U"}
                </span>
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
              <svg
                className={`w-4 h-4 ${isDark ? "text-gray-500" : "text-gray-400"}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
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
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user?.username?.charAt(0)?.toUpperCase() || "U"}
                      </span>
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
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Preferences
                  </button>
                  <div
                    className={`border-t ${isDark ? "border-gray-700" : "border-gray-100"} my-2`}
                  ></div>
                  <button
                    onClick={onLogout}
                    className={`w-full text-left px-4 py-2 text-sm ${isDark ? "text-red-400 hover:bg-gray-700" : "text-red-700 hover:bg-red-50"} flex items-center gap-3`}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
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
