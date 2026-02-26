import api from "./index.js";

export const tasksApi = {
  // Get all tasks for a project
  getProjectTasks: async (projectId) => {
    const response = await api.get(`/tasks/project/${projectId}`);
    return response.data;
  },

  // Get single task
  getTask: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },

  // Create new task
  createTask: async (taskData) => {
    const response = await api.post("/tasks", taskData);
    return response.data;
  },

  // Update task
  updateTask: async (taskId, updates) => {
    const response = await api.put(`/tasks/${taskId}`, updates);
    return response.data;
  },

  // Move task (for Kanban board)
  moveTask: async (taskId, { status, position }) => {
    try {
      console.log("Moving task:", { taskId, status, position });
      const response = await api.put(`/tasks/${taskId}/move`, {
        status,
        position,
      });
      console.log("Move task response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Move task error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        taskId,
        newStatus: status,
        position,
      });
      throw error;
    }
  },

  // Assign task to user
  assignTask: async (taskId, assigneeId) => {
    const response = await api.put(`/tasks/${taskId}/assign`, { assigneeId });
    return response.data;
  },

  // Delete task
  deleteTask: async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },

  // Get task comments
  getTaskComments: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}/comments`);
    return response.data;
  },

  // Add task comment
  addTaskComment: async (taskId, content) => {
    const response = await api.post(`/tasks/${taskId}/comments`, { content });
    return response.data;
  },

  // Get task comments
  getComments: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}/comments`);
    return response.data;
  },

  // Add comment (alias for addTaskComment)
  addComment: async (taskId, commentData) => {
    return tasksApi.addTaskComment(taskId, commentData.content);
  },

  // Manager-specific endpoints
  getTasksAwaitingApproval: async () => {
    const response = await api.get("/tasks/manager/awaiting-approval");
    return response.data;
  },

  getManagerStats: async () => {
    const response = await api.get("/tasks/manager/stats");
    return response.data;
  },

  getManagerTasks: async () => {
    const response = await api.get("/tasks/manager/all-tasks");
    return response.data;
  },

  approveTask: async (taskId) => {
    const response = await api.put(`/tasks/${taskId}/approve`);
    return response.data;
  },

  // Work Logging
  logTime: async (workLogData) => {
    const response = await api.post("/worklogs", workLogData);
    return response.data;
  },

  getWorkLogs: async (taskId) => {
    const response = await api.get(`/worklogs/task/${taskId}`);
    return response.data;
  },
  // Delete work log
  deleteWorkLog: async (logId) => {
    const response = await api.delete(`/worklogs/${logId}`);
    return response.data;
  },

  // Update work log
  updateWorkLog: async (logId, data) => {
    const response = await api.put(`/worklogs/${logId}`, data);
    return response.data;
  },
};
