import React, { useState, useEffect } from "react";
import { Button, Badge, Card } from "../ui";
import { useTheme } from "../../context";

const TaskExchangeModal = ({
  isOpen,
  onClose,
  task,
  projectMembers,
  onSubmit,
}) => {
  const { isDark } = useTheme();
  const [selectedUserId, setSelectedUserId] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

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

  if (!isOpen) return null;

  console.log("TaskExchangeModal - projectMembers:", projectMembers);
  console.log("TaskExchangeModal - task:", task);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setLoading(true);
    try {
      await onSubmit({
        taskId: task.id,
        receiverId: selectedUserId,
        requestNote: note,
      });
      onClose();
      setSelectedUserId("");
      setNote("");
    } catch (error) {
      console.error("Exchange request failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter out current assignee and the current user
  // Handle both direct members array and members.user structure from API
  const rawMembers = projectMembers || [];
  const normalizedMembers = rawMembers.map((member) => {
    // If member has a 'user' property, it's from the API join table
    if (member.user) {
      return member.user;
    }
    // Otherwise it's already a direct user object
    return member;
  });

  const availableMembers = normalizedMembers.filter(
    (member) =>
      member.id !== task?.assigneeId && member.id !== task?.currentUserId
  );

  console.log("Raw project members:", rawMembers);
  console.log("Normalized members:", normalizedMembers);
  console.log("Available members after filtering:", availableMembers);

  // If no project members, create a mock list for demo purposes
  const membersToShow = availableMembers;

  console.log("Available members to show:", membersToShow);

  return (
    <div className="fixed inset-0 backdrop-blur-md bg-black/30 flex items-center justify-center p-4 z-50">
      <div
        className={`${
          isDark
            ? "bg-gray-900/80 border-gray-700/50"
            : "bg-white/80 border-gray-200/50"
        } backdrop-blur-xl border rounded-lg shadow-2xl max-w-md w-full`}
      >
        <Card className="border-0 bg-transparent">
          <div className="flex items-center justify-between mb-4">
            <h3
              className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              Request Task Exchange
            </h3>
            <button
              onClick={onClose}
              className={`${isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-400 hover:text-gray-600"} transition-colors`}
            >
              ✕
            </button>
          </div>

          {/* Task Info */}
          <div
            className={`mb-4 p-3 ${isDark ? "bg-gray-800/50" : "bg-gray-50"} rounded-lg`}
          >
            <h4
              className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
            >
              {task.title}
            </h4>
            <p
              className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"} mt-1`}
            >
              {task.description}
            </p>
            <div className="flex gap-2 mt-2">
              <Badge variant="primary">{task.priority}</Badge>
              {task.dueDate && (
                <Badge variant="warning">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </Badge>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Select Team Member */}
            <div className="mb-4">
              <label
                className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-2`}
              >
                Exchange with:
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? "border-gray-600 bg-gray-800 text-white"
                    : "border-gray-300 bg-white text-gray-900"
                }`}
                required
              >
                <option value="">Select a team member...</option>
                {membersToShow.length === 0 ? (
                  <option value="" disabled>
                    No team members available
                  </option>
                ) : (
                  membersToShow.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name || member.username} ({member.role})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Request Note */}
            <div className="mb-6">
              <label
                className={`block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"} mb-2`}
              >
                Request Message (Optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDark
                    ? "border-gray-600 bg-gray-800 text-white placeholder-gray-400"
                    : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"
                }`}
                placeholder="Explain why you'd like to exchange this task..."
                maxLength={500}
              />
              <div
                className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"} mt-1`}
              >
                {note.length}/500 characters
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={!selectedUserId || loading}
                loading={loading}
              >
                Send Request
              </Button>
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default TaskExchangeModal;
