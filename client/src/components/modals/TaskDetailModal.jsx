import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button, Badge } from "../ui";
import { Lock } from "../ui/icons";
import MentionInput from "../ui/MentionInput";
import { toast } from "react-hot-toast";
import { tasksApi } from "../../api/tasks";
import { projectsApi } from "../../api/projects";
import { useTheme, useAuth } from "../../context"; // Assuming useAuth exists
import webSocketService from "../../services/websocket.service";
import RichTextRenderer from "../ui/RichTextRenderer";

import LogTimeModal from "./LogTimeModal";
import { formatTime } from "../../utils/timeUtils";
import LabelSelector from "../labels/LabelSelector";

const TASK_STATUSES = [
  { id: "PENDING", label: "To Do", color: "default" },
  { id: "IN_PROGRESS", label: "In Progress", color: "primary" },
  { id: "IN_REVIEW", label: "In Review", color: "warning" },
  { id: "COMPLETED", label: "Completed", color: "success" },
];

const StatusDropdown = ({
  currentStatus,
  onStatusChange,
  isDark,
  userRole,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentStatusObj =
    TASK_STATUSES.find((s) => s.id === currentStatus) || TASK_STATUSES[0];

  const getStatusColorClasses = (color) => {
    switch (color) {
      case "success":
        return isDark
          ? "bg-green-900/30 text-green-400 border-green-800"
          : "bg-green-100 text-green-800 border-green-200";
      case "warning":
        return isDark
          ? "bg-yellow-900/30 text-yellow-400 border-yellow-800"
          : "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "primary":
        return isDark
          ? "bg-blue-900/30 text-blue-400 border-blue-800"
          : "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return isDark
          ? "bg-gray-800 text-gray-400 border-gray-700"
          : "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${getStatusColorClasses(currentStatusObj.color)} hover:opacity-80`}
      >
        <span className="text-sm font-medium">{currentStatusObj.label}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 mt-2 w-48 rounded-lg shadow-xl border z-50 overflow-hidden ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
        >
          {TASK_STATUSES.map((status) => {
            if (userRole === "USER" && status.id === "COMPLETED") return null;
            if (
              currentStatus === "IN_REVIEW" &&
              userRole === "MANAGER" &&
              !["COMPLETED", "IN_PROGRESS", "IN_REVIEW"].includes(status.id)
            )
              return null;

            return (
              <button
                key={status.id}
                onClick={() => {
                  onStatusChange(status.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between
                ${isDark ? "hover:bg-gray-700 text-gray-200" : "hover:bg-gray-50 text-gray-700"}
                ${currentStatus === status.id ? (isDark ? "bg-gray-700/50" : "bg-blue-50/50") : ""}
              `}
              >
                <span>{status.label}</span>
                {currentStatus === status.id && (
                  <svg
                    className="w-4 h-4 text-blue-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const TaskDetailModal = ({ task, isOpen, onClose, onTaskUpdate }) => {
  const { isDark } = useTheme();
  const { user: currentUser } = useAuth(); // Get current user
  const [activeTab, setActiveTab] = useState("comments");
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [workLogsLoading, setWorkLogsLoading] = useState(false);
  const [isLogTimeModalOpen, setIsLogTimeModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState(null); // State for editing work log
  const [localTask, setLocalTask] = useState(task);
  const [taskLabels, setTaskLabels] = useState(task?.labels || []);

  const handleStatusUpdate = async (newStatus) => {
    if (localTask.status === newStatus) return;

    if (onTaskUpdate) {
      // Optimistic update locally
      setLocalTask((prev) => ({ ...prev, status: newStatus }));
      // Delegate API call to parent
      onTaskUpdate(task.id, newStatus);
    }
  };

  const handleDeleteWorkLog = async (logId) => {
    if (!confirm("Are you sure you want to delete this work log?")) return;
    try {
      setLoading(true);
      const response = await tasksApi.deleteWorkLog(logId);
      toast.success("Work log deleted");
      if (response.task) {
        setLocalTask(response.task);
      }
      loadWorkLogs();
      // Optionally refresh task to get updated totals, for now we let user refresh or impl optimistic
      // But loadData() pulls task details? No, it pulls comments.
      // Ideally we should reload the task to get new totals.
    } catch (error) {
      console.error("Error deleting work log:", error);
      toast.error("Failed to delete work log");
    } finally {
      setLoading(false);
    }
  };

  const handleEditWorkLog = (log) => {
    setEditingLog(log);
    setIsLogTimeModalOpen(true);
  };

  const [projectMembers, setProjectMembers] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);

  // Update local task when prop changes
  useEffect(() => {
    setLocalTask(task);
    setTaskLabels(task?.labels || []);
  }, [task]);

  // Handle ESC key press
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape" && isOpen && !isLogTimeModalOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose, isLogTimeModalOpen]);

  // Load comments, worklogs, and project members when task changes
  const loadData = useCallback(async () => {
    if (!task?.id) return;

    try {
      setCommentsLoading(true);
      const [commentsResponse, projectResponse] = await Promise.all([
        tasksApi.getComments(task.id),
        task.projectId
          ? projectsApi.getProject(task.projectId)
          : Promise.resolve({ data: { members: [] } }),
      ]);

      setComments(commentsResponse.data || []);
      if (projectResponse.data) {
        // Handle both flat (mock) and nested (Prisma) structures
        const members = (projectResponse.data.members || []).map(
          (m) => m.user || m,
        );

        // Include the manager if not already in the members list
        if (projectResponse.data.manager) {
          const managerId = projectResponse.data.manager.id;
          const isManagerInMembers = members.some((m) => m.id === managerId);
          if (!isManagerInMembers) {
            members.push(projectResponse.data.manager);
          }
        }

        setProjectMembers(members);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load task details");
    } finally {
      setCommentsLoading(false);
    }
  }, [task?.id, task?.projectId]);

  const loadWorkLogs = useCallback(async () => {
    if (!task?.id) return;
    try {
      setWorkLogsLoading(true);
      const response = await tasksApi.getWorkLogs(task.id);
      setWorkLogs(response.data || []);
    } catch (error) {
      console.error("Error loading work logs:", error);
      // toast.error("Failed to load work logs");
    } finally {
      setWorkLogsLoading(false);
    }
  }, [task?.id]);

  useEffect(() => {
    if (task?.id) {
      // Reset tab to comments when opening a new task or keep it?
      // Let's keep comments as default if not already set or maybe "All"
      // But user requirement screenshot shows tabs.
      loadData();
      loadWorkLogs();
    }
  }, [task?.id, loadData, loadWorkLogs]);

  // Real-time comment updates
  useEffect(() => {
    const handleCommentAdded = (newComment) => {
      if (newComment.taskId === task?.id) {
        setComments((prev) => {
          const exists = prev.some((c) => c.id === newComment.id);
          if (exists) return prev;
          return [newComment, ...prev];
        });
      }
    };

    webSocketService.onCommentAdded(handleCommentAdded);

    return () => {
      if (webSocketService.socket) {
        webSocketService.socket.off("comment-added", handleCommentAdded);
      }
    };
  }, [task?.id]);

  const handleCommentChange = (e) => {
    const value = e.target.value;
    const position = e.target.selectionStart;
    setNewComment(value);
    setCursorPosition(position);

    // Check for mention trigger
    const lastAtPos = value.lastIndexOf("@", position - 1);
    if (lastAtPos !== -1) {
      const textAfterAt = value.substring(lastAtPos + 1, position);
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setShowMentions(true);
        setMentionQuery(textAfterAt);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (username) => {
    const lastAtPos = newComment.lastIndexOf("@", cursorPosition - 1);
    if (lastAtPos !== -1) {
      const newValue =
        newComment.substring(0, lastAtPos) +
        `@${username} ` +
        newComment.substring(cursorPosition);
      setNewComment(newValue);
      setShowMentions(false);
    }
  };

  const filteredMembers = projectMembers.filter(
    (member) =>
      (member.username?.toLowerCase() || "").includes(
        mentionQuery.toLowerCase(),
      ) ||
      (member.name?.toLowerCase() || "").includes(mentionQuery.toLowerCase()),
  );

  const isSubmittingRef = useRef(false);

  const handleAddComment = async (e) => {
    if (e) e.preventDefault();

    if (!newComment.trim() || isSubmittingRef.current) return;

    try {
      isSubmittingRef.current = true;
      setLoading(true);
      const response = await tasksApi.addComment(task.id, {
        content: newComment.trim(),
      });

      if (response.data) {
        setComments((prev) => {
          if (prev.some((c) => c.id === response.data.id)) return prev;
          return [response.data, ...prev];
        });
        setNewComment("");
        toast.success("Comment added successfully");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setLoading(false);
      setTimeout(() => {
        isSubmittingRef.current = false;
      }, 500);
    }
  };

  const handleLogTime = async (logData) => {
    try {
      setLoading(true);

      if (editingLog) {
        // Update existing log
        const response = await tasksApi.updateWorkLog(editingLog.id, logData);
        if (response.success) {
          toast.success("Work log updated successfully");
          if (response.task) {
            setLocalTask(response.task);
          }
        }
      } else {
        // Create new log
        const payload = {
          taskId: task.id,
          ...logData,
        };
        const response = await tasksApi.logTime(payload);
        if (response.success) {
          toast.success("Time logged successfully");
          if (response.task) {
            setLocalTask(response.task);
          }
        }
      }

      setIsLogTimeModalOpen(false);
      setEditingLog(null);
      loadWorkLogs(); // Refresh logs
      // Note: We should also update localTask totals here if the backend returns the updated task
      // The current backend implementation returns `{ success: true, data: ..., task: ... }`
      // But I need to check the API client wrapper response.
      // Assuming it refetches or I should trigger a task reload?
    } catch (error) {
      console.error("Error logging time:", error);
      toast.error("Failed to save work log");
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH":
        return "text-red-600 bg-red-100";
      case "MEDIUM":
        return "text-yellow-600 bg-yellow-100";
      case "LOW":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "COMPLETED":
        return "success";
      case "IN_REVIEW":
        return "warning";
      case "IN_PROGRESS":
        return "primary";
      case "PENDING":
        return "default";
      default:
        return "default";
    }
  };

  if (!isOpen || !task || !localTask) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Glassmorphism Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal - Solid Background */}
      <div
        className={`relative ${
          isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
        } border rounded-lg shadow-2xl max-w-5xl w-full h-[75vh] flex flex-col overflow-hidden`}
      >
        <div className="p-4 sm:p-6 flex-shrink-0 border-b border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2
                className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"} mb-2`}
              >
                {localTask.title}
              </h2>
              <div className="flex items-center gap-3">
                {/* Status Dropdown */}
                {localTask.status === "COMPLETED" ? (
                  <Badge
                    variant="success"
                    size="sm"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <Lock className="w-4 h-4" />{" "}
                    <span className="text-sm font-medium">Completed</span>
                  </Badge>
                ) : (
                  <StatusDropdown
                    currentStatus={localTask.status}
                    onStatusChange={handleStatusUpdate}
                    isDark={isDark}
                    userRole={currentUser?.role}
                  />
                )}

                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(localTask.priority)}`}
                >
                  {localTask.priority} Priority
                </span>

                {/* Time Tracking Progress (Mini) */}
                {localTask.timeSpent > 0 && (
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${isDark ? "bg-blue-900 text-blue-200" : "bg-blue-100 text-blue-800"}`}
                  >
                    {formatTime(localTask.timeSpent)} logged
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className={`${isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-600"} transition-colors`}
            >
              <svg
                className="w-6 h-6"
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
        </div>

        {/* Main Content - Side by Side Layout */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* LEFT PANEL: Task Details & Description */}
          <div className="w-full md:w-3/5 flex flex-col p-4 sm:p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
            {/* 1. Meta Details Header Row */}
            <div className="mb-6 pb-6 border-b border-gray-100 dark:border-gray-700/50">
              <h3
                className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                Key Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <span
                    className={`block text-xs font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Assigned to
                  </span>
                  <div className="flex items-center gap-2">
                    {localTask.assignee?.avatar && (
                      <img
                        src={localTask.assignee.avatar}
                        alt=""
                        className="w-5 h-5 rounded-full"
                      />
                    )}
                    <span
                      className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-900"}`}
                    >
                      {localTask.assignee?.username || "Unassigned"}
                    </span>
                  </div>
                </div>
                <div>
                  <span
                    className={`block text-xs font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Project
                  </span>
                  <span
                    className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-900"}`}
                  >
                    {localTask.project?.name || "Unknown"}
                  </span>
                </div>
                <div>
                  <span
                    className={`block text-xs font-medium mb-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Due date
                  </span>
                  <span
                    className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-900"}`}
                  >
                    {localTask.dueDate
                      ? new Date(localTask.dueDate).toLocaleDateString()
                      : "No due date"}
                  </span>
                </div>
              </div>

              {/* AI Prediction Section */}
              {localTask.predictions && localTask.predictions.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div
                    className={`rounded-lg p-4 ${isDark ? "bg-blue-900/20 border border-blue-800/30" : "bg-blue-50 border border-blue-200"}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${isDark ? "bg-blue-800/30" : "bg-white"}`}
                      >
                        <svg
                          className={`w-5 h-5 ${isDark ? "text-blue-400" : "text-blue-600"}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4
                            className={`text-sm font-semibold ${isDark ? "text-blue-300" : "text-blue-900"}`}
                          >
                            🤖 Nova AI Prediction
                          </h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${isDark ? "bg-blue-800/50 text-blue-200" : "bg-blue-100 text-blue-800"}`}
                          >
                            {Math.round(
                              localTask.predictions[0].confidence * 100,
                            )}
                            % confident
                          </span>
                        </div>
                        <p
                          className={`text-sm ${isDark ? "text-blue-200" : "text-blue-800"} mb-2`}
                        >
                          Predicted completion:{" "}
                          <span className="font-semibold">
                            {new Date(
                              localTask.predictions[0].predictedCompletionAt,
                            ).toLocaleDateString("en-US", {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </p>
                        {localTask.predictions[0].factors && (
                          <div
                            className={`text-xs ${isDark ? "text-blue-300/70" : "text-blue-700/70"} space-y-0.5`}
                          >
                            {/* Render factors as text if it's an object */}
                            {typeof localTask.predictions[0].factors ===
                              "object" &&
                            !localTask.predictions[0].factors.similarTasksCount
                              ? Object.entries(
                                  localTask.predictions[0].factors,
                                ).map(([key, value]) => (
                                  <div key={key} className="capitalize">
                                    {key}: {String(value)}
                                  </div>
                                ))
                              : null}

                            {localTask.predictions[0].factors
                              ?.similarTasksCount !== undefined && (
                              <div>
                                • Based on{" "}
                                {
                                  localTask.predictions[0].factors
                                    .similarTasksCount
                                }{" "}
                                similar task
                                {localTask.predictions[0].factors
                                  .similarTasksCount !== 1
                                  ? "s"
                                  : ""}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Description Section (Full Width) */}
            <div>
              <h3
                className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                Description
              </h3>
              <div
                className={`prose prose-sm max-w-none ${isDark ? "prose-invert" : ""} ${isDark ? "text-gray-300" : "text-gray-600"}`}
              >
                {localTask.description ? (
                  <p className="whitespace-pre-wrap leading-relaxed">
                    {localTask.description}
                  </p>
                ) : (
                  <p className="italic opacity-60">No description provided.</p>
                )}
              </div>
            </div>

            {/* 3. Labels Section */}
            <div className="mt-6">
              <h3
                className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                Labels
              </h3>
              <LabelSelector
                taskId={localTask.id}
                projectId={localTask.projectId}
                selectedLabels={taskLabels}
                onChange={setTaskLabels}
              />
            </div>
          </div>

          {/* RIGHT PANEL: Activity Stream (Tabs + List) */}
          <div className="w-full md:w-2/5 flex flex-col bg-gray-50/50 dark:bg-gray-800/20">
            {/* Tabs Bar */}
            <div className="flex-shrink-0 px-4 pt-2 border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
              <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500 dark:text-gray-400">
                <li className="mr-2">
                  <button
                    onClick={() => setActiveTab("all")}
                    className={`inline-block p-3 border-b-2 rounded-t-lg ${activeTab === "all" ? "text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500" : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"}`}
                  >
                    All
                  </button>
                </li>
                <li className="mr-2">
                  <button
                    onClick={() => setActiveTab("comments")}
                    className={`inline-block p-3 border-b-2 rounded-t-lg ${activeTab === "comments" ? "text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500" : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"}`}
                  >
                    Comments
                  </button>
                </li>
                <li className="mr-2">
                  <button
                    onClick={() => setActiveTab("worklog")}
                    className={`inline-block p-3 border-b-2 rounded-t-lg ${activeTab === "worklog" ? "text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500" : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"}`}
                  >
                    Work log
                  </button>
                </li>
                {/* <li className="mr-2">
                  <button
                    onClick={() => setActiveTab("history")}
                    className={`inline-block p-3 border-b-2 rounded-t-lg ${activeTab === "history" ? "text-blue-600 border-blue-600 dark:text-blue-500 dark:border-blue-500" : "border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300"}`}
                  >
                    History
                  </button>
                </li> */}
              </ul>
            </div>

            {/* Scrollable Activity Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {/* Add Comment Input (Always visible at top of stream for quick access?) */}
              {/* Let's keep it inside the scroll for now, or sticky? Inside scroll is safer layout-wise */}

              {/* Comments Tab Content */}
              {(activeTab === "comments" || activeTab === "all") && (
                <div className="mb-8">
                  {activeTab === "all" && (
                    <h4
                      className={`text-sm font-bold uppercase mb-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Comments
                    </h4>
                  )}
                  <form onSubmit={handleAddComment} className="mb-6">
                    <div className="flex gap-2 items-start">
                      <div className="flex-1">
                        <MentionInput
                          value={newComment}
                          onChange={setNewComment}
                          onSubmit={handleAddComment}
                          placeholder="Add a comment... (@ to mention)"
                          users={projectMembers}
                          disabled={loading}
                        />
                      </div>
                      <Button
                        type="submit"
                        variant="primary"
                        disabled={loading || !newComment.trim()}
                        size="sm"
                        className="mt-0.5"
                      >
                        Add
                      </Button>
                    </div>
                  </form>

                  <div className="space-y-3">
                    {commentsLoading ? (
                      [1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-lg ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border shadow-sm`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div
                              className={`h-4 w-24 rounded animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                            />
                            <div
                              className={`h-3 w-32 rounded animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                            />
                          </div>
                          <div className="space-y-2">
                            <div
                              className={`h-3 w-full rounded animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                            />
                            <div
                              className={`h-3 w-3/4 rounded animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        {comments.map((comment) => (
                          <div
                            key={comment.id}
                            className={`p-3 rounded-lg ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border shadow-sm`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span
                                className={`font-medium text-sm ${isDark ? "text-gray-200" : "text-gray-900"}`}
                              >
                                {comment.author?.username ||
                                  comment.authorName ||
                                  "User"}
                              </span>
                              <span
                                className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                              >
                                {comment.createdAt
                                  ? new Date(comment.createdAt).toLocaleString()
                                  : ""}
                              </span>
                            </div>
                            <p
                              className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"} whitespace-pre-wrap`}
                            >
                              {comment.content
                                .split(/(@[\w.]+)/g)
                                .map((part, i) => {
                                  if (part.startsWith("@")) {
                                    return (
                                      <span
                                        key={i}
                                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 mx-0.5"
                                      >
                                        {part}
                                      </span>
                                    );
                                  }
                                  return part;
                                })}
                            </p>
                          </div>
                        ))}
                        {comments.length === 0 && activeTab === "comments" && (
                          <p
                            className={`text-center py-4 text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
                          >
                            No comments yet.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Work Log Tab Content */}
              {(activeTab === "worklog" || activeTab === "all") && (
                <div className="mb-6">
                  {activeTab === "all" && (
                    <h4
                      className={`text-sm font-bold uppercase mb-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Work Log
                    </h4>
                  )}
                  {/* Summary Widget - Only show if time logged > 0 */}
                  {localTask.timeSpent > 0 ? (
                    <div className="flex items-center justify-between p-3 mb-4 rounded-lg border border-blue-100 bg-blue-50 dark:border-blue-900/30 dark:bg-blue-900/10">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${isDark ? "bg-blue-800" : "bg-white"}`}
                        >
                          <svg
                            className="w-5 h-5 text-blue-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <div>
                          <div
                            className={`text-sm font-semibold ${isDark ? "text-blue-100" : "text-blue-900"}`}
                          >
                            {formatTime(localTask.timeSpent || 0)} logged
                          </div>
                          {localTask.timeRemaining && (
                            <div
                              className={`text-xs ${isDark ? "text-blue-300" : "text-blue-700"}`}
                            >
                              {formatTime(localTask.timeRemaining)} remaining
                            </div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Check if user already has a log
                          const userLog = workLogs.find(
                            (l) => l.userId === currentUser?.id,
                          );
                          if (userLog) {
                            toast.success(
                              "You have already logged time. Editing your existing log.",
                            );
                            setEditingLog(userLog);
                          } else {
                            setEditingLog(null);
                          }
                          setIsLogTimeModalOpen(true);
                        }}
                      >
                        Log Time
                      </Button>
                    </div>
                  ) : (
                    <div className="flex justify-end mb-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // Check if user already has a log
                          const userLog = workLogs.find(
                            (l) => l.userId === currentUser?.id,
                          );
                          if (userLog) {
                            toast.success(
                              "You have already logged time. Editing your existing log.",
                            );
                            setEditingLog(userLog);
                          } else {
                            setEditingLog(null);
                          }
                          setIsLogTimeModalOpen(true);
                        }}
                      >
                        Log Time
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    {workLogsLoading ? (
                      [1, 2].map((i) => (
                        <div
                          key={i}
                          className={`flex items-start gap-3 p-3 rounded border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex-shrink-0 animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                          />
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center justify-between">
                              <div
                                className={`h-4 w-24 rounded animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                              />
                              <div
                                className={`h-3 w-16 rounded animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                              />
                            </div>
                            <div
                              className={`h-3 w-32 rounded animate-pulse ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        {workLogs.map((log) => (
                          <div
                            key={log.id}
                            className={`group flex items-start gap-3 p-3 rounded border ${isDark ? "bg-gray-800 border-gray-700 hover:border-gray-600" : "bg-white border-gray-200 hover:border-gray-300"} transition-colors`}
                          >
                            <div
                              className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"}`}
                            >
                              {log.user?.username?.charAt(0).toUpperCase() ||
                                "U"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span
                                  className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-900"}`}
                                >
                                  {log.user?.username}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
                                  >
                                    {new Date(
                                      log.startedAt,
                                    ).toLocaleDateString()}
                                  </span>
                                  {/* Edit/Delete Actions */}
                                  <button
                                    onClick={() => handleEditWorkLog(log)}
                                    className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                                    title="Edit"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteWorkLog(log.id)}
                                    className={`p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500`}
                                    title="Delete"
                                  >
                                    <svg
                                      className="w-4 h-4"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>

                              <p
                                className={`text-sm mb-1 ${isDark ? "text-gray-300" : "text-gray-600"}`}
                              >
                                Logged <b>{formatTime(log.timeSpent)}</b>
                              </p>

                              {log.description && (
                                <div className="mt-2 pl-2 border-l-2 border-gray-200 dark:border-gray-700">
                                  <RichTextRenderer content={log.description} />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {workLogs.length === 0 && activeTab === "worklog" && (
                          <p
                            className={`text-center py-2 ${isDark ? "text-gray-500" : "text-gray-400"}`}
                          >
                            No work logged yet.
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* History Tab (Placeholder) */}
              {activeTab === "history" && (
                <div
                  className={`text-center py-8 ${isDark ? "text-gray-500" : "text-gray-400"}`}
                >
                  History not implemented yet.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Log Time Modal */}
        {isLogTimeModalOpen && (
          <LogTimeModal
            isOpen={isLogTimeModalOpen}
            onClose={() => {
              setIsLogTimeModalOpen(false);
              setEditingLog(null);
            }}
            onSave={handleLogTime}
            task={localTask}
            loading={loading}
            initialData={editingLog}
            projectMembers={projectMembers}
          />
        )}
      </div>
    </div>
  );
};

export default TaskDetailModal;
