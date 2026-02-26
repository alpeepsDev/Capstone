import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { motion } from "framer-motion";

// Badge color scheme matching - using Tailwind color values
const COLORS = {
  // Status badge colors
  completed: "#10b981", // green-500 (success)
  success: "#10b981", // green-500
  pending: "#f59e0b", // amber-500 (warning)
  warning: "#f59e0b", // amber-500
  "in progress": "#3b82f6", // blue-500 (info)
  info: "#3b82f6", // blue-500

  // Priority badge colors
  low: "#6b7280", // gray-500 (default)
  default: "#6b7280", // gray-500
  medium: "#f59e0b", // amber-500 (warning)
  high: "#ef4444", // red-500 (danger)
  urgent: "#dc2626", // red-600 (danger darker)

  // Risk badge colors
  critical: "#dc2626", // red-600 (danger)
  danger: "#ef4444", // red-500
};

/**
 * Custom Tooltip for charts
 */
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 backdrop-blur-sm"
      >
        <p className="font-semibold text-gray-900 dark:text-white text-sm">
          {data.name}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Count: <span className="font-bold">{data.value}</span>
        </p>
        {data.payload.percentage && (
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
            {data.payload.percentage}%
          </p>
        )}
      </motion.div>
    );
  }
  return null;
};

/**
 * Nova Chart Component
 * Displays interactive pie charts with hover tooltips
 * Colors match application badge color scheme
 */
const NovaChart = ({ data, type = "status", title }) => {
  if (!data || data.length === 0) return null;

  // Calculate percentages
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const chartData = data.map((item) => ({
    ...item,
    percentage: ((item.value / total) * 100).toFixed(1),
  }));

  // Get colors based on name, matching badge color scheme
  const getColor = (name) => {
    const lowerName = name.toLowerCase();

    // Direct color mapping
    if (COLORS[lowerName]) return COLORS[lowerName];

    // Status mapping
    if (lowerName.includes("complete")) return COLORS.completed;
    if (lowerName.includes("progress")) return COLORS.info;
    if (lowerName.includes("pending")) return COLORS.pending;
    if (lowerName.includes("done")) return COLORS.success;

    // Risk mapping
    if (lowerName.includes("critical")) return COLORS.critical;
    if (lowerName.includes("high")) return COLORS.high;
    if (lowerName.includes("medium")) return COLORS.medium;
    if (lowerName.includes("low")) return COLORS.low;

    // Priority mapping
    if (lowerName.includes("urgent")) return COLORS.urgent;

    // Default fallback
    return "#6366f1"; // indigo-500
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-600/50"
    >
      {title && (
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3">
          {title}
        </h4>
      )}

      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={70}
            fill="#8884d8"
            dataKey="value"
            animationBegin={0}
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getColor(entry.name)}
                className="cursor-pointer hover:opacity-80 transition-opacity"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: "12px" }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Summary */}
      <div className="mt-3 pt-3 border-t border-gray-300 dark:border-gray-600">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {chartData.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 p-2 rounded-lg bg-white/50 dark:bg-gray-900/30"
            >
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: getColor(item.name) }}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 dark:text-gray-200 truncate">
                  {item.name}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {item.value} ({item.percentage}%)
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default NovaChart;
