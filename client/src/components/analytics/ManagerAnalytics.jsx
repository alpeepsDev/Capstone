import React, { useMemo, useState, useEffect } from "react";
import { Card } from "../ui";
import { useTheme } from "../../context";
import api from "../../api/index.js";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Lightbulb, BarChart3 } from "lucide-react";
import logger from "../../utils/logger.js";

const ManagerAnalytics = ({
  tasks = [],
  projects = [],
  teamMembers = [],
  exchangeLogs = [],
  tasksAwaitingApproval = [],
}) => {
  const { isDark } = useTheme();

  const [projectAnalytics, setProjectAnalytics] = useState({});
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Fetch predictive analytics for all projects
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (projects.length === 0) return;
      setLoadingAnalytics(true);
      try {
        const analyticsData = {};
        // Note: In a production app, this might be optimized to a batch endpoint
        await Promise.all(
          projects.map(async (project) => {
            const { data } = await api.get(`/projects/${project.id}/analytics`);
            if (data.success) {
              analyticsData[project.id] = data.data;
            }
          }),
        );
        setProjectAnalytics(analyticsData);
      } catch (error) {
        logger.error("Error fetching project analytics:", error);
      } finally {
        setLoadingAnalytics(false);
      }
    };
    fetchAnalytics();
  }, [projects]);

  // Team performance metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === "COMPLETED");
  const inProgressTasks = tasks.filter((task) => task.status === "IN_PROGRESS");
  const pendingTasks = tasks.filter((task) => task.status === "PENDING");

  // Calculate overall completion rate
  const overallCompletionRate =
    totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Project completion rates for Bar Chart
  const projectStats = useMemo(() => {
    return projects
      .map((project) => {
        const projectTasks = tasks.filter(
          (task) => task.projectId === project.id,
        );
        const projectCompleted = projectTasks.filter(
          (task) => task.status === "COMPLETED",
        );
        const completionRate =
          projectTasks.length > 0
            ? Math.round((projectCompleted.length / projectTasks.length) * 100)
            : 0;

        return {
          name: project.name,
          completionRate,
          totalTasks: projectTasks.length,
          completedTasks: projectCompleted.length,
        };
      })
      .sort((a, b) => b.completionRate - a.completionRate); // Sort by completion rate
  }, [projects, tasks]);

  // Team member performance for Bar Chart
  const teamStats = useMemo(() => {
    return teamMembers
      .map((member) => {
        const memberTasks = tasks.filter(
          (task) => task.assigneeId === member.id,
        );
        const memberCompleted = memberTasks.filter(
          (task) => task.status === "COMPLETED",
        );

        return {
          name: member.name,
          completed: memberCompleted.length,
          assigned: memberTasks.length,
          completionRate:
            memberTasks.length > 0
              ? Math.round((memberCompleted.length / memberTasks.length) * 100)
              : 0,
        };
      })
      .sort((a, b) => b.completionRate - a.completionRate);
  }, [teamMembers, tasks]);

  // Task Status Distribution for Donut Chart
  const statusData = useMemo(
    () =>
      [
        { name: "Completed", value: completedTasks.length, color: "#10B981" },
        {
          name: "In Progress",
          value: inProgressTasks.length,
          color: "#F59E0B",
        },
        { name: "Pending", value: pendingTasks.length, color: "#EF4444" },
        {
          name: "Done (Needs Review)",
          value: tasks.filter((t) => t.status === "IN_REVIEW").length,
          color: "#8B5CF6",
        },
      ].filter((item) => item.value > 0),
    [completedTasks, inProgressTasks, pendingTasks, tasks],
  );

  // This week's activity
  const thisWeek = new Date();
  thisWeek.setDate(thisWeek.getDate() - 7);

  const thisWeekCompleted = tasks.filter(
    (task) =>
      task.status === "COMPLETED" &&
      task.updatedAt &&
      new Date(task.updatedAt) >= thisWeek,
  ).length;

  const thisWeekExchanges = exchangeLogs.filter(
    (exchange) =>
      exchange.requestedAt && new Date(exchange.requestedAt) >= thisWeek,
  ).length;

  // Approval metrics
  const approvalsPending = tasksAwaitingApproval.length;
  const avgApprovalTime = "1.5 days"; // Mock data

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          className={`p-3 rounded-lg shadow-lg border ${isDark ? "bg-gray-800 border-gray-700 text-white" : "bg-white border-gray-200 text-gray-900"}`}
        >
          <p className="font-semibold mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color || entry.fill }}>
              {entry.name}: {entry.value}
              {entry.unit ? entry.unit : ""}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Management Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: "Team Completion Rate",
            value: `${overallCompletionRate}%`,
            color: "text-blue-600",
            borderColor: "border-blue-200 dark:border-blue-900",
          },
          {
            title: "Completed This Week",
            value: thisWeekCompleted,
            color: "text-green-600",
            borderColor: "border-green-200 dark:border-green-900",
          },
          {
            title: "Pending Approvals",
            value: approvalsPending,
            color: "text-orange-600",
            borderColor: "border-orange-200 dark:border-orange-900",
          },
          {
            title: "Task Exchanges",
            value: thisWeekExchanges,
            color: "text-purple-600",
            borderColor: "border-purple-200 dark:border-purple-900",
          },
        ].map((card, idx) => (
          <Card
            key={idx}
            className={`p-4 border ${card.borderColor} ${isDark ? "bg-gray-800/50" : "bg-white"}`}
          >
            <div className="text-center">
              <div className={`text-3xl font-bold ${card.color}`}>
                {card.value}
              </div>
              <div
                className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
              >
                {card.title}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Charts - Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance - Horizontal Bar Chart */}
        <Card
          title="Team Performance"
          subtitle="Task completion rate by member"
          className={`${isDark ? "bg-gray-800/50" : "bg-white"} backdrop-blur`}
        >
          <div className="h-80 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={teamStats}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                  stroke={isDark ? "#374151" : "#E5E7EB"}
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke={isDark ? "#9CA3AF" : "#4B5563"}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke={isDark ? "#9CA3AF" : "#4B5563"}
                  width={80}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: isDark ? "#374151" : "#F3F4F6" }}
                />
                <Legend />
                <Bar
                  dataKey="completionRate"
                  name="Completion Rate (%)"
                  fill="#3B82F6"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Project Status - Horizontal Bar Chart */}
        <Card
          title="Project Status"
          subtitle="Task completion rate by project"
          className={`${isDark ? "bg-gray-800/50" : "bg-white"} backdrop-blur`}
        >
          <div className="h-80 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={projectStats}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                  stroke={isDark ? "#374151" : "#E5E7EB"}
                />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  stroke={isDark ? "#9CA3AF" : "#4B5563"}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke={isDark ? "#9CA3AF" : "#4B5563"}
                  width={80}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: isDark ? "#374151" : "#F3F4F6" }}
                />
                <Legend />
                <Bar
                  dataKey="completionRate"
                  name="Completion Rate (%)"
                  fill="#10B981"
                  radius={[0, 4, 4, 0]}
                  barSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Main Charts - Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Distribution - Donut Chart */}
        <Card
          title="Task Status Distribution"
          subtitle=""
          className={`${isDark ? "bg-gray-800/50" : "bg-white"} backdrop-blur`}
        >
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Management Insights - Text based */}
        <Card
          title="Predictive Insights"
          subtitle="Nova ML-driven metrics and predictions"
          className={`${isDark ? "bg-gray-800/50" : "bg-white"} backdrop-blur overflow-y-auto max-h-96`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            <div>
              <h4
                className={`font-medium mb-3 flex items-center ${isDark ? "text-white" : "text-gray-900"}`}
              >
                <BarChart3 className="w-4 h-4 mr-2 text-blue-500" /> System
                Health Scores
              </h4>
              <div className="space-y-4">
                {projects.length === 0 ? (
                  <div
                    className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    No active projects to analyze.
                  </div>
                ) : loadingAnalytics ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
                  </div>
                ) : (
                  projects.map((project) => {
                    const health = projectAnalytics[project.id]?.health;
                    if (!health) return null;

                    let statusColor = "text-green-500";
                    if (health.status === "AT_RISK")
                      statusColor = "text-orange-500";
                    if (health.status === "CRITICAL")
                      statusColor = "text-red-500";
                    if (health.status === "UNKNOWN" || health.score === 50)
                      statusColor = "text-gray-500";

                    return (
                      <div
                        key={`health-${project.id}`}
                        className="border-b border-gray-100 dark:border-gray-700 pb-2"
                      >
                        <div
                          className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-700"}`}
                        >
                          {project.name}
                        </div>
                        <div
                          className={`text-xs flex justify-between mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                        >
                          <span>
                            Score:{" "}
                            <span className={`font-semibold ${statusColor}`}>
                              {health.score}/100
                            </span>
                          </span>
                          <span>{health.status.replace("_", " ")}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <h4
                className={`font-medium mb-3 flex items-center ${isDark ? "text-white" : "text-gray-900"}`}
              >
                <Lightbulb className="w-4 h-4 mr-2 text-yellow-500" /> Predicted
                Risks
              </h4>
              <div className="space-y-3">
                {projects.length === 0 ? (
                  <div
                    className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Start managing projects to see predictions.
                  </div>
                ) : loadingAnalytics ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-8 bg-gray-300 rounded w-full mb-2"></div>
                    <div className="h-8 bg-gray-300 rounded w-full"></div>
                  </div>
                ) : (
                  (() => {
                    // Flatten all risks from all projects
                    const allRisks = projects.flatMap((p) => {
                      const risks =
                        projectAnalytics[p.id]?.predictions?.risks || [];
                      return risks.map((r) => ({ ...r, projectName: p.name }));
                    });

                    if (allRisks.length === 0) {
                      return (
                        <div
                          className={`text-sm flex items-center p-3 rounded-lg ${isDark ? "bg-green-900/20 text-green-400 border border-green-800" : "bg-green-50 text-green-700 border border-green-200"}`}
                        >
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                          No future risks detected across active projects. Great
                          work!
                        </div>
                      );
                    }

                    return allRisks.map((risk, idx) => {
                      const isHigh = risk.severity === "HIGH";
                      return (
                        <div
                          key={`risk-${idx}`}
                          className={`p-3 rounded-md text-sm border-l-4 ${
                            isHigh
                              ? isDark
                                ? "bg-red-900/20 border-red-500 text-red-100"
                                : "bg-red-50 border-red-500 text-red-900"
                              : isDark
                                ? "bg-orange-900/20 border-orange-500 text-orange-100"
                                : "bg-orange-50 border-orange-500 text-orange-900"
                          }`}
                        >
                          <div className="font-semibold">
                            {risk.title}{" "}
                            <span className="opacity-70 text-xs font-normal">
                              ({risk.projectName})
                            </span>
                          </div>
                          <div className="mt-1 opacity-90 text-xs">
                            {risk.description}
                          </div>
                        </div>
                      );
                    });
                  })()
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ManagerAnalytics;
