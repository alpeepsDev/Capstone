import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTheme } from "../../context";
import { Badge } from "../ui";
import { Lock } from "../ui/icons";
import TaskTypeIcon from "./TaskTypeIcon";
import LabelBadge from "../labels/LabelBadge";

const TaskCard = ({
  task,
  onEdit,
  onDelete,
  onTaskClick,
  userRole,
  isOverlay,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    disabled: task.status === "COMPLETED",
  });

  const { isDark } = useTheme();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : task.status === "COMPLETED" ? 0.9 : 1,
    touchAction: "none",
    ...(isOverlay && {
      transform: "rotate(3deg) scale(1.05)",
      boxShadow:
        "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      cursor: "grabbing",
      opacity: 1,
    }),
  };

  const priorityColors = {
    LOW: "default",
    MEDIUM: "warning",
    HIGH: "danger",
  };

  const statusColors = {
    PENDING: "warning",
    IN_PROGRESS: "info",
    IN_REVIEW: "success",
    COMPLETED: "success",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-id={task.id}
      data-status={task.status}
      {...(task.status === "COMPLETED" ? {} : attributes)}
      {...(task.status === "COMPLETED" ? {} : listeners)}
      className={`task-card ${isDark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"} rounded-md border shadow-sm p-3 mb-2.5 ${!isDragging ? "hover:shadow-md" : ""} relative group ${task.status === "COMPLETED" ? "opacity-90" : "cursor-grab active:cursor-grabbing"}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1">
          {task.taskType && (
            <TaskTypeIcon
              type={task.taskType}
              className="w-4 h-4 flex-shrink-0"
            />
          )}
          <h4
            className={`font-semibold ${isDark ? "text-white" : "text-gray-900"} text-xs sm:text-sm flex-1 pointer-events-auto cursor-pointer leading-snug`}
            onClick={(e) => {
              e.stopPropagation();
              onTaskClick && onTaskClick(task);
            }}
          >
            {task.title}
          </h4>
        </div>
      </div>

      {task.description && (
        <p
          className={`text-xs ${isDark ? "text-gray-300" : "text-gray-600"} mb-2 leading-relaxed`}
        >
          {task.description}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {task.priority && (
          <Badge variant={priorityColors[task.priority]} size="xs">
            {task.priority}
          </Badge>
        )}

        {/* Always show status badge, fallback to 'info' if missing */}
        <Badge
          variant={statusColors[task.status] || "info"}
          size="xs"
          className={
            task.status === "COMPLETED" ? "flex items-center gap-1" : ""
          }
        >
          {task.status === "COMPLETED" ? (
            <>
              <Lock className="w-3 h-3" /> COMPLETED
            </>
          ) : task.status === "IN_REVIEW" ? (
            "IN REVIEW"
          ) : task.status ? (
            task.status.replace("_", " ")
          ) : (
            "IN PROGRESS"
          )}
        </Badge>
      </div>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {task.labels.slice(0, 3).map((taskLabel) => (
            <LabelBadge
              key={taskLabel.labelId || taskLabel.label?.id}
              label={taskLabel.label || taskLabel}
            />
          ))}
          {task.labels.length > 3 && (
            <span
              className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              +{task.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {task.assignee && (
        <div className="flex items-center gap-1.5 mb-2">
          <div
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold ${isDark ? "bg-blue-600 text-white" : "bg-blue-500 text-white"}`}
          >
            {task.assignee.username?.charAt(0).toUpperCase() || "U"}
          </div>
          <span
            className={`text-xs ${isDark ? "text-gray-300" : "text-gray-600"}`}
          >
            {task.assignee.username}
          </span>
        </div>
      )}

      {task.project && (
        <div className="mb-2">
          <Badge
            variant="info"
            size="xs"
            className="w-full text-center py-1 text-[11px]"
          >
            📁 {task.project.name}
          </Badge>
        </div>
      )}

      {/* AI Prediction Display */}
      {task.predictions && task.predictions.length > 0 && (
        <div
          className={`mt-2 pt-2 border-t ${isDark ? "border-gray-600" : "border-gray-200"}`}
        >
          <div className="flex items-center gap-1.5">
            <svg
              className={`w-3 h-3 ${isDark ? "text-blue-400" : "text-blue-600"}`}
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
            <span
              className={`text-[10px] font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              AI Predicts:
            </span>
            <span
              className={`text-[10px] ${isDark ? "text-blue-400" : "text-blue-600"} font-semibold`}
            >
              {new Date(
                task.predictions[0].predictedCompletionAt,
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
            <Badge variant="default" size="xs" className="text-[9px] px-1 py-0">
              {Math.round(task.predictions[0].confidence * 100)}%
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCard;
