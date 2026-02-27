import React, { useState, useEffect } from "react";
import { Button } from "../ui";
import { toast } from "react-hot-toast";
import { useTheme } from "../../context";

const AddTaskModal = ({
  isOpen,
  onClose,
  onSave,
  selectedProject,
  projects = [],
  users = [],
}) => {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    projectId: selectedProject?.id || "",
    assigneeId: "",
    priority: "MEDIUM",
    status: "PENDING",
    dueDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Sync projectId when selectedProject changes
  useEffect(() => {
    if (selectedProject?.id) {
      setFormData((prev) => ({
        ...prev,
        projectId: selectedProject.id,
      }));
    }
  }, [selectedProject]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Inline validation
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = "Task title is required";
    }
    if (!formData.projectId) {
      errors.projectId = "Please select a project";
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setLoading(true);
    try {
      const taskData = {
        ...formData,
        dueDate: formData.dueDate || null,
      };
      await onSave(taskData);
      toast.success("Task created successfully!");

      // Reset form
      setFormData({
        title: "",
        description: "",
        projectId: selectedProject?.id || "",
        assigneeId: "",
        priority: "MEDIUM",
        status: "PENDING",
        dueDate: "",
      });

      onClose();
    } catch (error) {
      console.error("Failed to create task:", error);
      toast.error("Failed to create task");
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
    // Clear field error on change
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Get users for the selected project, sorted by task count (least busy first)
  const getProjectUsers = () => {
    if (!formData.projectId) return [];

    const project = projects.find((p) => p.id === formData.projectId);
    if (!project) return [];

    console.log("🔍 Selected project:", project);
    console.log("🔍 Project members:", project.members);

    // Get project members only
    const members = project.members || [];
    let projectUsers = [];

    // Handle different data structures - check if members exist and have users
    if (members.length > 0 && members[0].user) {
      projectUsers = members.map((member) => ({
        ...member,
        taskCount: member.user._count?.assignedTasks || 0,
      }));
    } else if (members.length > 0 && members[0].username) {
      // If members is an array of user objects directly
      projectUsers = members.map((user) => ({
        userId: user.id,
        user,
        taskCount: user._count?.assignedTasks || 0,
      }));
    } else {
      // Fallback: filter all users to only those who are members of this project
      const memberIds = members.map((m) => m.userId || m.id);
      projectUsers = users
        .filter((user) => memberIds.includes(user.id))
        .map((user) => ({
          userId: user.id,
          user,
          taskCount: user._count?.assignedTasks || 0,
        }));
    }

    console.log("🔍 Processed project users:", projectUsers);

    // Sort by task count (least busy first), then by name
    return projectUsers.sort((a, b) => {
      const aTaskCount = a.taskCount || 0;
      const bTaskCount = b.taskCount || 0;

      if (aTaskCount !== bTaskCount) {
        return aTaskCount - bTaskCount; // Ascending (least tasks first)
      }

      // If same task count, sort by name
      const aName = (a.user?.name || a.user?.username || "").toLowerCase();
      const bName = (b.user?.name || b.user?.username || "").toLowerCase();
      return aName.localeCompare(bName);
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-20"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-task-modal-title"
    >
      {/* Glassmorphism Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-md bg-black/30"
        onClick={onClose}
        aria-label="Close modal"
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
              id="add-task-modal-title"
              className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Create New Task
            </h2>
            <button
              onClick={onClose}
              aria-label="Close modal"
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
            {/* Project Selection - Hide dropdown if specific project is selected */}
            {selectedProject ? (
              <div>
                <label
                  htmlFor="add-task-project"
                  className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-1`}
                >
                  Project
                </label>
                <div
                  className={`w-full px-3 py-2 border rounded-md ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  } opacity-75`}
                >
                  {selectedProject.name}
                </div>
                {/* Hidden input to maintain form data */}
                <input
                  type="hidden"
                  name="projectId"
                  value={selectedProject.id}
                />
              </div>
            ) : (
              <div>
                <label
                  htmlFor="add-task-project-select"
                  className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-1`}
                >
                  Project *
                </label>
                <select
                  id="add-task-project-select"
                  name="projectId"
                  value={formData.projectId}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  }`}
                  required
                >
                  <option value="">Select a project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.projectId && (
                  <p className="mt-1 text-sm text-red-500" role="alert">
                    {fieldErrors.projectId}
                  </p>
                )}
              </div>
            )}

            {/* Title */}
            <div>
              <label
                htmlFor="add-task-title"
                className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-1`}
              >
                Task Title *
              </label>
              <input
                type="text"
                id="add-task-title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                aria-invalid={!!fieldErrors.title}
                aria-describedby={fieldErrors.title ? "title-error" : undefined}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  fieldErrors.title
                    ? "border-red-500 focus:ring-red-500"
                    : isDark
                      ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
                }`}
                placeholder="Enter task title"
                required
              />
              {fieldErrors.title && (
                <p
                  id="title-error"
                  className="mt-1 text-sm text-red-500"
                  role="alert"
                >
                  {fieldErrors.title}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="add-task-description"
                className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-1`}
              >
                Description
              </label>
              <textarea
                id="add-task-description"
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
                htmlFor="add-task-assignee"
                className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-1`}
              >
                Assignee (Project Members Only)
              </label>
              <select
                id="add-task-assignee"
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
                {getProjectUsers().map((member) => {
                  const user = member.user || member;
                  const userId = member.userId || member.id;
                  const displayName =
                    user.name || user.username || "Unknown User";
                  const username = user.username || "";
                  const taskCount = member.taskCount || 0;

                  return (
                    <option key={userId} value={userId}>
                      {username ? `${username} - ${displayName}` : displayName}{" "}
                      ({taskCount} tasks)
                    </option>
                  );
                })}
              </select>
              {formData.projectId && getProjectUsers().length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  No team members found in selected project
                </p>
              )}
              {getProjectUsers().length > 0 && (
                <p
                  className={`text-xs ${isDark ? "text-green-400" : "text-green-600"} mt-1`}
                >
                  {getProjectUsers().length} project member(s) available (sorted
                  by workload)
                </p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label
                htmlFor="add-task-priority"
                className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-1`}
              >
                Priority
              </label>
              <select
                id="add-task-priority"
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

            {/* Initial Status */}
            <div>
              <label
                htmlFor="add-task-status"
                className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-1`}
              >
                Initial Status
              </label>
              <select
                id="add-task-status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-white"
                    : "bg-white border-gray-300 text-gray-900"
                }`}
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label
                htmlFor="add-task-duedate"
                className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-1`}
              >
                Due Date
              </label>
              <input
                id="add-task-duedate"
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                min={new Date().toISOString().split("T")[0]}
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
                {loading ? "Creating..." : "Create Task"}
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

export default AddTaskModal;
