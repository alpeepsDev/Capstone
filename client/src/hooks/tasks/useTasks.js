import { useState, useEffect, useCallback } from "react";
import { tasksApi } from "../../api/tasks.js";
import webSocketService from "../../services/websocket.service.js";

export const useTasks = (projectId = null) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await tasksApi.getProjectTasks(projectId);
      const fetchedTasks = response.data || response; // Handle both response formats
      setTasks(Array.isArray(fetchedTasks) ? fetchedTasks : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const createTask = async (taskData) => {
    setLoading(true);
    try {
      const response = await tasksApi.createTask({
        ...taskData,
        projectId,
      });
      const newTask = response.data || response; // Handle both response formats
      setTasks((prev) => [...(Array.isArray(prev) ? prev : []), newTask]);
      return newTask;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (taskId, taskData) => {
    // Optimistic update - update UI immediately
    const originalTasks = Array.isArray(tasks) ? tasks : [];
    const optimisticTasks = originalTasks.map((task) =>
      task.id === taskId ? { ...task, ...taskData } : task,
    );
    setTasks(optimisticTasks);

    setLoading(true);
    try {
      const response = await tasksApi.updateTask(taskId, taskData);
      const updatedTask = response.data || response; // Handle both response formats

      // Update with actual server response
      setTasks((prev) =>
        (Array.isArray(prev) ? prev : []).map((task) =>
          task.id === taskId ? updatedTask : task,
        ),
      );
      return updatedTask;
    } catch (err) {
      // Revert optimistic update on error
      setTasks(originalTasks);
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (taskId) => {
    setLoading(true);
    try {
      await tasksApi.deleteTask(taskId);
      setTasks((prev) =>
        (Array.isArray(prev) ? prev : []).filter((task) => task.id !== taskId),
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus, position = null) => {
    // Optimistic update - update UI immediately
    const originalTasks = Array.isArray(tasks) ? tasks : [];
    const optimisticTasks = originalTasks.map((task) =>
      task.id === taskId
        ? { ...task, status: newStatus, position: position || task.position }
        : task,
    );
    setTasks(optimisticTasks);

    try {
      // Use move task API for status changes
      const response = await tasksApi.moveTask(taskId, {
        status: newStatus,
        position,
      });
      const updatedTask = response.data || response; // Handle both response formats

      // Update with actual server response
      setTasks((prev) =>
        (Array.isArray(prev) ? prev : []).map((task) =>
          task.id === taskId ? updatedTask : task,
        ),
      );
      return updatedTask;
    } catch (err) {
      // Revert optimistic update on error
      setTasks(originalTasks);
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  };

  const assignTask = async (taskId, assigneeId) => {
    try {
      const response = await tasksApi.assignTask(taskId, assigneeId);
      const updatedTask = response.data || response; // Handle both response formats
      setTasks((prev) =>
        (Array.isArray(prev) ? prev : []).map((task) =>
          task.id === taskId ? updatedTask : task,
        ),
      );
      return updatedTask;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  };

  const toggleComplete = async (taskId) => {
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const task = safeTasks.find((t) => t.id === taskId);
    if (!task) return;

    const newStatus =
      task.status === "COMPLETED"
        ? "PENDING"
        : task.status === "PENDING"
          ? "IN_REVIEW"
          : "COMPLETED";

    await updateTaskStatus(taskId, newStatus);
  };

  // Auto-fetch on mount and when projectId changes
  useEffect(() => {
    if (projectId) {
      fetchTasks();

      // Join project room
      webSocketService.joinProject(projectId);

      // Socket event handlers
      const handleTaskCreated = (newTask) => {
        setTasks((prev) => {
          const tasks = Array.isArray(prev) ? prev : [];
          if (tasks.some((t) => t.id === newTask.id)) return tasks;
          return [...tasks, newTask];
        });
      };

      const handleTaskUpdated = (updatedTask) => {
        setTasks((prev) => {
          const tasks = Array.isArray(prev) ? prev : [];
          return tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t));
        });
      };

      const handleTaskMoved = (movedTask) => {
        setTasks((prev) => {
          const tasks = Array.isArray(prev) ? prev : [];
          return tasks.map((t) => (t.id === movedTask.id ? movedTask : t));
        });
      };

      const handleTaskDeleted = ({ taskId }) => {
        setTasks((prev) => {
          const tasks = Array.isArray(prev) ? prev : [];
          return tasks.filter((t) => t.id !== taskId);
        });
      };

      // Subscribe to events
      webSocketService.onTaskCreated(handleTaskCreated);
      webSocketService.onTaskUpdated(handleTaskUpdated);
      webSocketService.onTaskMoved(handleTaskMoved);
      webSocketService.onTaskDeleted(handleTaskDeleted);

      return () => {
        // Cleanup
        webSocketService.leaveProject(projectId);
        webSocketService.offTaskEvents(); // Note: This might remove listeners for other components if any
      };
    }
  }, [projectId, fetchTasks]);

  return {
    tasks,
    loading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    assignTask,
    toggleComplete,
  };
};

export default useTasks;
