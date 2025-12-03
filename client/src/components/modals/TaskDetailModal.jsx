import React, { useState, useEffect, useCallback } from "react";
import { Button, Badge } from "../ui";
import MentionInput from "../ui/MentionInput";
import { toast } from "react-hot-toast";
import { tasksApi } from "../../api/tasks";
import { projectsApi } from "../../api/projects";
import { useTheme } from "../../context";
import webSocketService from "../../services/websocket.service";

const TaskDetailModal = ({ task, isOpen, onClose }) => {
  const { isDark } = useTheme();
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [projectMembers, setProjectMembers] = useState([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);

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

  // Load comments and project members when task changes
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
      if (projectResponse.data?.members) {
        // Handle both flat (mock) and nested (Prisma) structures
        const members = projectResponse.data.members.map((m) => m.user || m);
        setProjectMembers(members);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load task details");
    } finally {
      setCommentsLoading(false);
    }
  }, [task?.id, task?.projectId]);

  useEffect(() => {
    if (task?.id) {
      loadData();
    }
  }, [task?.id, loadData]);

  // Real-time comment updates
  useEffect(() => {
    const handleCommentAdded = (newComment) => {
      if (newComment.taskId === task?.id) {
        setComments((prev) => {
          // Check if comment already exists
          const exists = prev.some((c) => c.id === newComment.id);
          if (exists) {
            return prev;
          }
          return [newComment, ...prev];
        });
      }
    };

    webSocketService.onCommentAdded(handleCommentAdded);

    return () => {
      // We need a way to remove the specific listener.
      // Since webSocketService.onCommentAdded just calls socket.on,
      // we should use socket.off if the service doesn't expose an off method for this specific event.
      // But looking at previous code, it seems we might need to implement offCommentAdded or use socket directly.
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
      // Focus back to textarea would be ideal here
    }
  };

  const filteredMembers = projectMembers.filter(
    (member) =>
      (member.username?.toLowerCase() || "").includes(
        mentionQuery.toLowerCase()
      ) ||
      (member.name?.toLowerCase() || "").includes(mentionQuery.toLowerCase())
  );

  const handleAddComment = async (e) => {
    if (e) e.preventDefault();

    if (!newComment.trim()) return;

    try {
      setLoading(true);
      const response = await tasksApi.addComment(task.id, {
        content: newComment.trim(),
      });

      if (response.data) {
        // Comment is already added via socket event, but just in case or for immediate feedback if socket is slow
        // We check if it's already there to avoid duplicates
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
    }
  };

  // Handle Enter key for comment submission
  const handleCommentKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleAddComment();
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
      case "DONE":
        return "warning";
      case "IN_PROGRESS":
        return "primary";
      case "PENDING":
        return "default";
      default:
        return "default";
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Glassmorphism Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal - Solid Background */}
      <div
        className={`relative ${
          isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"
        } border rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden`}
      >
        <div className="p-6 flex-shrink-0">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h2
                className={`text-2xl font-semibold ${isDark ? "text-white" : "text-gray-900"} mb-2`}
              >
                {task.title}
              </h2>
              <div className="flex items-center gap-3">
                <Badge variant={getStatusColor(task.status)}>
                  {task.status}
                </Badge>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}
                >
                  {task.priority} Priority
                </span>
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

          {/* Task Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3
                className={`font-semibold ${isDark ? "text-white" : "text-gray-900"} mb-2`}
              >
                Task Information
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span
                    className={`font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}
                  >
                    Assigned to:
                  </span>
                  <span
                    className={`ml-2 ${isDark ? "text-gray-200" : "text-gray-900"}`}
                  >
                    {task.assignee?.username || "Unassigned"}
                  </span>
                </div>
                <div>
                  <span
                    className={`font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}
                  >
                    Project:
                  </span>
                  <span
                    className={`ml-2 ${isDark ? "text-gray-200" : "text-gray-900"}`}
                  >
                    {task.project?.name || "Unknown Project"}
                  </span>
                </div>
                <div>
                  <span
                    className={`font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}
                  >
                    Created by:
                  </span>
                  <span
                    className={`ml-2 ${isDark ? "text-gray-200" : "text-gray-900"}`}
                  >
                    {task.createdBy?.username || "Unknown"}
                  </span>
                </div>
                <div>
                  <span
                    className={`font-medium ${isDark ? "text-gray-300" : "text-gray-600"}`}
                  >
                    Due date:
                  </span>
                  <span
                    className={`ml-2 ${isDark ? "text-gray-200" : "text-gray-900"}`}
                  >
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString()
                      : "No due date"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3
                className={`font-semibold ${isDark ? "text-white" : "text-gray-900"} mb-2`}
              >
                Description
              </h3>
              <p
                className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"} leading-relaxed`}
              >
                {task.description || "No description provided."}
              </p>
            </div>
          </div>
        </div>

        {/* Comments Section - Scrollable */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-6 py-2 border-t border-gray-200/50 flex-shrink-0">
            <h3
              className={`font-semibold ${isDark ? "text-white" : "text-gray-900"} mb-4`}
            >
              Comments ({comments.length})
            </h3>

            {/* Add Comment Form */}
            <form onSubmit={handleAddComment} className="mb-4">
              <div className="flex gap-3 items-start">
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
                  {loading ? "Adding..." : "Add"}
                </Button>
              </div>
            </form>
          </div>

          {/* Comments List - Only this section scrolls */}
          <div className="flex-1 px-6 pb-6 overflow-y-auto">
            {commentsLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              </div>
            ) : comments.length === 0 ? (
              <p
                className={`text-center ${isDark ? "text-gray-400" : "text-gray-500"} py-4`}
              >
                No comments yet. Be the first to comment!
              </p>
            ) : (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`p-3 rounded-lg ${
                      isDark
                        ? "bg-gray-800/50 border-gray-700/50"
                        : "bg-gray-50/50 border-gray-200/50"
                    } border`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`font-medium text-sm ${isDark ? "text-gray-200" : "text-gray-900"}`}
                      >
                        {comment.author?.username ||
                          comment.author ||
                          "Anonymous"}
                      </span>
                      <span
                        className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        {comment.createdAt
                          ? new Date(comment.createdAt).toLocaleString()
                          : comment.timestamp}
                      </span>
                    </div>
                    <p
                      className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"} whitespace-pre-wrap`}
                    >
                      {comment.content || comment.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
