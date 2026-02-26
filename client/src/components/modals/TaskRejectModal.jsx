import React, { useState, useEffect } from "react";
import { Button } from "../ui";
import { useTheme } from "../../context";

const TaskRejectModal = ({ task, isOpen, onClose, onReject }) => {
  const { isDark } = useTheme();
  const [reason, setReason] = useState("");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    if (isOpen && task) {
      setReason("");
      setDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
    }
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onReject(reason, dueDate);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-md bg-black/30"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative ${isDark ? "bg-gray-900/95 border-gray-700/50" : "bg-white/95 border-gray-200/50"} backdrop-blur-xl border rounded-lg shadow-2xl w-full max-w-md`}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2
              className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Reject Task & Request Changes
            </h2>
            <button
              onClick={onClose}
              className={`${isDark ? "text-gray-400 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"} transition-colors p-1`}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-1`}
              >
                Reason for Rejection *
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                required
                placeholder="Explain what needs to be changed..."
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-1`}
              >
                Adjust Due Date (Optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" variant="danger" className="flex-1">
                Reject Task
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TaskRejectModal;
