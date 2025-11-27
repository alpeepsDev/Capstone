import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { Card } from "../ui";
import KanbanBoard from "../kanban/KanbanBoard";
import { ModernGanttChart } from "../gantt";
import { CalendarView } from "../calendar";
import TaskDetailModal from "../modals/TaskDetailModal";
import TaskExchangeModal from "../modals/TaskExchangeModal";
import { UserAnalytics } from "../analytics";
import { useTasks, useTaskExchanges } from "../../hooks";
import { useTheme } from "../../context";
import {
  Grid3X3,
  List,
  BarChart3,
  Calendar,
  Zap,
  ArrowRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
} from "lucide-react";

const UserDashboard = ({
  user,
  // Props from Dashboard
  projects,
  projectsLoading,
  selectedProjectId,
  setSelectedProjectId,
  activeView,
  setActiveView,
}) => {
  const { isDark } = useTheme();
  // Removed local state for sidebar, projects, activeView, selectedProjectId
  const [taskDetailModal, setTaskDetailModal] = useState({
    isOpen: false,
    task: null,
  });
  const [exchangeModal, setExchangeModal] = useState({
    isOpen: false,
    task: null,
  });

  // Fetch tasks for selected project
  const {
    tasks,
    loading: tasksLoading,
    fetchTasks,
    updateTaskStatus,
    deleteTask,
  } = useTasks(selectedProjectId);

  // Fetch task exchanges
  const {
    exchanges,
    loading: exchangesLoading,
    acceptExchange,
    rejectExchange,
    requestExchange,
  } = useTaskExchanges();

  // Loading state for user
  if (!user) {
    return (
      <div className="py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className={`ml-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
          Loading dashboard...
        </span>
      </div>
    );
  }

  // Loading state for projects
  if (projectsLoading) {
    return (
      <div className="py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className={`ml-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
          Loading projects...
        </span>
      </div>
    );
  }

  // No projects available
  if (!projects || projects.length === 0) {
    return (
      <div className="w-full p-4 sm:p-6">
        <Card
          className={`p-6 text-center ${isDark ? "bg-gray-800" : "bg-white"}`}
        >
          <h2
            className={`text-xl font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            No Projects Available
          </h2>
          <p className={`${isDark ? "text-gray-400" : "text-gray-600"} mt-2`}>
            You have not been assigned to any projects yet. Please contact your
            manager.
          </p>
        </Card>
      </div>
    );
  }

  // Loading state for tasks and exchanges
  if (tasksLoading || exchangesLoading) {
    return (
      <div className="py-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className={`ml-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}>
          Loading tasks...
        </span>
      </div>
    );
  }

  // Ensure arrays are initialized
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeExchanges = Array.isArray(exchanges) ? exchanges : [];
  const currentProject = projects?.find((p) => p.id === selectedProjectId);

  // Task filtering
  const allProjectTasks = safeTasks;
  const myTasks = safeTasks.filter((task) => task.assigneeId === user.id);

  // Handler functions
  const handleViewChange = (newView) => {
    setActiveView(newView);
  };

  const handleTaskMove = async (taskId, newStatus) => {
    try {
      // Find the current task to check if status is actually changing
      const currentTask = myTasks?.find((task) => task.id === taskId);

      // If status is not changing, don't make API call or show any notification
      if (currentTask && currentTask.status === newStatus) {
        return; // Silent return for same-column moves
      }

      await updateTaskStatus(taskId, newStatus);

      // Special message for users moving tasks to DONE
      if (newStatus === "DONE") {
        toast.success(
          "Task moved to Done! Your manager will review and approve when complete.",
          {
            duration: 4000,
          }
        );
      } else {
        toast.success(
          `Task moved to ${newStatus === "PENDING" ? "To Do" : newStatus === "IN_PROGRESS" ? "In Progress" : newStatus}`
        );
      }
    } catch (error) {
      console.error("Failed to move task:", error);
      toast.error("Failed to move task");
    }
  };

  const handleTaskEdit = (task) => {
    console.log("Editing task:", task);
    toast("Task editing feature coming soon!");
  };

  const handleTaskDelete = async (taskId) => {
    try {
      await deleteTask(taskId);
      toast.success("Task deleted successfully");
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleTaskClick = (task) => {
    setTaskDetailModal({ isOpen: true, task });
  };

  const handleTaskDetailClose = () => {
    setTaskDetailModal({ isOpen: false, task: null });
  };

  const handleRequestExchange = (task) => {
    setExchangeModal({ isOpen: true, task });
  };

  const handleExchangeModalClose = () => {
    setExchangeModal({ isOpen: false, task: null });
  };

  const handleExchangeSubmit = async (exchangeData) => {
    try {
      await requestExchange(exchangeData);
      toast.success("Exchange request sent successfully!");
      setExchangeModal({ isOpen: false, task: null });
    } catch (error) {
      console.error("Failed to request exchange:", error);
      toast.error("Failed to send exchange request");
    }
  };

  const handleAddTask = (status) => {
    console.log("Adding task with status:", status);
    toast("Users cannot create tasks. Contact your manager.");
  };

  const handleAcceptExchange = async (exchangeId) => {
    try {
      await acceptExchange(exchangeId);
      toast.success("Exchange request accepted!");
      // Refresh tasks to show the reassigned task
      await fetchTasks();
    } catch (error) {
      console.error("Failed to accept exchange:", error);
      toast.error("Failed to accept exchange request");
    }
  };

  const handleRejectExchange = async (exchangeId) => {
    try {
      await rejectExchange(exchangeId);
      toast.success("Exchange request rejected");
    } catch (error) {
      console.error("Failed to reject exchange:", error);
      toast.error("Failed to reject exchange request");
    }
  };

  return (
    <div className={`flex h-full ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {!selectedProjectId ? (
            // Empty state
            // Project Selection Grid
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                  <h1
                    className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Welcome Back, {user?.username}!
                  </h1>
                  <p
                    className={`mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Select a project to view its dashboard and manage tasks.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects?.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => setSelectedProjectId(project.id)}
                      className={`group relative rounded-xl border p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                        isDark
                          ? "bg-gray-800 border-gray-700 hover:border-blue-500/50"
                          : "bg-white border-gray-200 hover:border-blue-400"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div
                          className={`p-3 rounded-lg ${
                            isDark
                              ? "bg-blue-900/30 text-blue-400"
                              : "bg-blue-50 text-blue-600"
                          }`}
                        >
                          <Grid3X3 className="w-6 h-6" />
                        </div>
                        <div
                          className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                            isDark ? "text-blue-400" : "text-blue-600"
                          }`}
                        >
                          <ArrowRight className="w-5 h-5" />
                        </div>
                      </div>

                      <h3
                        className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
                      >
                        {project.name}
                      </h3>

                      <p
                        className={`text-sm mb-6 line-clamp-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
                        {project.description ||
                          "No description available for this project."}
                      </p>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex -space-x-2">
                          {project.members?.slice(0, 3).map((member, i) => (
                            <div
                              key={i}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                                isDark
                                  ? "border-gray-800 bg-gray-700 text-gray-300"
                                  : "border-white bg-gray-100 text-gray-600"
                              }`}
                              title={member.username}
                            >
                              {member.username?.[0]?.toUpperCase()}
                            </div>
                          ))}
                          {project.members?.length > 3 && (
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                                isDark
                                  ? "border-gray-800 bg-gray-700 text-gray-300"
                                  : "border-white bg-gray-100 text-gray-600"
                              }`}
                            >
                              +{project.members.length - 3}
                            </div>
                          )}
                        </div>
                        <span
                          className={`text-xs font-medium ${isDark ? "text-gray-500" : "text-gray-500"}`}
                        >
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Create New Project Card (Optional placeholder) */}
                  <div
                    className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-colors ${
                      isDark
                        ? "border-gray-700 hover:border-gray-600 hover:bg-gray-800/50"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div
                      className={`p-3 rounded-full mb-3 ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
                    >
                      <Plus
                        className={`w-6 h-6 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      />
                    </div>
                    <p
                      className={`font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Create New Project
                    </p>
                    <p
                      className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}
                    >
                      Contact your admin to create a new project
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-1">
              {/* View Tabs */}
              <div
                className={`flex gap-1.5 p-1 rounded-md ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
              >
                {[
                  { id: "table", label: "Table", icon: List },
                  { id: "gantt", label: "Timeline", icon: BarChart3 },
                  { id: "kanban", label: "Board", icon: Grid3X3 },
                  { id: "calendar", label: "Calendar", icon: Calendar },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => handleViewChange(id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      activeView === id
                        ? isDark
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-blue-600 text-white shadow-lg"
                        : isDark
                          ? "text-gray-400 hover:text-white"
                          : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Views */}
              {activeView === "table" && (
                <TableView
                  tasks={allProjectTasks}
                  user={user}
                  isDark={isDark}
                  onTaskClick={handleTaskClick}
                  onStatusChange={handleTaskMove}
                />
              )}

              {activeView === "gantt" && (
                <div
                  className={`flex-1 rounded-lg border ${
                    isDark
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  } overflow-hidden`}
                >
                  <ModernGanttChart
                    tasks={allProjectTasks}
                    onTaskClick={handleTaskClick}
                  />
                </div>
              )}

              {activeView === "kanban" && (
                <div className="flex-1 overflow-hidden min-h-0">
                  <KanbanBoard
                    tasks={allProjectTasks}
                    onTaskMove={handleTaskMove}
                    onTaskClick={handleTaskClick}
                    onTaskDelete={handleTaskDelete}
                    hideHeader={true}
                  />
                </div>
              )}

              {activeView === "calendar" && (
                <div
                  className={`flex-1 overflow-hidden rounded-lg border ${
                    isDark
                      ? "bg-gray-800 border-gray-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <CalendarView
                    tasks={allProjectTasks}
                    onTaskClick={handleTaskClick}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <TaskDetailModal
        isOpen={taskDetailModal.isOpen}
        task={taskDetailModal.task}
        exchanges={safeExchanges}
        onClose={handleTaskDetailClose}
        onRequestExchange={handleRequestExchange}
        onAcceptExchange={handleAcceptExchange}
        onRejectExchange={handleRejectExchange}
      />

      <TaskExchangeModal
        isOpen={exchangeModal.isOpen}
        task={exchangeModal.task}
        users={projects.flatMap((p) => p.members) || []}
        onClose={handleExchangeModalClose}
        onSubmit={handleExchangeSubmit}
      />
    </div>
  );
};

// Table View Component
const TableView = ({ tasks, user, isDark, onTaskClick, onStatusChange }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "DONE":
        return "bg-orange-100 text-orange-800";
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
            {tasks.length === 0 ? (
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
                    <select
                      value={task.status}
                      onChange={(e) => {
                        e.stopPropagation();
                        onStatusChange(task.id, e.target.value);
                      }}
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)} border-none cursor-pointer`}
                    >
                      <option value="PENDING">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
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

export default UserDashboard;
