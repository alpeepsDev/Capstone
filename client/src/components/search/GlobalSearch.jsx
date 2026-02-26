import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { searchApi } from "../../api/search";
import { useTheme } from "../../context";
import { Search, Loader2, FileText, Layout, X } from "lucide-react";

// Hook for debouncing
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const GlobalSearch = ({ className = "" }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ projects: [], tasks: [] });
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const containerRef = useRef(null);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedQuery.trim()) {
        setResults({ projects: [], tasks: [] });
        return;
      }

      setLoading(true);
      try {
        const data = await searchApi.globalSearch(debouncedQuery);
        setResults(data);
        setIsOpen(true);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectProject = (projectId) => {
    navigate(`/dashboard?projectId=${projectId}`);
    setIsOpen(false);
    setQuery("");
  };

  const handleSelectTask = (task) => {
    // Navigate to project and open task modal via URL params
    navigate(`/dashboard?projectId=${task.projectId}&taskId=${task.id}`);
    setIsOpen(false);
    setQuery("");
  };

  const clearSearch = () => {
    setQuery("");
    setResults({ projects: [], tasks: [] });
    setIsOpen(false);
  };

  const hasResults = results.projects.length > 0 || results.tasks.length > 0;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search
            className={`h-4 w-4 ${isDark ? "text-gray-500" : "text-gray-400"}`}
          />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim()) setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          placeholder="Search projects and tasks..."
          className={`block w-full pl-10 pr-10 py-2 border ${
            isDark
              ? "border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:ring-blue-400"
              : "border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-blue-500"
          } rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-colors`}
        />
        {(loading || query) && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            ) : (
              <button
                onClick={clearSearch}
                className={`p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && query.trim() !== "" && (
        <div
          className={`absolute top-full left-0 right-0 mt-2 rounded-lg shadow-lg border p-2 z-50 max-h-[80vh] overflow-y-auto ${
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"
          }`}
        >
          {!loading && !hasResults ? (
            <div
              className={`p-4 text-center text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              No results found for "{query}"
            </div>
          ) : (
            <>
              {results.projects.length > 0 && (
                <div className="mb-2">
                  <div
                    className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}
                  >
                    Projects
                  </div>
                  {results.projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleSelectProject(project.id)}
                      className={`w-full text-left px-3 py-2 rounded-md flex items-center gap-3 transition-colors ${
                        isDark
                          ? "hover:bg-gray-700 text-gray-200"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <Layout className="h-4 w-4 text-blue-500" />
                      <div>
                        <div className="text-sm font-medium">
                          {project.name}
                        </div>
                        {project.description && (
                          <div
                            className={`text-xs truncate max-w-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                          >
                            {project.description}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.tasks.length > 0 && (
                <div>
                  <div
                    className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}
                  >
                    Tasks
                  </div>
                  {results.tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleSelectTask(task)}
                      className={`w-full text-left px-3 py-2 rounded-md flex items-start gap-3 transition-colors ${
                        isDark
                          ? "hover:bg-gray-700 text-gray-200"
                          : "hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      <FileText
                        className={`h-4 w-4 mt-0.5 ${
                          task.status === "IN_REVIEW" ||
                          task.status === "COMPLETED"
                            ? "text-green-500"
                            : "text-orange-500"
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">
                          {task.title}
                        </div>
                        <div
                          className={`text-xs flex items-center gap-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                        >
                          <span className="truncate max-w-[150px]">
                            {task.project?.name}
                          </span>
                          <span>•</span>
                          <span
                            className={`${
                              task.status === "IN_REVIEW" ||
                              task.status === "COMPLETED"
                                ? "text-green-600"
                                : "text-orange-500"
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
