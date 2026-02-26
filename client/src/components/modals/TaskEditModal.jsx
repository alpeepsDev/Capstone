import React, { useState, useEffect } from "react";
import { Button } from "../ui";
import { toast } from "react-hot-toast";
import { useTheme, useAuth } from "../../context";

const TaskEditModal = ({ task, isOpen, onClose, onSave, users = [] }) => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assigneeId: "",
    priority: "MEDIUM",
    status: "PENDING",
    dueDate: "",
    changeNote: "", // Add this for moderator notes
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || "",
        description: task.description || "",
        assigneeId: task.assigneeId || "",
        priority: task.priority || "MEDIUM",
        status: task.status || "PENDING",
        dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
        changeNote: "", // Always start with empty change note
      });
    }
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    if (!formData.changeNote.trim()) {
      toast.error("Please explain what changes are needed");
      return;
    }

    setLoading(true);
    try {
      // Include the change note in the update
      const updateData = {
        ...formData,
        changeNote: formData.changeNote.trim(),
      };

      await onSave(task.id, updateData);
      toast.success("Changes requested successfully!");
      onClose();
    } catch (error) {
      console.error("Failed to request changes:", error);
      toast.error("Failed to request changes");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
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
        } backdrop-blur-xl border rounded-lg shadow-2xl w-full max-w-md max-h-[75vh] overflow-y-auto`}
      >
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2
              className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Request Changes
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Title */}
            <div>
              <label
                className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-1`}
              >
                Task Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
                placeholder="Enter task title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label
                className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-1`}
              >
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
                placeholder="Enter task description"
              />
            </div>

            {/* Assignee */}
            <div>
              <label
                className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-1`}
              >
                Assignee
              </label>
              <select
                name="assigneeId"
                value={formData.assigneeId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="">Unassigned</option>
                {users.length === 0 ? (
                  <option disabled>No users available</option>
                ) : (
                  users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} - {user.name}
                    </option>
                  ))
                )}
              </select>
              {users.length === 0 && (
                <p
                  className={`text-sm ${isDark ? "text-red-400" : "text-red-600"} mt-1`}
                >
                  No users available for assignment. Please refresh the page or
                  contact your administrator.
                </p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label
                className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-1`}
              >
                Priority
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label
                className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-1`}
              >
                Status (Request Changes)
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="PENDING">Pending (Needs to start over)</option>
                <option value="IN_PROGRESS">
                  In Progress (Needs revision)
                </option>
                <option value="IN_REVIEW">
                  In Review (Ready for re-approval)
                </option>
                {user?.role !== "USER" && (
                  <option value="COMPLETED">Completed (Approved)</option>
                )}
              </select>
            </div>

            {/* Change Note */}
            <div>
              <label
                className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-1`}
              >
                What changes are needed? *
              </label>
              <textarea
                name="changeNote"
                value={formData.changeNote}
                onChange={handleChange}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
                placeholder="Explain what needs to be changed or improved..."
                required
              />
              <p
                className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"} mt-1`}
              >
                This note will be sent to the assignee explaining what changes
                are required.
              </p>
            </div>

            {/* Due Date */}
            <div>
              <label
                className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-1`}
              >
                Due Date
              </label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className="flex-1 w-full sm:w-auto"
              >
                {loading ? "Requesting Changes..." : "Request Changes"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
                className="w-full sm:w-auto"
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

export default TaskEditModal;
