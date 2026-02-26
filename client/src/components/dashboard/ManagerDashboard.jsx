import React, { useState, useEffect, Suspense } from "react";
import { toast } from "react-hot-toast";
import { Card, Badge, Button, Skeleton } from "../ui";
import { useManagerDashboard, useTasks } from "../../hooks";
import { useAuth, useTheme } from "../../context";
import { projectsApi } from "../../api/projects";
import { tasksApi } from "../../api/tasks";

import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  Grid3X3,
  List,
  BarChart3,
  Calendar,
  Zap,
  ArrowRight,
  Clock,
  Plus,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Trash2,
  Edit,
  DollarSign,
  Tag,
  X,
} from "../ui/icons";

// Modals
import {
  TaskEditModal,
  TaskDetailModal,
  AddTaskModal,
  CreateProjectModal,
  DeleteConfirmationModal,
  TaskRejectModal,
} from "../modals";
import { ManagerAnalytics } from "../analytics";

// Lazy load heavy view components
const KanbanBoard = React.lazy(() => import("../kanban/KanbanBoard"));
const ModernGanttChart = React.lazy(() =>
  import("../gantt").then((module) => ({ default: module.ModernGanttChart })),
);
const CalendarView = React.lazy(() =>
  import("../calendar").then((module) => ({ default: module.CalendarView })),
);
const BudgetAllocation = React.lazy(() =>
  import("./BudgetAllocation").then((module) => ({ default: module.default })),
);
const LabelManagement = React.lazy(() => import("../../pages/LabelManagement"));

// Loading component
const ViewLoadingSpinner = () => (
  <div className="flex-1 h-full p-6 space-y-4">
    <div className="flex justify-between items-center mb-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="border rounded-lg p-4 space-y-3 dark:border-gray-700"
        >
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
    <div className="border rounded-lg p-6 h-96 dark:border-gray-700">
      <Skeleton className="h-8 w-1/4 mb-6" />
      <Skeleton className="h-full w-full rounded-lg" />
    </div>
  </div>
);

