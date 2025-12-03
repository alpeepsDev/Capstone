import React, { useState, useEffect } from "react";
import { Card, Badge, Button } from "../ui";
import { KanbanBoard } from "../kanban";
import {
  TaskEditModal,
  TaskDetailModal,
  AddTaskModal,
  CreateProjectModal,
  DeleteConfirmationModal,
} from "../modals";
import { ManagerAnalytics } from "../analytics";
import { useManagerDashboard, useTasks } from "../../hooks";
import { useAuth, useTheme } from "../../context";
import { toast } from "react-hot-toast";
import { projectsApi } from "../../api/projects";
import { tasksApi } from "../../api/tasks";
import { exchangesApi } from "../../api/exchanges";

import { useSearchParams } from "react-router-dom"; // Add import

const ManagerDashboard = ({ user }) => {
  const [searchParams, setSearchParams] = useSearchParams(); // Add searchParams
  const [activeView, setActiveView] = useState("projects"); // Ensure it starts with projects
  const [selectedProject, setSelectedProject] = useState(null); // Ensure no project is selected initially
  const [allUsers, setAllUsers] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);
  const [exchangeLogs, setExchangeLogs] = useState([]);
  const [exchangeLogsLoading, setExchangeLogsLoading] = useState(false);

  const { isDark } = useTheme();

  // Modal states
  const [taskEditModal, setTaskEditModal] = useState({
    isOpen: false,
    task: null,
  });
  const [taskDetailModal, setTaskDetailModal] = useState({
    isOpen: false,
    task: null,
  });
  const [addTaskModal, setAddTaskModal] = useState({ isOpen: false });
  const [createProjectModal, setCreateProjectModal] = useState({
    isOpen: false,
  });
  const [deleteProjectModal, setDeleteProjectModal] = useState({
    isOpen: false,
    project: null,
    loading: false,
  });
  const [approvingTaskId, setApprovingTaskId] = useState(null);

  const { user: authUser } = useAuth();

  // Use the manager dashboard hook for real data
  const {
    stats,
    tasksAwaitingApproval,
    allTasks,
    projects,
    loading: dashboardLoading,
    error: dashboardError,
    approveTask,
    createProject,
    refreshDashboard,
    getProjectTasks,
  } = useManagerDashboard();

  // Handle URL params for direct task access
  useEffect(() => {
    const projectIdParam = searchParams.get("projectId");
    const taskIdParam = searchParams.get("taskId");

    if (projectIdParam && taskIdParam && projects) {
      // 1. Select project if not selected
      if (selectedProject?.id !== projectIdParam) {
        const projectToSelect = projects.find((p) => p.id === projectIdParam);
        if (projectToSelect) {
          setSelectedProject(projectToSelect);
          setActiveView("kanban");
        }
      }
    }
  }, [searchParams, projects, selectedProject]);

  // Open modal when task is available
  useEffect(() => {
    const taskIdParam = searchParams.get("taskId");
    const projectIdParam = searchParams.get("projectId");

    if (
      taskIdParam &&
      projectIdParam &&
      selectedProject?.id === projectIdParam
    ) {
      // Try to find in selectedProjectTasks first (if loaded)
      // But we don't have direct access to them here easily without the hook result
      // However, we have allTasks from useManagerDashboard which might contain it?
      // Actually, useTasks hook below fetches tasks for selected project.
      // Let's rely on that.
    }
  }, [searchParams, selectedProject]);

  // Use tasks hook for the selected project's kanban board
  const {
    tasks: selectedProjectTasks,
    loading: tasksLoading,
    error: tasksError,
    updateTask,
    updateTaskStatus,
    deleteTask,
    fetchTasks,
  } = useTasks(selectedProject?.id);

  // Open modal once tasks are loaded
  useEffect(() => {
    const taskIdParam = searchParams.get("taskId");
    const projectIdParam = searchParams.get("projectId");

    if (
      taskIdParam &&
      projectIdParam &&
      selectedProject?.id === projectIdParam &&
      selectedProjectTasks?.length > 0
    ) {
      const taskToOpen = selectedProjectTasks.find((t) => t.id === taskIdParam);
      if (taskToOpen) {
        setTaskDetailModal({ isOpen: true, task: taskToOpen });
      }
    }
  }, [selectedProjectTasks, searchParams, selectedProject]);

  // Fetch all users for project creation and fallback
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await projectsApi.getAllUsers();
        setAllUsers(response.data || []);
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error(
          "Failed to load users for assignment. Please refresh the page."
        );
      }
    };

    fetchUsers();
  }, []);

  // Load exchange logs when exchanges view is selected
  useEffect(() => {
    if (activeView === "exchanges") {
      const fetchExchangeLogs = async () => {
        setExchangeLogsLoading(true);
        try {
          const response = await exchangesApi.getProjectExchanges();
          setExchangeLogs(response.data || []);
        } catch (error) {
          console.error("Failed to fetch exchange logs:", error);
          toast.error("Failed to load exchange logs");
        } finally {
          setExchangeLogsLoading(false);
        }
      };
      fetchExchangeLogs();
    }
  }, [activeView]);

  // Get project members when a project is selected
  useEffect(() => {
    if (selectedProject && selectedProject.members) {
      // Extract user objects from the project members relationship
      const members = selectedProject.members.map((member) =>
        member.user ? member.user : member
      );
      setProjectMembers(members);
    } else {
      setProjectMembers([]);
    }
  }, [selectedProject]);

  // Show loading state if user is not available
  if (!user && !authUser) {
    return (
      <div className="py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span
            className={`ml-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}
          >
            Loading dashboard...
          </span>
        </div>
      </div>
    );
  }

  const currentUser = user || authUser;

  // Safe array access with null checks
  const safeProjects = projects || [];
  const safeTasks = allTasks || [];
  const safeTasksAwaitingApproval = tasksAwaitingApproval || [];

  const handleTaskMove = async (taskId, newStatus) => {
    // Find the current task to check if status is actually changing
    const currentTask = selectedProjectTasks?.find(
      (task) => task.id === taskId
    );

    // If status is not changing, don't make API call or show success message
    if (currentTask && currentTask.status === newStatus) {
      return; // Silent return for same-column moves
    }

    try {
      // Use updateTaskStatus specifically for status updates
      await updateTaskStatus(taskId, newStatus);

      // Special message for managers approving tasks from DONE to COMPLETED
      const currentTask = allTasks?.find((task) => task.id === taskId);
      if (currentTask?.status === "DONE" && newStatus === "COMPLETED") {
        toast.success("Task approved and marked as completed!", {
          duration: 3000,
          icon: "🎉",
        });
      } else {
        toast.success("Task moved successfully!");
      }

      refreshDashboard(); // Refresh dashboard data to sync with server
    } catch (error) {
      console.error("Failed to move task:", error);
      console.error("Error details:", {
        taskId,
        newStatus,
        currentUserId: currentUser?.id,
        userRole: currentUser?.role,
        errorStatus: error.response?.status,
        errorMessage: error.response?.data?.message,
      });

      // Show more specific error message
      const errorMessage =
        error.response?.data?.message || error.message || "Failed to move task";
      toast.error(`Failed to move task: ${errorMessage}`);
    }
  };

  const handleTaskEdit = async (task) => {
    setTaskEditModal({ isOpen: true, task });
  };

  const handleTaskDelete = async (taskId) => {
    try {
      await deleteTask(taskId);
      toast.success("Task deleted successfully!");
      refreshDashboard(); // Refresh dashboard data
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error("Failed to delete task");
    }
  };

  const handleTaskClick = (task) => {
    setTaskDetailModal({ isOpen: true, task });
  };

  const handleAddTask = async () => {
    setAddTaskModal({ isOpen: true });
  };

  const handleApproveTask = async (taskId) => {
    setApprovingTaskId(taskId);
    try {
      await approveTask(taskId);
      toast.success("Task approved and moved to completed!", {
        duration: 3000,
        icon: "🎉",
      });

      // Note: approveTask already refreshes the data internally
      // No need for additional refresh here
    } catch (error) {
      console.error("Failed to approve task:", error);
      toast.error(error.message || "Failed to approve task");
    } finally {
      setApprovingTaskId(null);
    }
  };

  const handleCreateProject = () => {
    setCreateProjectModal({ isOpen: true });
  };

  const handleDeleteProject = (project, event) => {
    event.stopPropagation(); // Prevent project selection when clicking delete
    setDeleteProjectModal({ isOpen: true, project, loading: false });
  };

  const handleConfirmDeleteProject = async () => {
    if (!deleteProjectModal.project) return;

    setDeleteProjectModal((prev) => ({ ...prev, loading: true }));

    try {
      await projectsApi.deleteProject(deleteProjectModal.project.id);
      toast.success("Project deleted successfully!");

      // If the deleted project was selected, clear selection
      if (selectedProject?.id === deleteProjectModal.project.id) {
        setSelectedProject(null);
        setActiveView("overview");
      }

      refreshDashboard();
      setDeleteProjectModal({ isOpen: false, project: null, loading: false });
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error(error.response?.data?.message || "Failed to delete project");
      setDeleteProjectModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Modal handlers
  const handleTaskEditSave = async (taskId, taskData) => {
    await updateTask(taskId, taskData);
    refreshDashboard();
  };

  const handleTaskDetailEdit = (task) => {
    setTaskDetailModal({ isOpen: false, task: null });
    setTaskEditModal({ isOpen: true, task });
  };

  const handleAddTaskSave = async (taskData) => {
    try {
      // Use the tasks API directly to create task for any project
      await tasksApi.createTask(taskData);
      toast.success("Task created successfully!");
      refreshDashboard();

      // If the task was created for the currently selected project, refresh those tasks
      if (taskData.projectId === selectedProject?.id && fetchTasks) {
        await fetchTasks();
      }
    } catch (error) {
      console.error("Failed to create task:", error);
      toast.error("Failed to create task");
      throw error;
    }
  };

  const handleCreateProjectSave = async (projectData) => {
    await createProject(projectData);
    refreshDashboard();
  };

  // Show error if there's a dashboard error
  if (dashboardError) {
    return (
      <div className="py-8">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <h2 className="text-xl font-semibold">Error Loading Dashboard</h2>
            <p>{dashboardError}</p>
          </div>
          <Button onClick={refreshDashboard} variant="primary">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 sm:p-6">
      <div className="space-y-6">
        {/* Header */}
        <div
          className={`${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} rounded-lg shadow-sm border p-4 sm:p-6`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1
                className={`text-2xl sm:text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Manager Dashboard 👨‍💼
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge variant="success">MANAGER</Badge>
                <span
                  className={`${isDark ? "text-gray-300" : "text-gray-600"} text-sm sm:text-base`}
                >
                  Project Manager - {currentUser.username}
                </span>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={handleCreateProject}
                variant="primary"
                className="w-full sm:w-auto"
              >
                New Project
              </Button>

              {/* Mobile: Dropdown Navigation */}
              <div className="block sm:hidden">
                <select
                  value={activeView}
                  onChange={(e) => setActiveView(e.target.value)}
                  className={`w-full px-3 py-2 border ${isDark ? "border-gray-600 bg-gray-800 text-white" : "border-gray-300 bg-white text-gray-900"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="projects">Projects</option>
                  <option value="kanban">Kanban</option>
                  <option value="approvals">
                    Approvals ({safeTasksAwaitingApproval.length})
                  </option>
                  <option value="exchanges">Exchange Logs</option>
                  <option value="analytics">Analytics</option>
                </select>
              </div>

              {/* Desktop: Button Navigation */}
              <div className="hidden sm:flex gap-2 flex-wrap">
                <Button
                  variant={activeView === "projects" ? "primary" : "secondary"}
                  onClick={() => setActiveView("projects")}
                  size="sm"
                >
                  Projects
                </Button>
                <Button
                  variant={activeView === "kanban" ? "primary" : "secondary"}
                  onClick={() => setActiveView("kanban")}
                  size="sm"
                >
                  Kanban
                </Button>
                <Button
                  variant={activeView === "approvals" ? "primary" : "secondary"}
                  onClick={() => setActiveView("approvals")}
                  size="sm"
                >
                  Approvals ({safeTasksAwaitingApproval.length})
                </Button>
                <Button
                  variant={activeView === "exchanges" ? "primary" : "secondary"}
                  onClick={() => setActiveView("exchanges")}
                  size="sm"
                >
                  Exchange Logs
                </Button>
                <Button
                  variant={activeView === "analytics" ? "primary" : "secondary"}
                  onClick={() => setActiveView("analytics")}
                  size="sm"
                >
                  Analytics
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Manager Stats - Hide when in kanban view */}
        {activeView !== "kanban" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <Card padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.projectCount}
                </div>
                <div
                  className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
                >
                  Active Projects
                </div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.totalTasks}
                </div>
                <div
                  className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
                >
                  Total Tasks
                </div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.tasksAwaitingApproval}
                </div>
                <div
                  className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
                >
                  Awaiting Approval
                </div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {stats.overdueTasks}
                </div>
                <div
                  className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
                >
                  Overdue Tasks
                </div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.totalTeamMembers}
                </div>
                <div
                  className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
                >
                  Team Members
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Main Content Area with proper spacing */}
        <div
          className={`${activeView === "kanban" ? "mt-6" : "mt-12"} space-y-8`}
        >
          {/* Projects View */}
          {activeView === "projects" && (
            <div className="space-y-6">
              <Card title="My Projects">
                {dashboardLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span
                      className={`ml-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}
                    >
                      Loading projects...
                    </span>
                  </div>
                ) : safeProjects.length === 0 ? (
                  <div
                    className={`text-center py-8 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    <div className="text-3xl mb-2">📁</div>
                    <p>No projects found</p>
                    <Button
                      onClick={handleCreateProject}
                      variant="primary"
                      className="mt-4"
                    >
                      Create your first project
                    </Button>
                  </div>
                ) : (
                  <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent pr-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {safeProjects.map((project) => {
                        const projectTasks = getProjectTasks(project.id);
                        const completedTasks = projectTasks.filter(
                          (task) => task.status === "COMPLETED"
                        ).length;
                        const totalTasks = projectTasks.length;
                        const completionRate =
                          totalTasks > 0
                            ? Math.round((completedTasks / totalTasks) * 100)
                            : 0;

                        return (
                          <div
                            key={project.id}
                            className={`border ${isDark ? "border-gray-600 hover:bg-gray-700" : "border-gray-200 hover:bg-gray-50"} rounded-lg p-3 sm:p-4 cursor-pointer relative group transition-colors`}
                            onClick={() => {
                              setSelectedProject(project);
                              setActiveView("kanban");
                            }}
                          >
                            {/* Delete button - only show on hover and for project managers/admins */}
                            {(authUser.role === "ADMIN" ||
                              project.managerId === authUser.id) && (
                              <button
                                onClick={(e) => handleDeleteProject(project, e)}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-100 hover:bg-red-200 text-red-600 p-1.5 rounded-full z-10"
                                title="Delete Project"
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
                            )}

                            <div className="flex items-start justify-between mb-3">
                              <h4
                                className={`font-medium ${isDark ? "text-white" : "text-gray-900"} pr-8 text-sm sm:text-base leading-tight`}
                              >
                                {project.name}
                              </h4>
                              <Badge variant="primary" size="sm">
                                {completionRate}%
                              </Badge>
                            </div>
                            <p
                              className={`text-xs sm:text-sm ${isDark ? "text-gray-300" : "text-gray-600"} mb-3 line-clamp-2`}
                            >
                              {project.description}
                            </p>
                            <div
                              className={`flex justify-between text-xs ${isDark ? "text-gray-400" : "text-gray-500"} mb-3`}
                            >
                              <span>{totalTasks} tasks</span>
                              <span>
                                {project.members?.length || 0} members
                              </span>
                            </div>
                            <div
                              className={`w-full ${isDark ? "bg-gray-600" : "bg-gray-200"} rounded-full h-2`}
                            >
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${completionRate}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Kanban View */}
          {activeView === "kanban" && (
            <div className="mt-6">
              {selectedProject ? (
                <div className="w-full">
                  <div
                    className={`rounded-lg border ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} shadow-sm p-4 sm:p-6 overflow-auto`}
                  >
                    <div className="mb-4">
                      <h3
                        className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"} mb-1`}
                      >
                        {selectedProject.name} - Kanban Board
                      </h3>
                      <p
                        className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
                        Drag and drop tasks between columns to update their
                        status
                      </p>
                    </div>
                    <KanbanBoard
                      tasks={selectedProjectTasks || []}
                      userRole="MANAGER"
                      currentUserId={currentUser.id}
                      onTaskMove={handleTaskMove}
                      onTaskEdit={handleTaskEdit}
                      onTaskDelete={handleTaskDelete}
                      onTaskClick={handleTaskClick}
                      onAddTask={handleAddTask}
                      loading={tasksLoading}
                      error={tasksError}
                      hideHeader={true}
                      projectId={selectedProject?.id}
                    />
                  </div>
                </div>
              ) : (
                <div
                  className={`p-4 ${isDark ? "bg-amber-900/20 border-amber-700/30" : "bg-yellow-50 border-yellow-200"} rounded-lg border`}
                >
                  <p
                    className={`${isDark ? "text-amber-300" : "text-yellow-800"} text-sm sm:text-base`}
                  >
                    Please select a project from the Projects view to manage
                    tasks in Kanban board.
                  </p>
                  <Button
                    onClick={() => setActiveView("projects")}
                    variant="secondary"
                    size="sm"
                    className="mt-2 w-full sm:w-auto"
                  >
                    Go to Projects
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Approvals View */}
          {activeView === "approvals" && (
            <Card title="Tasks Awaiting Approval">
              <div className="space-y-4">
                {dashboardLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span
                      className={`ml-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}
                    >
                      Loading tasks awaiting approval...
                    </span>
                  </div>
                ) : safeTasksAwaitingApproval.length === 0 ? (
                  <div
                    className={`text-center py-8 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    <div className="text-3xl mb-2">✅</div>
                    <p>No tasks awaiting approval</p>
                  </div>
                ) : (
                  safeTasksAwaitingApproval.map((task) => (
                    <div key={task.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4
                            className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                          >
                            {task.title}
                          </h4>
                          <p
                            className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"} mb-2`}
                          >
                            {task.description}
                          </p>
                          <div
                            className={`flex items-center gap-4 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                          >
                            <span>
                              Completed by:{" "}
                              {task.assignee?.username || "Unknown"}
                            </span>
                            <span>
                              Project: {task.project?.name || "Unknown Project"}
                            </span>
                            <span>
                              Due:{" "}
                              {task.dueDate
                                ? new Date(task.dueDate).toLocaleDateString()
                                : "No due date"}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleApproveTask(task.id)}
                            loading={approvingTaskId === task.id}
                            disabled={approvingTaskId === task.id}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleTaskEdit(task)}
                          >
                            Request Changes
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}

          {/* Exchange Logs View */}
          {activeView === "exchanges" && (
            <Card title="Task Exchange Logs">
              {exchangeLogsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span
                    className={`ml-2 ${isDark ? "text-gray-300" : "text-gray-600"}`}
                  >
                    Loading exchange logs...
                  </span>
                </div>
              ) : exchangeLogs.length === 0 ? (
                <div
                  className={`text-center py-8 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  <div className="text-3xl mb-2">🔄</div>
                  <p className="text-sm">No task exchanges found</p>
                  <p className="text-xs mt-1">
                    Exchanges will appear here when team members trade tasks
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {exchangeLogs.map((exchange) => (
                    <div
                      key={exchange.id}
                      className={`border rounded-lg p-4 ${isDark ? "border-gray-600" : "border-gray-200"}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4
                              className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                            >
                              {exchange.task.title}
                            </h4>
                            <Badge
                              variant={
                                exchange.status === "ACCEPTED"
                                  ? "success"
                                  : exchange.status === "REJECTED"
                                    ? "danger"
                                    : exchange.status === "CANCELLED"
                                      ? "secondary"
                                      : "warning"
                              }
                              size="sm"
                            >
                              {exchange.status}
                            </Badge>
                          </div>
                          <div
                            className={`grid grid-cols-1 md:grid-cols-2 gap-4 text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
                          >
                            <div>
                              <p>
                                <strong>From:</strong> {exchange.requester.name}{" "}
                                ({exchange.requester.username})
                              </p>
                              <p>
                                <strong>To:</strong> {exchange.receiver.name} (
                                {exchange.receiver.username})
                              </p>
                            </div>
                            <div>
                              <p>
                                <strong>Project:</strong>{" "}
                                {exchange.task.project.name}
                              </p>
                              <p>
                                <strong>Requested:</strong>{" "}
                                {new Date(
                                  exchange.requestedAt
                                ).toLocaleDateString()}
                              </p>
                              {exchange.respondedAt && (
                                <p>
                                  <strong>Responded:</strong>{" "}
                                  {new Date(
                                    exchange.respondedAt
                                  ).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          {exchange.requestNote && (
                            <div
                              className={`mt-2 p-2 rounded text-sm ${isDark ? "bg-blue-900/30 text-blue-200" : "bg-blue-50 text-blue-800"}`}
                            >
                              <p>
                                <strong>Request Note:</strong>{" "}
                                {exchange.requestNote}
                              </p>
                            </div>
                          )}
                          {exchange.responseNote && (
                            <div
                              className={`mt-2 p-2 rounded text-sm ${isDark ? "bg-gray-700 text-gray-200" : "bg-gray-50 text-gray-800"}`}
                            >
                              <p>
                                <strong>Response Note:</strong>{" "}
                                {exchange.responseNote}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Analytics View */}
          {activeView === "analytics" && (
            <>
              <ManagerAnalytics
                tasks={safeTasks}
                projects={safeProjects}
                teamMembers={allUsers}
                exchangeLogs={exchangeLogs}
                tasksAwaitingApproval={safeTasksAwaitingApproval}
              />
            </>
          )}
        </div>

        {/* Modals */}
        <TaskEditModal
          task={taskEditModal.task}
          isOpen={taskEditModal.isOpen}
          onClose={() => setTaskEditModal({ isOpen: false, task: null })}
          onSave={handleTaskEditSave}
          users={projectMembers.length > 0 ? projectMembers : allUsers}
        />

        <TaskDetailModal
          task={taskDetailModal.task}
          isOpen={taskDetailModal.isOpen}
          onClose={() => setTaskDetailModal({ isOpen: false, task: null })}
          onEdit={handleTaskDetailEdit}
        />

        <AddTaskModal
          isOpen={addTaskModal.isOpen}
          onClose={() => setAddTaskModal({ isOpen: false })}
          onSave={handleAddTaskSave}
          selectedProject={selectedProject}
          projects={safeProjects}
          users={projectMembers.length > 0 ? projectMembers : allUsers}
        />

        <CreateProjectModal
          isOpen={createProjectModal.isOpen}
          onClose={() => setCreateProjectModal({ isOpen: false })}
          onSubmit={handleCreateProjectSave}
          users={allUsers}
        />

        <DeleteConfirmationModal
          isOpen={deleteProjectModal.isOpen}
          onClose={() =>
            setDeleteProjectModal({
              isOpen: false,
              project: null,
              loading: false,
            })
          }
          onConfirm={handleConfirmDeleteProject}
          title="Delete Project"
          message="Are you sure you want to delete this project? This will permanently remove the project and all associated tasks."
          itemName={deleteProjectModal.project?.name}
          loading={deleteProjectModal.loading}
          dangerText="All tasks, exchanges, and project data will be permanently lost."
        />
      </div>
    </div>
  );
};

export default ManagerDashboard;
