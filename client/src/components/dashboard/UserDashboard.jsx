import React, { useState, useEffect, Suspense, useMemo } from "react";
import { toast } from "react-hot-toast";
import { Card, Skeleton } from "../ui";
// Lazy load heavy view components for better performance
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
// Import extracted components
import { TableView } from "./TableView";
import { NoFavorites, NoProjects } from "./DashboardEmptyStates";

import TaskDetailModal from "../modals/TaskDetailModal";

import { UserAnalytics } from "../analytics";
import { useTasks } from "../../hooks";
import { useTheme } from "../../context";
import { motion, AnimatePresence } from "framer-motion";

import {
  Grid3X3,
  List,
  BarChart3,
  Calendar,
  ArrowRight,
  Plus,
  DollarSign,
  Zap,
} from "../ui/icons";

import { useSearchParams } from "react-router-dom"; // Add import
import { Star } from "lucide-react";
import InsightsWidget from "../insights/InsightsWidget";

// Loading component for lazy-loaded views
const ViewLoadingSpinner = () => (
  <div className="flex-1 h-full p-6 space-y-4">
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

const UserDashboard = ({
  user,
  // Props from Dashboard
  projects,
  projectsLoading,
  selectedProjectId,
  setSelectedProjectId,
  activeView,
  setActiveView,
  favorites = [],
  onToggleFavorite,
}) => {
  const { isDark } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams(); // Add searchParams

  // Filter projects based on view - Memoized
  const displayedProjects = useMemo(
    () =>
      activeView === "favorites"
        ? projects?.filter((p) => favorites.includes(p.id))
        : projects,
    [activeView, projects, favorites],
  );

  // Removed local state for sidebar, projects, activeView, selectedProjectId
  const [taskDetailModal, setTaskDetailModal] = useState({
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

  // Handle URL params for direct task access (notifications)
  useEffect(() => {
    const projectIdParam = searchParams.get("projectId");
    const taskIdParam = searchParams.get("taskId");

    if (projectIdParam && taskIdParam && projects) {
      // 1. Switch project if needed
      if (selectedProjectId !== projectIdParam) {
        setSelectedProjectId(projectIdParam);
      }
    }
  }, [searchParams, projects, selectedProjectId, setSelectedProjectId]);

  // Separate effect to open modal once tasks are loaded
  useEffect(() => {
    const taskIdParam = searchParams.get("taskId");
    const projectIdParam = searchParams.get("projectId");

    if (
      taskIdParam &&
      projectIdParam &&
      selectedProjectId === projectIdParam &&
      tasks &&
      tasks.length > 0
    ) {
      const taskToOpen = tasks.find((t) => t.id === taskIdParam);
      if (taskToOpen) {
        setTaskDetailModal({ isOpen: true, task: taskToOpen });
      }
    }
  }, [tasks, searchParams, selectedProjectId]);

  // Ensure arrays are initialized
  const safeTasks = Array.isArray(tasks) ? tasks : [];

  // Task filtering
  const allProjectTasks = safeTasks;
  const myTasks = useMemo(
    () => safeTasks.filter((task) => task.assigneeId === user?.id),
    [safeTasks, user?.id],
  );

  // Loading state for user
  if (!user) {
    return (
      <div className="min-h-full flex flex-col p-6 space-y-6">
        <div className="max-w-7xl mx-auto w-full">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
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
                <Skeleton className="h-4 w-full mb-6" />
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
        </div>
      </div>
    );
  }

  // Loading state for projects
  if (projectsLoading) {
    return (
      <div className="min-h-full flex flex-col p-4 md:p-6 space-y-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>

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
                <Skeleton className="h-4 w-full mb-6" />
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
        </div>
      </div>
    );
  }

  // Handle empty states
  if (
    activeView === "favorites" &&
    (!displayedProjects || displayedProjects.length === 0)
  ) {
    return <NoFavorites isDark={isDark} setActiveView={setActiveView} />;
  }

  // No projects available (only show if not in favorites view)
  if (!projects || projects.length === 0) {
    return <NoProjects isDark={isDark} />;
  }

  // Ensure arrays are initialized

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

      // Special message for users moving tasks to IN_REVIEW
      if (newStatus === "IN_REVIEW") {
        toast.success(
          "Task moved to In Review! Your manager will review and approve when complete.",
          {
            duration: 4000,
          },
        );
      } else {
        toast.success(
          `Task moved to ${newStatus === "PENDING" ? "To Do" : newStatus === "IN_PROGRESS" ? "In Progress" : newStatus}`,
        );
      }
    } catch (error) {
      console.error("Failed to move task:", error);
      toast.error("Failed to move task");
    }
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

  return (
    <div
      className={`flex ${activeView === "budget" || activeView === "project-analytics" ? "h-auto min-h-full" : "h-full"} ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <div
        className={`flex-1 flex flex-col ${activeView === "budget" || activeView === "project-analytics" ? "overflow-visible" : "overflow-hidden"}`}
      >
        {/* Content Area */}
        <div
          className={`flex-1 ${activeView === "budget" || activeView === "project-analytics" ? "overflow-visible" : "overflow-hidden"}`}
        >
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

                {/* Nova Insights Widget */}
                <div className="mb-6">
                  <InsightsWidget />
                </div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: {
                        staggerChildren: 0.03, // Optimized from 0.1 for faster perceived load
                      },
                    },
                  }}
                  initial="hidden"
                  animate="show"
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {displayedProjects?.map((project) => (
                    <motion.div
                      key={project.id}
                      variants={{
                        hidden: { opacity: 0, y: 20 },
                        show: { opacity: 1, y: 0 },
                      }}
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        setActiveView("table");
                      }}
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

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onToggleFavorite)
                                onToggleFavorite(project.id);
                            }}
                            className={`p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative z-10 ${favorites.includes(project.id) ? "text-yellow-400" : "text-gray-400 hover:text-yellow-400"}`}
                          >
                            <Star
                              className={`w-5 h-5 ${favorites.includes(project.id) ? "fill-current" : ""}`}
                            />
                          </button>

                          <div
                            className={`opacity-0 group-hover:opacity-100 transition-opacity ${
                              isDark ? "text-blue-400" : "text-blue-600"
                            }`}
                          >
                            <ArrowRight className="w-5 h-5" />
                          </div>
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
                    </motion.div>
                  ))}

                  {/* Create New Project Card (Optional placeholder) */}
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: { opacity: 1, y: 0 },
                    }}
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
                  </motion.div>
                </motion.div>
              </div>
            </div>
          ) : (
            <div
              className={`flex-1 flex flex-col min-h-0 space-y-1 ${activeView === "budget" || activeView === "project-analytics" ? "overflow-visible h-auto" : "overflow-hidden"}`}
            >
              {/* View Tabs */}
              <div
                className={`flex gap-1.5 p-1 rounded-md ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
              >
                {[
                  { id: "table", label: "Table", icon: List },
                  { id: "gantt", label: "Timeline", icon: BarChart3 },
                  { id: "kanban", label: "Board", icon: Grid3X3 },
                  { id: "calendar", label: "Calendar", icon: Calendar },
                  { id: "project-analytics", label: "Analytics", icon: Zap },
                  { id: "budget", label: "Budget", icon: DollarSign },
                ].map((view) => (
                  <button
                    key={view.id}
                    onClick={() => handleViewChange(view.id)}
                    className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors z-10 ${
                      activeView === view.id
                        ? isDark
                          ? "text-white"
                          : "text-white"
                        : isDark
                          ? "text-gray-400 hover:text-white"
                          : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {activeView === view.id && (
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
                    <view.icon className="w-3.5 h-3.5" />
                    {view.label}
                  </button>
                ))}
              </div>

              {/* Views */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeView}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className={`flex-1 min-h-0 flex flex-col ${activeView === "budget" || activeView === "project-analytics" ? "h-auto overflow-visible" : "h-full overflow-hidden"}`}
                >
                  {(activeView === "table" || activeView === "dashboard") && (
                    <TableView
                      tasks={myTasks}
                      loading={tasksLoading}
                      user={user}
                      isDark={isDark}
                      onTaskClick={handleTaskClick}
                      onStatusChange={handleTaskMove}
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
                        className={`flex-1 rounded-lg border ${
                          isDark
                            ? "bg-gray-800 border-gray-700"
                            : "bg-white border-gray-200"
                        } overflow-hidden`}
                      >
                        <ModernGanttChart
                          tasks={myTasks}
                          loading={tasksLoading}
                          onTaskClick={handleTaskClick}
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
                      <div className="flex-1 overflow-hidden min-h-0">
                        <KanbanBoard
                          tasks={myTasks}
                          loading={tasksLoading}
                          onTaskMove={handleTaskMove}
                          onTaskClick={handleTaskClick}
                          onTaskDelete={handleTaskDelete}
                          hideHeader={true}
                          projectId={selectedProjectId}
                          userRole="USER"
                          currentUserId={user?.id}
                        />
                      </div>
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
                        className={`flex-1 overflow-hidden rounded-lg border ${
                          isDark
                            ? "bg-gray-800 border-gray-700"
                            : "bg-white border-gray-200"
                        } overflow-hidden`}
                      >
                        <CalendarView
                          tasks={myTasks}
                          loading={tasksLoading}
                          onTaskClick={handleTaskClick}
                        />
                      </div>
                    </Suspense>
                  )}

                  {activeView === "project-analytics" && (
                    <div className="flex-1 h-full overflow-y-auto">
                      <UserAnalytics tasks={myTasks} user={user} />
                    </div>
                  )}

                  {activeView === "budget" && (
                    <Suspense fallback={<ViewLoadingSpinner />}>
                      <div className="flex-1 h-auto overflow-visible">
                        <BudgetAllocation projectId={selectedProjectId} />
                      </div>
                    </Suspense>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <TaskDetailModal
        isOpen={taskDetailModal.isOpen}
        task={taskDetailModal.task}
        onClose={handleTaskDetailClose}
        onTaskUpdate={handleTaskMove}
      />
    </div>
  );
};

// Table View Component
// TableView moved to separate file

export default UserDashboard;