const ManagerDashboard = ({
  user,
  projects, // from props
  projectsLoading, // from props
  selectedProjectId, // from props
  setSelectedProjectId, // from props
  activeView, // from props
  setActiveView, // from props
  onCreateProject, // from props
  onDeleteProject, // from props
  onRefreshProjects, // from props
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isDark } = useTheme();
  const { user: authUser } = useAuth();

  // State
  // selectedProjectId is now a prop
  // activeView is now a prop
  const [allUsers, setAllUsers] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);

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
  const [rejectTaskModal, setRejectTaskModal] = useState({
    isOpen: false,
    task: null,
  });
  const [approvingTaskId, setApprovingTaskId] = useState(null);

  // Hook data
  const {
    stats,
    tasksAwaitingApproval,
    allTasks,
    projects: dashboardProjects, // Internal use only, mostly for stats redundancy
    loading: dashboardLoading,
    error: dashboardError,
    approveTask,
    // createProject, // Removed: Using prop instead
    refreshDashboard,
    getProjectTasks,
  } = useManagerDashboard();

  // Selected project tasks
  const {
    tasks: selectedProjectTasks,
    loading: tasksLoading,
    error: tasksError,
    updateTask,
    updateTaskStatus,
    deleteTask,
    fetchTasks,
  } = useTasks(selectedProjectId);

  const currentUser = user || authUser;
  const currentProject = projects?.find((p) => p.id === selectedProjectId);
  const safeProjects = projects || [];
  const safeTasksAwaitingApproval = tasksAwaitingApproval || [];

  // Filter approvals for current project
  const projectApprovals = safeTasksAwaitingApproval.filter(
    (t) => t.projectId === selectedProjectId,
  );

  // Helper to sync URL
  useEffect(() => {
    const projectIdParam = searchParams.get("projectId");
    const taskIdParam = searchParams.get("taskId");

    if (projectIdParam && projects) {
      if (selectedProjectId !== projectIdParam) {
        setSelectedProjectId(projectIdParam);
      }
    }
  }, [searchParams, projects, selectedProjectId]);

  // Open modal for direct link
  useEffect(() => {
    const taskIdParam = searchParams.get("taskId");
    const projectIdParam = searchParams.get("projectId");

    if (
      taskIdParam &&
      projectIdParam &&
      selectedProjectId === projectIdParam &&
      selectedProjectTasks?.length > 0
    ) {
      const taskToOpen = selectedProjectTasks.find((t) => t.id === taskIdParam);
      if (taskToOpen) {
        setTaskDetailModal({ isOpen: true, task: taskToOpen });
      }
    }
  }, [selectedProjectTasks, searchParams, selectedProjectId]);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await projectsApi.getAllUsers();
        setAllUsers(response.data || []);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };
    fetchUsers();
  }, []);

  // Update project members
  useEffect(() => {
    if (currentProject?.members) {
      const members = currentProject.members.map((member) =>
        member.user ? member.user : member,
      );
      setProjectMembers(members);
    } else {
      setProjectMembers([]);
    }
  }, [currentProject]);

  // Handlers
  const handleTaskMove = async (taskId, newStatus) => {
    const currentTask = selectedProjectTasks?.find(
      (task) => task.id === taskId,
    );
    if (currentTask && currentTask.status === newStatus) return;

    // If manager rejects task by moving it back to IN_PROGRESS
    if (
      currentTask?.status === "IN_REVIEW" &&
      newStatus === "IN_PROGRESS" &&
      (currentUser?.role === "MANAGER" || currentUser?.role === "ADMIN")
    ) {
      handleRejectTask(taskId);
      return;
    }

    try {
      await updateTaskStatus(taskId, newStatus);
      if (currentTask?.status === "IN_REVIEW" && newStatus === "COMPLETED") {
        toast.success("Task approved and marked as completed!", { icon: "🎉" });
      } else {
        toast.success("Task moved successfully!");
      }
      refreshDashboard(); // Refresh stats
      if (fetchTasks) await fetchTasks(); // Refresh board
    } catch (error) {
      toast.error("Failed to move task");
    }
  };

  const handleTaskDelete = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await deleteTask(taskId);
      toast.success("Task deleted successfully!");
      refreshDashboard();
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const handleApproveTask = async (taskId) => {
    setApprovingTaskId(taskId);
    try {
      await approveTask(taskId);
      toast.success("Task approved!", { icon: "🎉" });
      if (fetchTasks) await fetchTasks(); // Refresh current project tasks
      // await refreshDashboard(); // approveTask already refreshes dashboard
    } catch (error) {
      toast.error("Failed to approve task");
    } finally {
      setApprovingTaskId(null);
    }
  };

  const handleRejectTask = async (taskId) => {
    const task =
      safeTasksAwaitingApproval.find((t) => t.id === taskId) ||
      selectedProjectTasks?.find((t) => t.id === taskId);
    if (!task) return;
    setRejectTaskModal({ isOpen: true, task });
  };

  const handleConfirmRejectTask = async (reason, dueDate) => {
    const taskId = rejectTaskModal.task?.id;
    if (!taskId) return;

    setApprovingTaskId(taskId);
    setRejectTaskModal({ isOpen: false, task: null });

    try {
      const updateData = {
        status: "IN_PROGRESS",
        changeNote: reason,
      };

      if (dueDate) {
        // Append time to ensure it works correctly with timezone handling if needed,
        // but typically a proper date string or ISO works.
        updateData.dueDate = new Date(dueDate).toISOString();
      }

      await updateTask(taskId, updateData);
      toast.success("Task rejected and schedule updated!");
      refreshDashboard();
      if (fetchTasks) await fetchTasks();
    } catch (error) {
      toast.error("Failed to reject task");
      console.error(error);
    } finally {
      setApprovingTaskId(null);
    }
  };

  const handleCreateProjectSave = async (projectData) => {
    try {
      // Use prop method to keep parent in sync
      await onCreateProject(projectData);
      // Also refresh dashboard stats
      refreshDashboard();
      setCreateProjectModal({ isOpen: false });
      toast.success("Project created successfully!");
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error("Failed to create project");
    }
  };

  const handleDeleteProject = (project, e) => {
    e.stopPropagation();
    setDeleteProjectModal({ isOpen: true, project, loading: false });
  };

  const handleConfirmDeleteProject = async () => {
    if (!deleteProjectModal.project) return;
    setDeleteProjectModal((prev) => ({ ...prev, loading: true }));
    try {
      // Use prop method to keep parent in sync
      await onDeleteProject(deleteProjectModal.project.id);

      toast.success("Project deleted successfully!");
      if (selectedProjectId === deleteProjectModal.project.id) {
        setSelectedProjectId(null);
      }
      // Also refresh dashboard stats
      refreshDashboard();
      setDeleteProjectModal({ isOpen: false, project: null, loading: false });
    } catch (error) {
      toast.error("Failed to delete project");
      setDeleteProjectModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleAddTaskSave = async (taskData) => {
    try {
      await tasksApi.createTask(taskData);
      toast.success("Task created successfully!");
      refreshDashboard();
      if (taskData.projectId === selectedProjectId && fetchTasks) {
        await fetchTasks();
      }
    } catch (error) {
      toast.error("Failed to create task");
      throw error;
    }
  };

  // Views mapping
  const views = [
    { id: "kanban", label: "Board", icon: Grid3X3 },
    { id: "table", label: "Table", icon: List },
    { id: "gantt", label: "Timeline", icon: BarChart3 },
    { id: "calendar", label: "Calendar", icon: Calendar },
    {
      id: "approvals",
      label: `Approvals${projectApprovals.length ? ` (${projectApprovals.length})` : ""}`,
      icon: CheckCircle,
    },
    { id: "project-analytics", label: "Analytics", icon: Zap },
    { id: "budget", label: "Budget", icon: DollarSign },
    // { id: "exchanges", label: "Exchanges", icon: RefreshCw }, // Optional
  ];

  if (!currentUser) return <ViewLoadingSpinner />;
  if (dashboardError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-red-600">
        <h2 className="text-xl font-bold mb-2">Error Loading Dashboard</h2>
        <p className="mb-4">{dashboardError}</p>
        <Button onClick={refreshDashboard} variant="primary">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={`flex h-full ${isDark ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Project Selection / Overview */}
        {!selectedProjectId ? (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8 flex justify-between items-end">
                <div>
                  <h1
                    className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                  >
                    Welcome Back, {currentUser.username}!
                  </h1>
                  <p
                    className={`mt-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Select a project to manage or create a new one.
                  </p>
                </div>
                {/* Manager Stats Summary Small */}
                <div className="hidden lg:flex gap-4">
                  {/* ... stats ... */}
                </div>
              </div>

              {projectsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`rounded-xl border p-6 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
                    >
                      <div className="flex justify-between mb-4">
                        <Skeleton className="w-12 h-12 rounded-lg" />
                      </div>
                      <Skeleton className="h-7 w-3/4 mb-4" />
                      <div className="flex justify-between items-center mb-4">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full mb-6" />
                      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex -space-x-2">
                          <Skeleton className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800" />
                          <Skeleton className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800" />
                        </div>
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <motion.div
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: { staggerChildren: 0.03 },
                    },
                  }}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {/* Create New Project Card */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0 },
                    }}
                    onClick={() => setCreateProjectModal({ isOpen: true })}
                    className={`cursor-pointer rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-colors min-h-[200px] ${
                      isDark
                        ? "border-gray-700 hover:border-gray-500 hover:bg-gray-800/50"
                        : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                    }`}
                  >
                    <div
                      className={`p-4 rounded-full mb-4 ${isDark ? "bg-gray-800" : "bg-blue-100"}`}
                    >
                      <Plus
                        className={`w-8 h-8 ${isDark ? "text-gray-400" : "text-blue-600"}`}
                      />
                    </div>
                    <h3
                      className={`text-lg font-semibold ${isDark ? "text-gray-200" : "text-gray-800"}`}
                    >
                      Create New Project
                    </h3>
                    <p
                      className={`text-sm mt-2 ${isDark ? "text-gray-500" : "text-gray-600"}`}
                    >
                      Start a new project from scratch
                    </p>
                  </motion.div>

                  {safeProjects.map((project) => {
                    const projectTasks = getProjectTasks
                      ? getProjectTasks(project.id)
                      : [];
                    const completedTasks = projectTasks.filter(
                      (t) => t.status === "COMPLETED",
                    ).length;
                    const totalTasks = projectTasks.length;
                    const completionRate =
                      totalTasks > 0
                        ? Math.round((completedTasks / totalTasks) * 100)
                        : 0;

                    return (
                      <motion.div
                        key={project.id}
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          show: { opacity: 1, y: 0 },
                        }}
                        onClick={() => setSelectedProjectId(project.id)}
                        className={`group relative rounded-xl border p-6 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                          isDark
                            ? "bg-gray-800 border-gray-700 hover:border-blue-500/50"
                            : "bg-white border-gray-200 hover:border-blue-400"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div
                            className={`p-3 rounded-lg ${isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600"}`}
                          >
                            <Grid3X3 className="w-6 h-6" />
                          </div>
                          {/* Delete Project Button (Manager Only) */}
                          {(authUser.role === "ADMIN" ||
                            project.managerId === authUser.id) && (
                            <button
                              onClick={(e) => handleDeleteProject(project, e)}
                              className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-100 rounded-full transition-all"
                              title="Delete Project"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <h3
                          className={`text-xl font-bold mb-2 ${isDark ? "text-white" : "text-gray-900"}`}
                        >
                          {project.name}
                        </h3>

                        <div className="flex justify-between items-center mb-4">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}
                          >
                            {totalTasks} Tasks
                          </span>
                          <span
                            className={`text-xs font-medium ${completionRate === 100 ? "text-green-500" : "text-blue-500"}`}
                          >
                            {completionRate}% Done
                          </span>
                        </div>

                        <div
                          className={`w-full ${isDark ? "bg-gray-700" : "bg-gray-100"} rounded-full h-1.5 mb-6`}
                        >
                          <div
                            className="bg-blue-600 h-1.5 rounded-full"
                            style={{ width: `${completionRate}%` }}
                          ></div>
                        </div>

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
                            className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
                          >
                            Created{" "}
                            {new Date(project.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </div>
        ) : (
          // Project View
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden space-y-1">
            {/* View Tabs & Actions */}
            <div className="px-4 py-2 flex items-center justify-between">
              <div
                className={`flex gap-1.5 p-1 rounded-md max-w-fit ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
              >
                {[
                  { id: "table", label: "Table", icon: List },
                  { id: "gantt", label: "Timeline", icon: BarChart3 },
                  { id: "kanban", label: "Board", icon: Grid3X3 },
                  { id: "calendar", label: "Calendar", icon: Calendar },
                  {
                    id: "approvals",
                    label: `Approvals${projectApprovals.length ? ` (${projectApprovals.length})` : ""}`,
                    icon: CheckCircle,
                  },
                  { id: "project-analytics", label: "Analytics", icon: Zap },
                  { id: "budget", label: "Budget", icon: DollarSign },
                  { id: "labels", label: "Labels", icon: Tag },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveView(id)}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors z-10 ${
                      activeView === id
                        ? "text-white"
                        : isDark
                          ? "text-gray-400 hover:text-white"
                          : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {activeView === id && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-blue-600 rounded-md -z-10"
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30,
                        }}
                      />
                    )}
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              <Button
                onClick={() =>
                  setAddTaskModal({
                    isOpen: true,
                    projectId: selectedProjectId,
                  })
                }
                variant="primary"
                size="sm"
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                New Task
              </Button>
            </div>

            {/* Main Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeView}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-hidden min-h-0 flex flex-col px-4 pb-4"
              >
                {activeView === "table" && (
                  <TableView
                    tasks={selectedProjectTasks || []}
                    loading={tasksLoading}
                    user={currentUser}
                    onTaskClick={(task) =>
                      setTaskDetailModal({ isOpen: true, task })
                    }
                    onEdit={(task) => setTaskEditModal({ isOpen: true, task })}
                    onDelete={handleTaskDelete}
                    onStatusChange={handleTaskMove}
                    isDark={isDark}
                  />
                )}

                {activeView === "gantt" && (
                  <Suspense
                    fallback={
                      <div
                        className={`flex-1 rounded-lg border overflow-hidden ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                      >
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className="grid border-b border-gray-200 dark:border-gray-700"
                              style={{ gridTemplateColumns: `150px 1fr` }}
                            >
                              <div className="p-2 border-r border-gray-200 dark:border-gray-700 flex items-center gap-2">
                                <Skeleton className="w-1.5 h-1.5 rounded-full" />
                                <div className="flex-1">
                                  <Skeleton className="h-3 w-3/4 mb-1 rounded" />
                                  <Skeleton className="h-2 w-1/2 rounded" />
                                </div>
                              </div>
                              <div className="relative h-12 flex items-center px-4">
                                <Skeleton className="h-6 w-1/3 rounded" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    }
                  >
                    <div
                      className={`flex-1 rounded-lg border overflow-hidden ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                    >
                      <ModernGanttChart
                        tasks={selectedProjectTasks || []}
                        loading={tasksLoading}
                        onTaskClick={(task) =>
                          setTaskDetailModal({ isOpen: true, task })
                        }
                      />
                    </div>
                  </Suspense>
                )}

                {activeView === "kanban" && (
                  <Suspense
                    fallback={
                      <div className="flex-1 h-full overflow-hidden">
                        <div className="grid grid-cols-4 gap-2.5 xl:gap-3 h-full">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className={`h-full rounded-xl flex flex-col ${isDark ? "bg-gray-800/50" : "bg-gray-100"}`}
                            >
                              <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                                <Skeleton className="h-6 w-1/2 rounded" />
                              </div>
                              <div className="p-3 space-y-3 flex-1">
                                <Skeleton className="h-24 w-full rounded-lg" />
                                <Skeleton className="h-24 w-full rounded-lg" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    }
                  >
                    <KanbanBoard
                      tasks={selectedProjectTasks || []}
                      userRole="MANAGER"
                      currentUserId={currentUser.id}
                      onTaskMove={handleTaskMove}
                      onTaskEdit={(task) =>
                        setTaskEditModal({ isOpen: true, task })
                      }
                      onTaskDelete={handleTaskDelete}
                      onTaskClick={(task) =>
                        setTaskDetailModal({ isOpen: true, task })
                      }
                      onAddTask={() =>
                        setAddTaskModal({
                          isOpen: true,
                          projectId: selectedProjectId,
                        })
                      }
                      loading={tasksLoading}
                      projectId={selectedProjectId}
                      hideHeader={true}
                    />
                  </Suspense>
                )}

                {activeView === "calendar" && (
                  <Suspense
                    fallback={
                      <div
                        className={`flex-1 rounded-lg border overflow-hidden ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                      >
                        <div className="grid grid-cols-7 gap-[3px] p-2">
                          {[...Array(35)].map((_, i) => (
                            <div
                              key={i}
                              className={`min-h-[60px] p-1.5 rounded border ${isDark ? "bg-gray-800/50 border-gray-700" : "bg-gray-50 border-gray-200"}`}
                            >
                              <div className="flex justify-between mb-1">
                                <Skeleton className="h-3 w-4 rounded" />
                              </div>
                              <div className="space-y-1">
                                <Skeleton className="h-2 w-full rounded" />
                                <Skeleton className="h-2 w-3/4 rounded" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    }
                  >
                    <div
                      className={`flex-1 rounded-lg border overflow-hidden ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}
                    >
                      <CalendarView
                        tasks={selectedProjectTasks || []}
                        loading={tasksLoading}
                        onTaskClick={(task) =>
                          setTaskDetailModal({ isOpen: true, task })
                        }
                      />
                    </div>
                  </Suspense>
                )}

                {activeView === "approvals" && (
                  <div className="flex-1 overflow-y-auto">
                    <Card title="Tasks Awaiting Approval">
                      {projectApprovals.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p>No tasks waiting for approval in this project.</p>
                        </div>
                      ) : (
                        <ApprovalTableView
                          tasks={projectApprovals}
                          onApprove={handleApproveTask}
                          onReject={handleRejectTask}
                          onView={(task) =>
                            setTaskDetailModal({ isOpen: true, task })
                          }
                          loading={approvingTaskId !== null}
                          approvingTaskId={approvingTaskId}
                          isDark={isDark}
                        />
                      )}
                    </Card>
                  </div>
                )}

                {activeView === "project-analytics" && (
                  <div className="flex-1 overflow-y-auto">
                    <ManagerAnalytics
                      tasks={selectedProjectTasks}
                      projects={[currentProject]} // Scope to this project
                      teamMembers={projectMembers}
                      tasksAwaitingApproval={projectApprovals}
                      // For exchange log we naturally don't filter in analytics props unless it handles it
                    />
                  </div>
                )}

                {activeView === "budget" && (
                  <Suspense fallback={<ViewLoadingSpinner />}>
                    <div className="flex-1 overflow-y-auto">
                      <BudgetAllocation projectId={selectedProjectId} />
                    </div>
                  </Suspense>
                )}

                {activeView === "labels" && (
                  <Suspense fallback={<ViewLoadingSpinner />}>
                    <div className="flex-1 overflow-y-auto">
                      <LabelManagement />
                    </div>
                  </Suspense>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modals */}
      <TaskEditModal
        task={taskEditModal.task}
        isOpen={taskEditModal.isOpen}
        onClose={() => setTaskEditModal({ isOpen: false, task: null })}
        onSave={async (id, data) => {
          await updateTask(id, data);
          setTaskEditModal({ isOpen: false, task: null });
          refreshDashboard();
        }}
        users={projectMembers}
      />

      <TaskDetailModal
        task={taskDetailModal.task}
        isOpen={taskDetailModal.isOpen}
        onClose={() => setTaskDetailModal({ isOpen: false, task: null })}
        onTaskUpdate={handleTaskMove}
        onEdit={(task) => {
          setTaskDetailModal({ isOpen: false });
          setTaskEditModal({ isOpen: true, task });
        }}
      />

      <AddTaskModal
        isOpen={addTaskModal.isOpen}
        onClose={() => setAddTaskModal({ isOpen: false })}
        onSave={handleAddTaskSave}
        selectedProject={currentProject} // Preselect
        projects={safeProjects}
        users={projectMembers}
      />

      <CreateProjectModal
        isOpen={createProjectModal.isOpen}
        onClose={() => setCreateProjectModal({ isOpen: false })}
        onSubmit={handleCreateProjectSave}
        users={allUsers}
      />

      <TaskRejectModal
        task={rejectTaskModal.task}
        isOpen={rejectTaskModal.isOpen}
        onClose={() => setRejectTaskModal({ isOpen: false, task: null })}
        onReject={handleConfirmRejectTask}
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
        dangerText="All data will be lost."
      />
    </div>
  );
};

// Table View Component
const TableView = ({
  tasks,
  loading,
  onTaskClick,
  onEdit,
  onDelete,
  onStatusChange,
  isDark,
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
                Assignee
              </th>
              <th
                className={`px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Actions
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
                    <Skeleton className="h-7 w-7 rounded-full" />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-7 w-7 rounded-full" />
                      <Skeleton className="h-7 w-7 rounded-full" />
                    </div>
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
                  className={`cursor-pointer transition-all ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
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
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        onStatusChange(task.id, e.target.value);
                      }}
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)} border-none cursor-pointer focus:ring-1 focus:ring-blue-500`}
                    >
                      <option value="PENDING">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="IN_REVIEW">In Review</option>
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
                  <td className="px-4 py-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white bg-blue-600`}
                    >
                      {task.assignee?.username?.[0]?.toUpperCase() || "?"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(task);
                        }}
                        className={`p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(task.id);
                        }}
                        className={`p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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

// Approval Table View
const ApprovalTableView = ({
  tasks,
  onApprove,
  onReject,
  onView,
  loading,
  approvingTaskId,
  isDark,
}) => {
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
                Submitted By
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
                className={`px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody
            className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-200"}`}
          >
            {tasks.map((task) => (
              <tr
                key={task.id}
                onClick={() => onView(task)}
                className={`cursor-pointer transition-all ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
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
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white bg-blue-600`}
                    >
                      {task.assignee?.username?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span
                      className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {task.assignee?.username || "Unknown"}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-semibold ${getPriorityColor(task.priority)}`}
                  >
                    {task.priority}
                  </span>
                </td>
                <td
                  className={`px-4 py-3 text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString()
                    : "-"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="success"
                      onClick={(e) => {
                        e.stopPropagation();
                        onApprove(task.id);
                      }}
                      disabled={loading && approvingTaskId === task.id}
                      className="h-8 text-xs gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReject(task.id);
                      }}
                      disabled={loading && approvingTaskId === task.id}
                      className="h-8 text-xs gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagerDashboard;
