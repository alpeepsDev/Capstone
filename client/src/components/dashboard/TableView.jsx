import React from "react";
import { Skeleton } from "../ui";
import { Clock, Lock } from "../ui/icons";

export const TableView = ({
  tasks,
  loading,
  user,
  isDark,
  onTaskClick,
  onStatusChange,
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "IN_REVIEW":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "HIGH":
        return "text-red-600";
      case "MEDIUM":
        return "text-orange-600";
      case "LOW":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div
      className={`rounded-lg overflow-hidden border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr
              className={`${isDark ? "bg-gray-700" : "bg-gray-50"} border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}
            >
              <th
                className={`px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Task
              </th>
              <th
                className={`px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Status
              </th>
              <th
                className={`px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Priority
              </th>
              <th
                className={`px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Due Date
              </th>
              <th
                className={`px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Assignee
              </th>
            </tr>
          </thead>
          <tbody
            className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-200"}`}
          >
            {loading ? (
              // Skeleton Loading Rows
              [...Array(5)].map((_, index) => (
                <tr key={`skeleton-${index}`}>
                  <td className="px-4 py-3">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4 rounded" />
                      <Skeleton className="h-3 w-1/2 rounded" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-6 w-20 rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-16 rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-4 w-24 rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <Skeleton className="h-7 w-7 rounded-full" />
                  </td>
                </tr>
              ))
            ) : tasks.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className={`px-4 py-10 text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Clock className="w-8 h-8 opacity-50" />
                    <p>No tasks to display</p>
                  </div>
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className={`cursor-pointer transition-all ${
                    isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"
                  }`}
                >
                  <td
                    className={`px-4 py-3 ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    <div>
                      <p className="font-medium text-sm">{task.title}</p>
                      <p
                        className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"} line-clamp-1`}
                      >
                        {task.description || "No description"}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {task.status === "COMPLETED" ? (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 flex items-center gap-1 w-max">
                        <Lock className="w-3 h-3" /> Completed
                      </span>
                    ) : (
                      <select
                        value={task.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          e.stopPropagation();
                          onStatusChange(task.id, e.target.value);
                        }}
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)} border-none cursor-pointer`}
                      >
                        <option value="PENDING">To Do</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="IN_REVIEW">In Review</option>
                        {user?.role === "MANAGER" || user?.role === "ADMIN" ? (
                          <option value="COMPLETED">Completed</option>
                        ) : null}
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold ${getPriorityColor(task.priority)}`}
                    >
                      {task.priority}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white bg-blue-600`}
                    >
                      {task.assignee?.username?.[0]?.toUpperCase() || "?"}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
