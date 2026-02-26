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
import {
  ClipboardList,
  CheckCircle2,
  Timer,
  Target,
  PieChart as PieChartIcon,
  BarChart3,
  TrendingUp,
  Lightbulb,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

const UserAnalytics = ({ tasks = [], user }) => {
  const { isDark } = useTheme();

  // Calculate user-specific metrics
  const myTasks = useMemo(
    () => tasks.filter((task) => task.assigneeId === user?.id) || [],
    [tasks, user?.id],
  );

  const completedTasks = myTasks.filter((task) => task.status === "COMPLETED");
  const doneTasks = myTasks.filter((task) => task.status === "IN_REVIEW");
  const allFinished = [...completedTasks, ...doneTasks];
  const inProgressTasks = myTasks.filter(
    (task) => task.status === "IN_PROGRESS",
  );
  const pendingTasks = myTasks.filter((task) => task.status === "PENDING");
  const overdueTasks = myTasks.filter((task) => task.isOverdue);

  // Enhanced analytics calculations
  const analytics = useMemo(() => {
    const totalTasks = myTasks.length;
    const completionRate =
      totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;

    // Priority breakdown
    const priorityData = [
      {
        name: "High",
        value: myTasks.filter((task) => task.priority === "HIGH").length,
        color: "#EF4444",
      },
      {
        name: "Medium",
        value: myTasks.filter((task) => task.priority === "MEDIUM").length,
        color: "#F59E0B",
      },
      {
        name: "Low",
        value: myTasks.filter((task) => task.priority === "LOW").length,
        color: "#10B981",
      },
    ].filter((item) => item.value > 0);

    // Status breakdown for Pie Chart
    const statusData = [
      { name: "Completed", value: completedTasks.length, color: "#10B981" },
      { name: "In Progress", value: inProgressTasks.length, color: "#F59E0B" },
      { name: "Pending", value: pendingTasks.length, color: "#EF4444" },
    ].filter((item) => item.value > 0);

    // Weekly productivity from real task data
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Count tasks completed per day of the week (last 7 days)
    const dayCounts = {
      Sun: 0,
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
    };
    allFinished.forEach((task) => {
      const date = new Date(task.completedAt || task.updatedAt);
      if (date >= weekAgo) {
        dayCounts[dayNames[date.getDay()]]++;
      }
    });

    // Also count tasks created per day for comparison
    const createdCounts = {
      Sun: 0,
      Mon: 0,
      Tue: 0,
      Wed: 0,
      Thu: 0,
      Fri: 0,
      Sat: 0,
    };
    myTasks.forEach((task) => {
      const date = new Date(task.createdAt);
      if (date >= weekAgo) {
        createdCounts[dayNames[date.getDay()]]++;
      }
    });

    const productivityTrend = [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ].map((day) => ({
      day,
      completed: dayCounts[day],
      assigned: createdCounts[day],
    }));

    // Dynamic performance insights based on real data
    const strengths = [];
    const opportunities = [];

    if (completionRate >= 80) {
      strengths.push(
        `Strong completion rate at ${Math.round(completionRate)}%`,
      );
    } else if (completionRate >= 50) {
      strengths.push(
        `Completion rate is ${Math.round(completionRate)}% — keep it up!`,
      );
    }

    if (allFinished.length > 0 && overdueTasks.length === 0) {
      strengths.push("All tasks are on schedule — no overdue items!");
    }

    const highPriorityCompleted = allFinished.filter(
      (t) => t.priority === "HIGH" || t.priority === "URGENT",
    ).length;
    if (highPriorityCompleted > 0) {
      strengths.push(
        `${highPriorityCompleted} high-priority task${highPriorityCompleted > 1 ? "s" : ""} completed`,
      );
    }

    if (totalTasks > 0 && allFinished.length === totalTasks) {
      strengths.push("All tasks completed — great work!");
    }

    if (strengths.length === 0) {
      strengths.push("Start completing tasks to build your track record");
    }

    if (completionRate < 50 && totalTasks > 0) {
      opportunities.push(
        `Completion rate is ${Math.round(completionRate)}% — focus on finishing in-progress tasks`,
      );
    }

    if (overdueTasks.length > 0) {
      opportunities.push(
        `${overdueTasks.length} task${overdueTasks.length > 1 ? "s are" : " is"} overdue — prioritize these first`,
      );
    }

    const highPriorityPending = myTasks.filter(
      (t) =>
        (t.priority === "HIGH" || t.priority === "URGENT") &&
        t.status !== "COMPLETED" &&
        t.status !== "IN_REVIEW",
    ).length;
    if (highPriorityPending > 0) {
      opportunities.push(
        `${highPriorityPending} high-priority task${highPriorityPending > 1 ? "s" : ""} still need attention`,
      );
    }

    if (
      pendingTasks.length > inProgressTasks.length + allFinished.length &&
      pendingTasks.length > 0
    ) {
      opportunities.push(
        "Most tasks are still pending — start working on them",
      );
    }

    if (opportunities.length === 0) {
      opportunities.push("You're doing great — keep up the momentum!");
    }

    return {
      totalTasks,
      completedTasks: allFinished.length,
      inProgressTasks: inProgressTasks.length,
      pendingTasks: pendingTasks.length,
      completionRate,
      priorityData,
      statusData,
      productivityTrend,
      strengths,
      opportunities,
    };
  }, [
    myTasks,
    completedTasks,
    doneTasks,
    allFinished,
    inProgressTasks,
    pendingTasks,
    overdueTasks,
  ]);

  // Metric cards data
  const metricCards = [
    {
      title: "Total Tasks",
      value: analytics.totalTasks,
      icon: <ClipboardList className="w-8 h-8 text-blue-500" />,
      color: "blue",
    },
    {
      title: "Completed",
      value: analytics.completedTasks,
      icon: <CheckCircle2 className="w-8 h-8 text-green-500" />,
      color: "green",
    },
    {
      title: "In Progress",
      value: analytics.inProgressTasks,
      icon: <Timer className="w-8 h-8 text-yellow-500" />,
      color: "yellow",
    },
    {
      title: "Completion Rate",
      value: `${Math.round(analytics.completionRate)}%`,
      icon: <Target className="w-8 h-8 text-purple-500" />,
      color: "purple",
    },
  ];

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
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1
            className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
          >
            Personal Analytics
          </h1>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => (
          <Card
            key={index}
            className={`p-6 transform transition-all duration-300 border-0 shadow-lg ${isDark ? "bg-gray-800/80 backdrop-blur" : "bg-white/80 backdrop-blur"}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p
                  className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"} mb-1`}
                >
                  {metric.title}
                </p>
                <p
                  className={`text-3xl font-bold ${isDark ? "text-white" : "text-gray-900"}`}
                >
                  {metric.value}
                </p>
              </div>
              <div className="text-3xl">{metric.icon}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Status Breakdown */}
        <Card
          className={`p-6 ${isDark ? "bg-gray-800/50" : "bg-white/50"} backdrop-blur border-0 shadow-lg`}
        >
          <h3
            className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"} mb-6 flex items-center gap-2`}
          >
            <PieChartIcon className="w-5 h-5" /> Task Status Overview
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {analytics.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Priority Distribution */}
        <Card
          className={`p-6 ${isDark ? "bg-gray-800/50" : "bg-white/50"} backdrop-blur border-0 shadow-lg`}
        >
          <h3
            className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"} mb-6 flex items-center gap-2`}
          >
            <BarChart3 className="w-5 h-5" /> Priority Distribution
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.priorityData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={false}
                  stroke={isDark ? "#374151" : "#E5E7EB"}
                />
                <XAxis type="number" stroke={isDark ? "#9CA3AF" : "#4B5563"} />
                <YAxis
                  dataKey="name"
                  type="category"
                  stroke={isDark ? "#9CA3AF" : "#4B5563"}
                  width={60}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: isDark ? "#374151" : "#F3F4F6" }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {analytics.priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Productivity Trend */}
      <Card
        className={`p-6 ${isDark ? "bg-gray-800/50" : "bg-white/50"} backdrop-blur border-0 shadow-lg`}
      >
        <h3
          className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"} mb-6 flex items-center gap-2`}
        >
          <TrendingUp className="w-5 h-5" /> Weekly Productivity Trend
        </h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={analytics.productivityTrend}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={isDark ? "#374151" : "#E5E7EB"}
              />
              <XAxis dataKey="day" stroke={isDark ? "#9CA3AF" : "#4B5563"} />
              <YAxis stroke={isDark ? "#9CA3AF" : "#4B5563"} />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: isDark ? "#374151" : "#F3F4F6" }}
              />
              <Legend wrapperStyle={{ paddingTop: "20px" }} />
              <Bar
                dataKey="completed"
                name="Completed"
                fill="#10B981"
                radius={[4, 4, 0, 0]}
                barSize={30}
              />
              <Bar
                dataKey="assigned"
                name="Assigned"
                fill={isDark ? "#4B5563" : "#CBD5E1"}
                radius={[4, 4, 0, 0]}
                barSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Performance Insights */}
      <Card
        className={`p-6 ${isDark ? "bg-gray-800/50" : "bg-white/50"} backdrop-blur border-0 shadow-lg`}
      >
        <h3
          className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"} mb-4 flex items-center gap-2`}
        >
          <Lightbulb className="w-5 h-5" /> Performance Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4
              className={`text-sm font-semibold ${isDark ? "text-green-400" : "text-green-600"} mb-4 flex items-center gap-2`}
            >
              <Sparkles className="w-4 h-4" /> Strengths
            </h4>
            <ul className="space-y-3">
              {analytics.strengths.map((insight, i) => (
                <li
                  key={i}
                  className={`text-sm ${isDark ? "text-green-400" : "text-green-600"} flex items-start gap-3`}
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4
              className={`text-sm font-semibold ${isDark ? "text-yellow-400" : "text-yellow-600"} mb-4 flex items-center gap-2`}
            >
              <ArrowUpRight className="w-4 h-4" /> Growth Opportunities
            </h4>
            <ul className="space-y-3">
              {analytics.opportunities.map((insight, i) => (
                <li
                  key={i}
                  className={`text-sm ${isDark ? "text-yellow-400" : "text-yellow-600"} flex items-start gap-3`}
                >
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserAnalytics;
