import { useState, useEffect, useCallback } from "react";
import { tasksApi } from "../../api/tasks.js";
import { projectsApi } from "../../api/projects.js";
import webSocketService from "../../services/websocket.service.js";

export const useManagerDashboard = () => {
  const [stats, setStats] = useState({
    projectCount: 0,
    totalTasks: 0,
    tasksAwaitingApproval: 0,
    overdueTasks: 0,
    totalTeamMembers: 0,
  });
  const [tasksAwaitingApproval, setTasksAwaitingApproval] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch manager dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await tasksApi.getManagerStats();
      // Handle both direct object and wrapped response formats
      const statsData = response.data ||
        response || {
          projectCount: 0,
          totalTasks: 0,
          tasksAwaitingApproval: 0,
          overdueTasks: 0,
          totalTeamMembers: 0,
        };
      setStats(statsData);
    } catch (err) {
      console.error("Failed to fetch manager stats:", err);
      setError(err.response?.data?.message || err.message);
    }
  }, []);

  // Fetch tasks awaiting approval
  const fetchTasksAwaitingApproval = useCallback(async () => {
    try {
      const response = await tasksApi.getTasksAwaitingApproval();
      // Handle both direct array and wrapped response formats
      const tasksData = response.data || response || [];
      setTasksAwaitingApproval(tasksData);
    } catch (err) {
      console.error("Failed to fetch tasks awaiting approval:", err);
      setError(err.response?.data?.message || err.message);
    }
  }, []);

  // Fetch all tasks across managed projects
  const fetchAllTasks = useCallback(async () => {
    try {
      const response = await tasksApi.getManagerTasks();
      // Handle both direct array and wrapped response formats
      const tasksData = response.data || response || [];
      setAllTasks(tasksData);
    } catch (err) {
      console.error("Failed to fetch all tasks:", err);
      setError(err.response?.data?.message || err.message);
    }
  }, []);

  // Fetch managed projects
  const fetchProjects = useCallback(async () => {
    try {
      const response = await projectsApi.getUserProjects();
      // Handle both direct array and wrapped response formats
      const projectsData = response.data || response || [];
      setProjects(projectsData);
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setError(err.response?.data?.message || err.message);
    }
  }, []);

  // Approve a task
  const approveTask = async (taskId) => {
    // Don't use global loading state for individual task approval
    try {
      await tasksApi.approveTask(taskId);
      // Refresh data after approval
      await Promise.all([
        fetchStats(),
        fetchTasksAwaitingApproval(),
        fetchAllTasks(),
      ]);
      return { success: true };
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Create a new project
  const createProject = async (projectData) => {
    setLoading(true);
    try {
      const response = await projectsApi.createProject(projectData);
      await fetchProjects(); // Refresh projects list
      await fetchStats(); // Refresh stats
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Refresh all dashboard data
  const refreshDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchStats(),
        fetchTasksAwaitingApproval(),
        fetchAllTasks(),
        // fetchProjects removed to avoid redundancy with parent Dashboard
      ]);
    } catch (err) {
      console.error("Failed to refresh dashboard:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchStats, fetchTasksAwaitingApproval, fetchAllTasks]);

  // Get tasks for a specific project
  const getProjectTasks = useCallback(
    (projectId) => {
      return allTasks.filter((task) => task.projectId === projectId);
    },
    [allTasks],
  );

  // Get overdue tasks
  const getOverdueTasks = useCallback(() => {
    const now = new Date();
    return allTasks.filter(
      (task) =>
        task.dueDate &&
        new Date(task.dueDate) < now &&
        task.status !== "COMPLETED",
    );
  }, [allTasks]);

  // Initial data fetch
  useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  // Real-time: Listen for task status changes to update approvals instantly
  useEffect(() => {
    const handleTaskStatusChange = (task) => {
      // Any task move could involve IN_REVIEW (entering or leaving),
      // so always refresh the approvals list and stats
      fetchTasksAwaitingApproval();
      fetchStats();
    };

    // Also handle general task updates that may change status
    const handleTaskUpdated = (task) => {
      // Refresh if any task we're tracking in approvals got updated
      const isInApprovals = tasksAwaitingApproval.some((t) => t.id === task.id);
      if (task.status === "IN_REVIEW" || isInApprovals) {
        fetchTasksAwaitingApproval();
        fetchStats();
      }
    };

    webSocketService.onTaskMoved(handleTaskStatusChange);
    webSocketService.onTaskUpdated(handleTaskUpdated);

    return () => {
      if (webSocketService.socket) {
        webSocketService.socket.off("task-moved", handleTaskStatusChange);
        webSocketService.socket.off("task-updated", handleTaskUpdated);
      }
    };
  }, [fetchTasksAwaitingApproval, fetchStats, tasksAwaitingApproval]);

  return {
    // Data
    stats,
    tasksAwaitingApproval,
    allTasks,
    projects,
    loading,
    error,

    // Actions
    approveTask,
    createProject,
    refreshDashboard,

    // Computed data
    getProjectTasks,
    getOverdueTasks,
  };
};

export default useManagerDashboard;
