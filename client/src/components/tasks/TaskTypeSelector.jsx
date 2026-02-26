import React from "react";
import { Bug, FileText, Layers, ListTodo, Workflow } from "lucide-react";
import { useTheme } from "../../context";

const TaskTypeSelector = ({ value = "TASK", onChange, disabled = false }) => {
  const { isDark } = useTheme();

  const taskTypes = [
    { value: "TASK", label: "Task", icon: ListTodo, color: "blue" },
    { value: "STORY", label: "Story", icon: FileText, color: "green" },
    { value: "BUG", label: "Bug", icon: Bug, color: "red" },
    { value: "EPIC", label: "Epic", icon: Layers, color: "purple" },
    { value: "SUBTASK", label: "Subtask", icon: Workflow, color: "gray" },
  ];

  const getColorClasses = (color, isSelected) => {
    const colors = {
      blue: {
        bg: isSelected
          ? isDark
            ? "bg-blue-900/40"
            : "bg-blue-50"
          : isDark
            ? "hover:bg-blue-900/20"
            : "hover:bg-blue-50",
        border: isSelected
          ? isDark
            ? "border-blue-500"
            : "border-blue-400"
          : isDark
            ? "border-gray-700"
            : "border-gray-200",
        text: isDark ? "text-blue-400" : "text-blue-600",
      },
      green: {
        bg: isSelected
          ? isDark
            ? "bg-green-900/40"
            : "bg-green-50"
          : isDark
            ? "hover:bg-green-900/20"
            : "hover:bg-green-50",
        border: isSelected
          ? isDark
            ? "border-green-500"
            : "border-green-400"
          : isDark
            ? "border-gray-700"
            : "border-gray-200",
        text: isDark ? "text-green-400" : "text-green-600",
      },
      red: {
        bg: isSelected
          ? isDark
            ? "bg-red-900/40"
            : "bg-red-50"
          : isDark
            ? "hover:bg-red-900/20"
            : "hover:bg-red-50",
        border: isSelected
          ? isDark
            ? "border-red-500"
            : "border-red-400"
          : isDark
            ? "border-gray-700"
            : "border-gray-200",
        text: isDark ? "text-red-400" : "text-red-600",
      },
      purple: {
        bg: isSelected
          ? isDark
            ? "bg-purple-900/40"
            : "bg-purple-50"
          : isDark
            ? "hover:bg-purple-900/20"
            : "hover:bg-purple-50",
        border: isSelected
          ? isDark
            ? "border-purple-500"
            : "border-purple-400"
          : isDark
            ? "border-gray-700"
            : "border-gray-200",
        text: isDark ? "text-purple-400" : "text-purple-600",
      },
      gray: {
        bg: isSelected
          ? isDark
            ? "bg-gray-700/40"
            : "bg-gray-100"
          : isDark
            ? "hover:bg-gray-700/20"
            : "hover:bg-gray-100",
        border: isSelected
          ? isDark
            ? "border-gray-500"
            : "border-gray-400"
          : isDark
            ? "border-gray-700"
            : "border-gray-200",
        text: isDark ? "text-gray-400" : "text-gray-600",
      },
    };
    return colors[color];
  };

  return (
    <div className="space-y-2">
      <label
        className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
      >
        Task Type
      </label>
      <div className="grid grid-cols-5 gap-2">
        {taskTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = value === type.value;
          const colors = getColorClasses(type.color, isSelected);

          return (
            <button
              key={type.value}
              type="button"
              onClick={() => onChange(type.value)}
              disabled={disabled}
              className={`
                flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all
                ${colors.bg} ${colors.border}
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              <Icon className={`w-5 h-5 ${colors.text}`} />
              <span className={`text-xs font-medium ${colors.text}`}>
                {type.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TaskTypeSelector;
