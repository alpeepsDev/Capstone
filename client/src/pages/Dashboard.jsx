import React from "react";
import { useAuth } from "../context";
import { Layout } from "../components/layout";
import { useDashboardState } from "../hooks";
import { Skeleton } from "../components/ui";

const Dashboards = {
  UserDashboard: React.lazy(
    () => import("../components/dashboard/UserDashboard"),
  ),
  ManagerDashboard: React.lazy(
    () => import("../components/dashboard/ManagerDashboard"),
  ),
  ModeratorDashboard: React.lazy(
    () => import("../components/dashboard/ModeratorDashboard"),
  ),
  AdminDashboard: React.lazy(
    () => import("../components/dashboard/AdminDashboard"),
  ),
};

// Loading component
const DashboardSkeleton = () => (
  <div className="h-full overflow-y-auto p-6">
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-xl border p-6 border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
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

const Dashboard = () => {
  const { user, logout } = useAuth();

  // Use custom hook for dashboard state management
  const {
    projects,
    projectsLoading,
    selectedProjectId,
    activeView,
    createProject,
    deleteProject,
    fetchProjects,
    favorites,
    toggleFavorite,
    handleProjectSelect,
    handleViewChange,
  } = useDashboardState(user);

  const renderRoleDashboard = () => {
    switch (user?.role) {
      case "ADMIN":
        return (
          <Dashboards.AdminDashboard
            user={user}
            activeView={activeView}
            onViewChange={handleViewChange}
          />
        );
      case "MODERATOR":
        return <Dashboards.ModeratorDashboard user={user} />;
      case "MANAGER":
        return (
          <Dashboards.ManagerDashboard
            user={user}
            projects={projects}
            projectsLoading={projectsLoading}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={handleProjectSelect}
            activeView={activeView}
            setActiveView={handleViewChange}
            onCreateProject={createProject}
            onDeleteProject={deleteProject}
            onRefreshProjects={fetchProjects}
          />
        );
      case "USER":
      default:
        return (
          <Dashboards.UserDashboard
            user={user}
            projects={projects}
            projectsLoading={projectsLoading}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={handleProjectSelect}
            activeView={activeView}
            setActiveView={handleViewChange}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
          />
        );
    }
  };

  return (
    <Layout
      user={user}
      onLogout={logout}
      // Pass props for Sidebar
      projects={projects}
      selectedProjectId={selectedProjectId}
      onProjectSelect={handleProjectSelect}
      activeView={activeView}
      onViewChange={handleViewChange}
    >
      <React.Suspense fallback={<DashboardSkeleton />}>
        {renderRoleDashboard()}
      </React.Suspense>
    </Layout>
  );
};

export default Dashboard;
