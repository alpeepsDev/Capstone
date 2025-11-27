import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTheme } from "../../context";
import { Badge } from "../ui";

// Drag handle icon component
const DragHandle = ({ className = "" }) => (
  <svg
    className={`w-4 h-4 ${className}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
  </svg>
);

const TaskCard = ({
  task,
  onEdit,
  onDelete,
  onTaskClick,
  onRequestExchange,
  userRole,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({
    id: task.id,
    disabled: task.status === "COMPLETED", // Disable dragging for completed tasks
    animateLayoutChanges: ({ isSorting, wasDragging }) => {
      // Always animate layout changes for smooth sliding
      return isSorting || wasDragging ? true : true;
    },
    transition: {
      duration: 250, // Slightly faster for snappier feel
      easing: "cubic-bezier(0.25, 0.46, 0.45, 0.94)", // Smooth ease-out
    },
  });

  const { isDark } = useTheme();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging
      ? "none"
      : transition || "transform 250ms cubic-bezier(0.25, 0.46, 0.45, 0.94)",
    opacity: isDragging ? 0.8 : task.status === "COMPLETED" ? 0.9 : 1,
    cursor:
      task.status === "COMPLETED"
        ? "default"
        : isDragging
          ? "grabbing"
          : "grab",
    zIndex: isDragging ? 1000 : isSorting ? 10 : 1,
    scale: isDragging ? 1.05 : 1,
    boxShadow: isDragging
      ? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      : undefined,
  };

  const priorityColors = {
    LOW: "default",
    MEDIUM: "warning",
    HIGH: "danger",
  };

  const statusColors = {
    PENDING: "warning",
    IN_PROGRESS: "info",
    DONE: "success",
    COMPLETED: "success",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-id={task.id}
      data-status={task.status}
      data-sorting={isSorting}
      {...(task.status === "COMPLETED" ? {} : attributes)}
      {...(task.status === "COMPLETED" ? {} : listeners)}
      className={`task-card dndkit-sortable-item ${isDragging ? "dragging" : ""} ${isSorting ? "sorting" : ""} ${isDark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"} rounded-md border shadow-sm p-3 mb-2.5 transition-all duration-200 ease-out ${!isDragging ? "shadow-sm hover:shadow-md" : ""} relative group ${task.status === "COMPLETED" ? "opacity-90" : "cursor-grab active:cursor-grabbing"}`}
    >
      {/* Drag Handle - Visual indicator only */}
      <div
        className={`absolute top-2 right-2 p-1 rounded pointer-events-none
          ${isDark ? "text-gray-400" : "text-gray-400"}
          opacity-60 group-hover:opacity-100 transition-opacity duration-200`}
        title={
          task.status === "COMPLETED"
            ? "Task completed - cannot be moved"
            : "Drag to move task"
        }
      >
        {task.status === "COMPLETED" ? (
          // Lock icon for completed tasks
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <DragHandle />
        )}
      </div>

      <div className="flex items-start justify-between mb-2">
        <h4
          className={`font-semibold ${isDark ? "text-white" : "text-gray-900"} text-xs sm:text-sm flex-1 mr-2 pointer-events-auto cursor-pointer leading-snug`}
          onClick={(e) => {
            e.stopPropagation();
            onTaskClick && onTaskClick(task);
          }}
        >
          {task.title}
        </h4>
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
        <Badge variant={statusColors[task.status] || "info"} size="xs">
          {task.status === "COMPLETED"
            ? "✅ COMPLETED"
            : task.status
              ? task.status.replace("_", " ")
              : "IN PROGRESS"}
        </Badge>
      </div>

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
    </div>
  );
};

export default TaskCard;
