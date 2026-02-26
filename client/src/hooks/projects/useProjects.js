import { useState, useEffect, useCallback } from "react";
import { projectsApi } from "../../api/projects.js";

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectsApi.getUserProjects();
      const fetchedProjects = response.data || response; // Handle both response formats
      setProjects(Array.isArray(fetchedProjects) ? fetchedProjects : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error("Failed to fetch projects:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProject = async (projectData) => {
    setLoading(true);
    try {
      const newProject = await projectsApi.createProject(projectData);
      setProjects((prev) => [...(Array.isArray(prev) ? prev : []), newProject]);
      return newProject;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (projectId, projectData) => {
    setLoading(true);
    try {
      const updatedProject = await projectsApi.updateProject(
        projectId,
        projectData,
      );
      setProjects((prev) =>
        (Array.isArray(prev) ? prev : []).map((project) =>
          project.id === projectId ? updatedProject : project,
        ),
      );
      return updatedProject;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (projectId) => {
    setLoading(true);
    try {
      await projectsApi.deleteProject(projectId);
      setProjects((prev) =>
        (Array.isArray(prev) ? prev : []).filter(
          (project) => project.id !== projectId,
        ),
      );
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (projectId, userId, role = "USER") => {
    try {
      await projectsApi.addMember(projectId, userId, role);
      // Refetch to get updated member list
      await fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  };

  const removeMember = async (projectId, userId) => {
    try {
      await projectsApi.removeMember(projectId, userId);
      // Refetch to get updated member list
      await fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  };

  const updateMemberRole = async (projectId, userId, role) => {
    try {
      await projectsApi.updateMemberRole(projectId, userId, role);
      // Refetch to get updated member list
      await fetchProjects();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    addMember,
    removeMember,
    updateMemberRole,
  };
};

export default useProjects;
