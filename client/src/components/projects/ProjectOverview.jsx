import React, { useState } from "react";
import { Button, Badge, Card, Container } from "../ui";
import CreateProjectModal from "./CreateProjectModal";
import ProjectMemberManager from "./ProjectMemberManager";
import KanbanBoard from "../kanban/KanbanBoard";
import { useTheme } from "../../context";

const ProjectOverview = ({
  projects,
  currentUser,
  tasks,
  availableUsers,
  onCreateProject,
  onAddMember,
  onRemoveMember,
  onTaskMove,
  onTaskEdit,
  onTaskDelete,
  onTaskClick,
  onAddTask,
}) => {
  const { isDark } = useTheme();
  const [activeView, setActiveView] = useState("overview");
  const [selectedProject, setSelectedProject] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMemberManager, setShowMemberManager] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreateProject = async (projectData) => {
    setLoading(true);
    try {
      await onCreateProject(projectData);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Project creation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const getProjectProgress = (project) => {
    const projectTasks = tasks.filter((task) => task.projectId === project.id);
    const completedTasks = projectTasks.filter(
      (task) => task.status === "COMPLETED"
    );
    return projectTasks.length > 0
      ? Math.round((completedTasks.length / projectTasks.length) * 100)
      : 0;
  };

  const getProjectTasks = (projectId) => {
    return tasks.filter((task) => task.projectId === projectId);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Container>
      <div className="py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
            >
              {activeView === "overview"
                ? "Projects Overview"
                : activeView === "kanban"
                  ? `${selectedProject?.name} - Kanban Board`
                  : "Manage Members"}
            </h1>
            <p className={`${isDark ? "text-gray-300" : "text-gray-600"}`}>
              {activeView === "overview"
                ? "Manage your projects and teams"
                : activeView === "kanban"
                  ? selectedProject?.description
                  : "Add or remove project members"}
            </p>
          </div>
          <div className="flex gap-2">
            {activeView !== "overview" && (
              <Button
                variant="secondary"
                onClick={() => {
                  setActiveView("overview");
                  setSelectedProject(null);
                  setShowMemberManager(false);
                }}
              >
                ← Back to Projects
              </Button>
            )}
            {activeView === "overview" && (
              <Button onClick={() => setShowCreateModal(true)}>
                New Project
              </Button>
            )}
            {activeView === "kanban" && (
              <Button
                variant="secondary"
                onClick={() => setShowMemberManager(true)}
              >
                Manage Members
              </Button>
            )}
          </div>
        </div>

        {/* Projects Overview */}
        {activeView === "overview" && (
          <div className="space-y-6">
            {/* Project Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card padding="sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {projects.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Projects</div>
                </div>
              </Card>
              <Card padding="sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {projects.reduce(
                      (sum, p) => sum + (p.members?.length || 0),
                      0
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Team Members</div>
                </div>
              </Card>
              <Card padding="sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {tasks.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Tasks</div>
                </div>
              </Card>
              <Card padding="sm">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {Math.round(
                      projects.reduce(
                        (sum, p) => sum + getProjectProgress(p),
                        0
                      ) / (projects.length || 1)
                    )}
                    %
                  </div>
                  <div className="text-sm text-gray-600">Avg Progress</div>
                </div>
              </Card>
            </div>

            {/* Projects Grid */}
            <Card title="Your Projects" subtitle="Projects you're managing">
              {projects.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📁</div>
                  <h3
                    className={`text-xl font-medium ${isDark ? "text-white" : "text-gray-900"} mb-2`}
                  >
                    No Projects Yet
                  </h3>
                  <p
                    className={`${isDark ? "text-gray-300" : "text-gray-600"} mb-6`}
                  >
                    Create your first project to get started
                  </p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    Create First Project
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project) => {
                    const progress = getProjectProgress(project);
                    const projectTasks = getProjectTasks(project.id);
                    const pendingTasks = projectTasks.filter(
                      (t) => t.status === "PENDING"
                    ).length;
                    const completedTasks = projectTasks.filter(
                      (t) => t.status === "COMPLETED"
                    ).length;

                    return (
                      <div
                        key={project.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => {
                          setSelectedProject(project);
                          setActiveView("kanban");
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4
                            className={`font-medium ${isDark ? "text-white" : "text-gray-900"}`}
                          >
                            {project.name}
                          </h4>
                          <Badge variant="primary">{progress}%</Badge>
                        </div>

                        <p
                          className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"} mb-4 line-clamp-2`}
                        >
                          {project.description || "No description provided"}
                        </p>

                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>
                              {completedTasks}/{projectTasks.length} tasks
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex justify-between text-xs text-gray-500 mb-3">
                          <span>{project.members?.length || 0} members</span>
                          <span>{pendingTasks} pending</span>
                        </div>

                        <div className="text-xs text-gray-500">
                          Created: {formatDate(project.createdAt)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Kanban View */}
        {activeView === "kanban" && selectedProject && (
          <KanbanBoard
            tasks={getProjectTasks(selectedProject.id)}
            userRole={currentUser.role}
            currentUserId={currentUser.id}
            onTaskMove={onTaskMove}
            onTaskEdit={onTaskEdit}
            onTaskDelete={onTaskDelete}
            onTaskClick={onTaskClick}
            onAddTask={onAddTask}
            projectId={selectedProject.id}
          />
        )}

        {/* Member Manager Modal */}
        {showMemberManager && selectedProject && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">
                    Manage Project Members
                  </h3>
                  <button
                    onClick={() => setShowMemberManager(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
                <ProjectMemberManager
                  project={selectedProject}
                  availableUsers={availableUsers}
                  onAddMember={onAddMember}
                  onRemoveMember={onRemoveMember}
                />
              </div>
            </div>
          </div>
        )}

        {/* Create Project Modal */}
        <CreateProjectModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateProject}
          loading={loading}
        />
      </div>
    </Container>
  );
};

export default ProjectOverview;
