import React, { useState, useEffect } from "react";
import { useTheme } from "../../context";
import { NotificationBell } from "../notifications";
import webSocketService from "../../services/websocket.service";

import { Menu, X, Search } from "lucide-react";
import GlobalSearch from "../search/GlobalSearch";

const Header = ({
  sidebarOpen,
  setSidebarOpen,
  showSidebarToggle = true,
  className = "",
  user,
}) => {
  const { isDark } = useTheme();
  const isAdmin = user?.role === "ADMIN";

  return (
    <header
      className={`${isDark ? "bg-[#111827]/95 border-slate-800" : "bg-white/95 border-slate-200"} border-b h-16 fixed top-0 left-0 right-0 z-[100] transition-all duration-300 backdrop-blur-md ${className}`}
    >
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left Section - Menu Toggle */}
        <div className="flex items-center gap-4">
          {showSidebarToggle && (
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
          )}
        </div>

        {/* Center Section - Search */}
        {!isAdmin && (
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <GlobalSearch />
          </div>
        )}

        {/* Right Section - Notifications & Mobile Search */}
        <div className="flex items-center gap-3">
          {!isAdmin && (
            <button
              className={`lg:hidden p-2 ${isDark ? "text-gray-400 hover:text-gray-200 hover:bg-gray-800" : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"} rounded-lg transition-colors`}
            >
              <Search className="w-5 h-5" />
            </button>
          )}

          {!isAdmin && <NotificationBell />}
        </div>
      </div>
    </header>
  );
};

export default Header;
