import React, { useState, useEffect } from "react";
import { useAuth } from "../context";
import { Layout } from "../components/layout";
import {
  UserDashboard,
  ManagerDashboard,
  ModeratorDashboard,
  AdminDashboard,
} from "../components/dashboard";
import { useProjects } from "../hooks";

const Dashboard = () => {
  const { user, logout } = useAuth();

  // Lifted state for UserDashboard
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [activeView, setActiveView] = useState("table");

  // Fetch projects here to share between Sidebar and UserDashboard
  const { projects, loading: projectsLoading } = useProjects();

  // Auto-select first project on initial load for users
  const initialSelectionMade = React.useRef(false);

  useEffect(() => {
    if (
      user?.role === "USER" &&
      projects &&
      projects.length > 0 &&
      !selectedProjectId &&
      !initialSelectionMade.current
    ) {
      setSelectedProjectId(projects[0].id);
      initialSelectionMade.current = true;
    }
  }, [projects, selectedProjectId, user]);

  const renderRoleDashboard = () => {
    switch (user?.role) {
      case "ADMIN":
        return <AdminDashboard user={user} />;
      case "MODERATOR":
        return <ModeratorDashboard user={user} />;
      case "MANAGER":
        return <ManagerDashboard user={user} />;
      case "USER":
      default:
        return (
          <UserDashboard
            user={user}
            projects={projects}
            projectsLoading={projectsLoading}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
            activeView={activeView}
            setActiveView={setActiveView}
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
      onProjectSelect={(id) => {
        setSelectedProjectId(id);
        setActiveView("table");
      }}
      activeView={activeView}
      onViewChange={setActiveView}
    >
      {renderRoleDashboard()}
    </Layout>
  );
};

export default Dashboard;
