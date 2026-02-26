import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useProjects } from "../projects/useProjects";

/**
 * Custom hook for managing dashboard-level state
 * Encapsulates project management, view state, and favorites
 * Used by the main Dashboard component
 */
export const useDashboardState = (user) => {
  const {
    projects,
    loading: projectsLoading,
    fetchProjects,
    createProject,
    deleteProject,
  } = useProjects();

  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");

  // Favorites State
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem("projectFavorites");
    return saved ? JSON.parse(saved) : [];
  });

  const toggleFavorite = (projectId) => {
    setFavorites((prev) => {
      const newFavorites = prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId];
      localStorage.setItem("projectFavorites", JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  // Sync state with URL parameters
  const [searchParams, setSearchParams] = useSearchParams();
  const projectIdParam = searchParams.get("projectId");

  // Sync State -> URL (Init/Deep Link)
  useEffect(() => {
    if (projectIdParam) {
      if (projectIdParam !== selectedProjectId || activeView === "dashboard") {
        setSelectedProjectId(projectIdParam);
        // Ensure we are in the table view when a project is selected via URL
        setActiveView("table");
      }
    }
  }, [projectIdParam, selectedProjectId, activeView]);

  // Sync URL -> State (Sidebar Click)
  const handleProjectSelect = (id) => {
    setSelectedProjectId(id);
    if (id) {
      setActiveView("table");
      setSearchParams({ projectId: id });
    } else {
      setSearchParams({});
    }
  };

  const handleViewChange = (view) => {
    setActiveView(view);
  };

  return {
    // Project state
    projects,
    projectsLoading,
    selectedProjectId,
    setSelectedProjectId,
    createProject,
    deleteProject,
    fetchProjects,

    // View state
    activeView,
    setActiveView,

    // Favorites
    favorites,
    toggleFavorite,

    // Handlers
    handleProjectSelect,
    handleViewChange,
  };
};
