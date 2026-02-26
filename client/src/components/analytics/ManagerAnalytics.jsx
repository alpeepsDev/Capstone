import React, { useMemo } from "react";
import { Card } from "../ui";
import { useTheme } from "../../context";
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

const ManagerAnalytics = ({
  tasks = [],
  projects = [],
  teamMembers = [],
  exchangeLogs = [],
  tasksAwaitingApproval = [],
}) => {
  const { isDark } = useTheme();

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
          title="Management Insights"
          subtitle="Key metrics and recommendations"
          className={`${isDark ? "bg-gray-800/50" : "bg-white"} backdrop-blur`}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
            <div>
              <h4
                className={`font-medium mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" /> Key Metrics
              </h4>
              <div className="space-y-2">
                <div
                  className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
                >
                  • Average approval time: {avgApprovalTime}
                </div>
                <div
                  className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
                >
                  • Active projects: {projects.length}
                </div>
                <div
                  className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
                >
                  • Total team members: {teamMembers.length}
                </div>
              </div>
            </div>

            <div>
              <h4
                className={`font-medium mb-3 ${isDark ? "text-white" : "text-gray-900"}`}
              >
                <Lightbulb className="w-4 h-4 inline mr-2" /> Recommendations
              </h4>
              <div className="space-y-2">
                {approvalsPending > 5 && (
                  <div
                    className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
                  >
                    • Review pending approvals to maintain team momentum
                  </div>
                )}
                {overallCompletionRate < 70 && (
                  <div
                    className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
                  >
                    • Focus on improving team completion rates
                  </div>
                )}
                {projects.length === 0 && (
                  <div
                    className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
                  >
                    • Create a new project to get started
                  </div>
                )}
                {overallCompletionRate >= 90 && (
                  <div
                    className={`text-sm ${isDark ? "text-gray-300" : "text-gray-600"}`}
                  >
                    • Excellent team performance! Consider taking on more tasks.
                  </div>
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
