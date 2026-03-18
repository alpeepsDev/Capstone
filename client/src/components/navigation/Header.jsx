import React from "react";
import { useTheme } from "../../context";
import { NotificationBell } from "../notifications";
import { Menu, X, Search } from "lucide-react";
import GlobalSearch from "../search/GlobalSearch";

const Header = ({
  sidebarOpen,
  setSidebarOpen,
  showSidebarToggle = true,
  className = "",
  user,
  mobileSearchOpen = false,
  onMobileSearchToggle,
}) => {
  const { isDark } = useTheme();
  const isAdmin = user?.role === "ADMIN";

  return (
    <header
      className={`${isDark ? "bg-[#111827]/95 border-slate-800" : "bg-white/95 border-slate-200"} fixed top-0 left-0 right-0 z-[100] border-b transition-all duration-300 backdrop-blur-md ${className}`}
    >
      <div className="flex min-h-16 flex-col">
        <div className="flex min-h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            {showSidebarToggle && (
              <button
                onClick={() => setSidebarOpen && setSidebarOpen(!sidebarOpen)}
                className={`lg:hidden rounded-lg p-2 transition-colors ${
                  isDark
                    ? "text-gray-400 hover:bg-gray-800 hover:text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
                aria-label={sidebarOpen ? "Close navigation" : "Open navigation"}
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            )}
          </div>

          {!isAdmin && (
            <div className="hidden flex-1 px-4 lg:flex lg:max-w-xl lg:px-8">
              <GlobalSearch />
            </div>
          )}

          <div className="flex items-center gap-3">
            {!isAdmin && (
              <button
                type="button"
                onClick={() => onMobileSearchToggle?.(!mobileSearchOpen)}
                className={`lg:hidden rounded-lg p-2 transition-colors ${
                  isDark
                    ? "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
                aria-expanded={mobileSearchOpen}
                aria-label={mobileSearchOpen ? "Close search" : "Open search"}
              >
                {mobileSearchOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </button>
            )}

            {!isAdmin && <NotificationBell />}
          </div>
        </div>

        {!isAdmin && mobileSearchOpen && (
          <div
            className={`border-t px-4 pb-4 pt-2 lg:hidden ${
              isDark ? "border-slate-800" : "border-slate-200"
            }`}
          >
            <GlobalSearch />
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
