import React from "react";
import { useTheme } from "../../context";

const ThemeToggle = () => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <div className="flex items-center gap-3">
      {/* Single Toggle Switch */}
      <button
        onClick={toggleTheme}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
          isDark ? "bg-blue-600" : "bg-gray-400"
        }`}
        aria-label="Toggle theme"
      >
        <span
          className={`inline-flex h-4 w-4 items-center justify-center transform rounded-full bg-white shadow-lg transition duration-300 ${
            isDark ? "translate-x-6" : "translate-x-1"
          }`}
        >
          {isDark ? (
            // Moon icon for dark mode (showing current state)
            <svg
              className="w-3 h-3 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          ) : (
            // Sun icon for light mode (showing current state)
            <svg
              className="w-3 h-3 text-yellow-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          )}
        </span>
      </button>

      {/* Theme Status Text */}
      <span
        className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-700"}`}
      >
        {isDark ? "Dark Mode" : "Light Mode"}
      </span>
    </div>
  );
};

export default ThemeToggle;
