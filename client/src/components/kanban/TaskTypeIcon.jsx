import React from "react";
import { Bug, FileText, Layers, ListTodo, Workflow } from "lucide-react";

const TaskTypeIcon = ({ type, className = "w-4 h-4" }) => {
  const typeConfig = {
    TASK: { icon: ListTodo, color: "text-blue-500" },
    STORY: { icon: FileText, color: "text-green-500" },
    BUG: { icon: Bug, color: "text-red-500" },
    EPIC: { icon: Layers, color: "text-purple-500" },
    SUBTASK: { icon: Workflow, color: "text-gray-500" },
  };

  const config = typeConfig[type] || typeConfig.TASK;
  const Icon = config.icon;

  return <Icon className={`${className} ${config.color}`} />;
};

export default TaskTypeIcon;
