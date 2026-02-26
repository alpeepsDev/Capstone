import React, { useState, useEffect } from "react";
import { Button } from "../ui";
import { parseTime, formatTime } from "../../utils/timeUtils";
import { toast } from "react-hot-toast";
import { useTheme, useAuth } from "../../context"; // Assuming useAuth exists in context
import RichMentionEditor from "../ui/RichMentionEditor";

const LogTimeModal = ({
  isOpen,
  onClose,
  onSave,
  task,
  loading,
  initialData,
  projectMembers = [],
}) => {
  const { isDark } = useTheme();
  const [timeSpent, setTimeSpent] = useState("");
  const [timeRemaining, setTimeRemaining] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState("");
  const [logType, setLogType] = useState("duration"); // 'duration' | 'range'

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Edit Mode
        setTimeSpent(formatTime(initialData.timeSpent));
        // keep timeRemaining as "current task remaining" or empty,
        // to avoid confusion unless backend supports recalculating it specifically.
        setTimeRemaining(
          task?.timeRemaining != null ? formatTime(task.timeRemaining) : "",
        );
        setDescription(initialData.description || "");
        if (initialData.startedAt) {
          setDate(new Date(initialData.startedAt).toISOString().slice(0, 16));
        }
      } else {
        // Create Mode
        if (task) {
          if (task.timeRemaining !== null && task.timeRemaining !== undefined) {
            setTimeRemaining(formatTime(task.timeRemaining));
          } else {
            setTimeRemaining("");
          }
        }
        setTimeSpent("");
        setDescription("");

        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        setDate(now.toISOString().slice(0, 16));
      }
    }
  }, [isOpen, task, initialData]);

  // Auto-calculate time remaining when timeSpent changes
  useEffect(() => {
    if (!timeSpent || !task) return;

    const spentMinutes = parseTime(timeSpent);
    if (spentMinutes === null) return;

    let baseRemaining = task.timeRemaining;

    // If we are editing, we need to add back the original time spent to the current 'remaining'
    // effectively "undoing" the previous log before applying the new one.
    if (initialData && initialData.timeSpent) {
      if (baseRemaining !== null && baseRemaining !== undefined) {
        baseRemaining += initialData.timeSpent;
      } else {
        // If it was null, assume we are starting from 0 + what we are taking back
        baseRemaining = initialData.timeSpent;
      }
    } else if (baseRemaining === null || baseRemaining === undefined) {
      // If creating new log and no estimate, assume 0 base
      baseRemaining = 0;
    }

    const newRemaining = Math.max(0, baseRemaining - spentMinutes);
    setTimeRemaining(formatTime(newRemaining));
  }, [timeSpent, task, initialData]);

  // Auto-calculate time spent from range
  useEffect(() => {
    if (logType === "range" && date && endDate) {
      const start = new Date(date);
      const end = new Date(endDate);
      const diffMs = end - start;

      if (diffMs > 0) {
        const diffMinutes = Math.floor(diffMs / 60000);
        setTimeSpent(formatTime(diffMinutes));
      } else {
        // If end date is before start date or same
        setTimeSpent("");
      }
    }
  }, [date, endDate, logType]);

  // Handle ESC key press
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const timeSpentMinutes = parseTime(timeSpent);
    if (!timeSpentMinutes) {
      toast.error("Please enter a valid time spent (e.g., 2h 30m)");
      return;
    }

    const timeRemainingMinutes = timeRemaining
      ? parseTime(timeRemaining)
      : undefined;

    onSave({
      timeSpent: timeSpentMinutes,
      timeRemaining: timeRemainingMinutes,
      date,
      description,
    });
  };

  const handleTimeSpentChange = (e) => {
    const val = e.target.value;
    setTimeSpent(val);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-20">
      {/* Glassmorphism Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-md bg-black/30"
        onClick={onClose}
      />

      {/* Modal with Glassmorphism Effect */}
      <div
        className={`relative ${
          isDark
            ? "bg-gray-900/95 border-gray-700/50"
            : "bg-white/95 border-gray-200/50"
        } backdrop-blur-xl border rounded-lg shadow-2xl w-full max-w-3xl overflow-hidden`}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2
              className={`text-lg font-semibold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              {initialData ? "Edit Work Log" : "Log Time"}
            </h2>
            <button
              onClick={onClose}
              className={`${
                isDark
                  ? "text-gray-400 hover:text-gray-300"
                  : "text-gray-400 hover:text-gray-600"
              } transition-colors p-1`}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {!task.timeSpent && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800 rounded-md">
              <p
                className={`text-sm ${isDark ? "text-blue-200" : "text-blue-800"}`}
              >
                No time was logged for this Feature yet. Logging time lets you
                track and report on the time spent on the work.
              </p>
            </div>
          )}

          {task.timeSpent > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span className={isDark ? "text-gray-400" : "text-gray-600"}>
                  Time spent
                </span>
                <span className={isDark ? "text-white" : "text-gray-900"}>
                  {formatTime(task.timeSpent)} logged
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-full"></div>
                {/* Width should be calculated relative to estimate if available, otherwise full */}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className={`text-sm font-medium mb-1 block ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Time spent
                </label>
                <input
                  type="text"
                  value={timeSpent}
                  onChange={handleTimeSpentChange}
                  placeholder="2w 4d 6h 45m"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  } ${logType === "range" ? "opacity-70 cursor-not-allowed" : ""}`}
                  readOnly={logType === "range"}
                  autoFocus={logType === "duration"}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use the format: 2w 4d 6h 45m
                </p>
              </div>
              <div>
                <label
                  className={`text-sm font-medium mb-1 block ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Time remaining
                </label>
                <input
                  type="text"
                  value={timeRemaining}
                  onChange={(e) => setTimeRemaining(e.target.value)}
                  placeholder="e.g. 1d 2h"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                  }`}
                />
              </div>
            </div>

            {/* Toggle for Range vs Duration */}
            <div className="flex items-center gap-2 mb-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={logType === "range"}
                  onChange={() =>
                    setLogType(logType === "range" ? "duration" : "range")
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                <span
                  className={`ml-2 text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Log by Date Range
                </span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className={`text-sm font-medium mb-1 block ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {logType === "range" ? "Start Date" : "Date"}
                </label>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                />
              </div>

              {logType === "range" && (
                <div>
                  <label
                    className={`text-sm font-medium mb-1 block ${
                      isDark ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      isDark
                        ? "bg-gray-700 border-gray-600 text-white"
                        : "bg-white border-gray-300 text-gray-900"
                    }`}
                  />
                </div>
              )}
            </div>

            <div>
              <label
                className={`text-sm font-medium mb-1 block ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Description (Optional)
              </label>
              <RichMentionEditor
                value={description}
                onChange={setDescription}
                placeholder="Type something..."
                users={projectMembers}
                disabled={loading}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={loading || !timeSpent}
              >
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LogTimeModal;
