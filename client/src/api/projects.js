import api from "./index.js";

export const projectsApi = {
  // Get user's projects
  // Get user's projects
  getUserProjects: async () => {
    const response = await api.get("/projects");
    return response.data;
  },

  // Get single project with tasks
  // Get single project with tasks
  getProject: async (projectId) => {
    const response = await api.get(`/projects/${projectId}`);
    return response.data;
  },

  // Create new project
  // Create new project
  createProject: async (projectData) => {
    const response = await api.post("/projects", projectData);
    return response.data;
  },

  // Update project
  updateProject: async (projectId, updates) => {
    const response = await api.put(`/projects/${projectId}`, updates);
    return response.data;
  },

  // Delete project
  deleteProject: async (projectId) => {
    const response = await api.delete(`/projects/${projectId}`);
    return response.data;
  },

  // Add member to project
  addMember: async (projectId, userId, role = "USER") => {
    const response = await api.post(`/projects/${projectId}/members`, {
      userId,
      role,
    });
    return response.data;
  },

  // Remove member from project
  removeMember: async (projectId, userId) => {
    const response = await api.delete(
      `/projects/${projectId}/members/${userId}`
    );
    return response.data;
  },

  // Update member role
  updateMemberRole: async (projectId, userId, role) => {
    const response = await api.put(`/projects/${projectId}/members/${userId}`, {
      role,
    });
    return response.data;
  },

  // Get all users (for adding members)
  // Get all users (for adding members)
  getAllUsers: async () => {
    const response = await api.get("/users");
    return response.data;
  },
};
