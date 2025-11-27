import React from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useTheme } from "../../context";
import TaskCard from "./TaskCard";

const KanbanColumn = ({
  id,
  title,
  icon,
  color,
  accentColor,
  tasks,
  userRole,
  currentUserId,
  onTaskEdit,
  onTaskDelete,
  onTaskClick,
  onAddTask,
  onRequestExchange,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const { isDark } = useTheme();

  const getColumnStyles = () => {
    const baseStyles = `kanban-column ${color || ""} rounded-md p-3 sm:p-4 h-[560px] w-full border ${isDark ? "border-gray-600" : "border-gray-300"} transition-all duration-150 flex flex-col`;
    return isOver ? `${baseStyles} drop-zone-active` : baseStyles;
  };

  const getTaskCount = () => tasks.length;

  const canAddTask = () => {
    // Only managers can add tasks, users can only work on assigned tasks
    return userRole === "MANAGER";
  };

  return (
    <div className={getColumnStyles()}>
      {/* Column Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-2">
          <div>
            <h3
              className={`font-semibold ${isDark ? "text-white" : "text-gray-900"} text-sm sm:text-base`}
            >
              {title}
            </h3>
            <span
              className={`text-[11px] sm:text-xs ${isDark ? "text-gray-400" : "text-gray-600"} font-medium`}
            >
              {getTaskCount()} {getTaskCount() === 1 ? "task" : "tasks"}
            </span>
          </div>
        </div>
        {/* Add Task Button */}
        {canAddTask() && (
          <button
            onClick={() => onAddTask(id)}
            className={`p-1.5 rounded-md ${
              isDark
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
            }`}
            title="Add new task"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Task List */}
      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
        disabled={false}
      >
        <div
          ref={setNodeRef}
          className={`kanban-task-list sortable-context space-y-2 sm:space-y-2.5 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent 
            ${isOver ? `ring ring-blue-400 ${isDark ? "ring-blue-300" : "ring-blue-500"} bg-opacity-10 ${isDark ? "bg-blue-900" : "bg-blue-50"}` : ""} 
            transition-all duration-150 rounded-md`}
          data-over={isOver}
          data-column-id={id}
          style={{
            maxHeight: "calc(100% - 68px)",
            overflowX: "hidden",
            scrollbarWidth: "thin",
            paddingRight: "6px",
            paddingLeft: "2px",
            paddingTop: "6px",
            paddingBottom: "12px",
            minHeight: "160px",
          }}
        >
          {tasks.length === 0 ? (
            <div
              className={`text-center py-6 ${isDark ? "text-gray-500" : "text-gray-400"}`}
            >
              <div className="text-2xl mb-2">📋</div>
              <p className="text-xs font-medium">No tasks in this column</p>
              {canAddTask() && (
                <p className="text-[11px] mt-1 opacity-75">
                  Click + to add a task
                </p>
              )}
            </div>
          ) : (
            tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={{ ...task, currentUserId }}
                userRole={userRole}
                onEdit={onTaskEdit}
                onDelete={onTaskDelete}
                onTaskClick={onTaskClick}
                onRequestExchange={onRequestExchange}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
};

export default KanbanColumn;
