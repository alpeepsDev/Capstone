import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  TrendingUp,
  Zap,
  X,
  RefreshCw,
  Lightbulb,
  AlertCircle,
  BarChart3,
} from "lucide-react";
import {
  getInsights,
  dismissInsight,
  generateInsights,
} from "../../api/insights";
import { useTheme } from "../../context";
import { toast } from "react-hot-toast";

const InsightsWidget = () => {
  const { isDark } = useTheme();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Fetch insights on mount
  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await getInsights(3); // Get top 3 insights
      setInsights(response.data || []);
    } catch (error) {
      console.error("Failed to fetch insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (insightId) => {
    try {
      // Optimistic update - remove from UI immediately
      setInsights((prev) => prev.filter((i) => i.id !== insightId));
      toast.success("Insight dismissed");

      // Call API in background
      await dismissInsight(insightId);
    } catch (error) {
      console.error("Failed to dismiss insight:", error);
      // Revert on error - refetch insights
      fetchInsights();
      toast.error("Failed to dismiss insight");
    }
  };

  const handleRefresh = async () => {
    try {
      setGenerating(true);
      await generateInsights();
      await fetchInsights();
      toast.success("New insights generated!");
    } catch (error) {
      console.error("Failed to generate insights:", error);
      toast.error("Failed to generate insights");
    } finally {
      setGenerating(false);
    }
  };

  // Get icon based on insight type
  const getInsightIcon = (type) => {
    const iconMap = {
      RISK_DETECTED: AlertTriangle,
      DEADLINE_WARNING: Clock,
      PATTERN_FOUND: TrendingUp,
      WORKLOAD_IMBALANCE: Zap,
      TASK_SUGGESTION: Lightbulb,
      PRODUCTIVITY_TIP: TrendingUp,
      COMPLETION_PREDICTION: Clock,
      BUDGET_ALERT: AlertCircle,
    };
    return iconMap[type] || Lightbulb;
  };

  // Get colors based on insight type
  const getInsightColors = (type) => {
    const colorMap = {
      RISK_DETECTED: {
        bg: isDark ? "bg-red-900/20" : "bg-red-50",
        border: isDark ? "border-red-800/30" : "border-red-200",
        icon: isDark ? "text-red-400" : "text-red-600",
        text: isDark ? "text-red-300" : "text-red-700",
      },
      DEADLINE_WARNING: {
        bg: isDark ? "bg-amber-900/20" : "bg-amber-50",
        border: isDark ? "border-amber-800/30" : "border-amber-200",
        icon: isDark ? "text-amber-400" : "text-amber-600",
        text: isDark ? "text-amber-300" : "text-amber-700",
      },
      PATTERN_FOUND: {
        bg: isDark ? "bg-blue-900/20" : "bg-blue-50",
        border: isDark ? "border-blue-800/30" : "border-blue-200",
        icon: isDark ? "text-blue-400" : "text-blue-600",
        text: isDark ? "text-blue-300" : "text-blue-700",
      },
      WORKLOAD_IMBALANCE: {
        bg: isDark ? "bg-purple-900/20" : "bg-purple-50",
        border: isDark ? "border-purple-800/30" : "border-purple-200",
        icon: isDark ? "text-purple-400" : "text-purple-600",
        text: isDark ? "text-purple-300" : "text-purple-700",
      },
      TASK_SUGGESTION: {
        bg: isDark ? "bg-green-900/20" : "bg-green-50",
        border: isDark ? "border-green-800/30" : "border-green-200",
        icon: isDark ? "text-green-400" : "text-green-600",
        text: isDark ? "text-green-300" : "text-green-700",
      },
    };
    return colorMap[type] || colorMap.PATTERN_FOUND;
  };

  if (loading) {
    return (
      <div
        className={`rounded-xl border p-6 ${isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-lg ${isDark ? "bg-blue-900/30" : "bg-blue-50"} animate-pulse`}
            />
            <div
              className={`h-5 w-32 rounded ${isDark ? "bg-gray-700" : "bg-gray-200"} animate-pulse`}
            />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-20 rounded-lg ${isDark ? "bg-gray-700/50" : "bg-gray-100"} animate-pulse`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-xl border ${isDark ? "bg-gray-800/50 border-gray-700" : "bg-white border-gray-200"} overflow-hidden`}
    >
      {/* Header */}
      <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${isDark ? "bg-blue-900/30" : "bg-blue-50"}`}
            >
              <BarChart3
                className={`w-5 h-5 ${isDark ? "text-blue-400" : "text-blue-600"}`}
              />
            </div>
            <div>
              <h3
                className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}
              >
                Nova Insights
              </h3>
              <p
                className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                AI-powered recommendations
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={generating}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? "hover:bg-gray-700" : "hover:bg-gray-100"
            } ${generating ? "opacity-50 cursor-not-allowed" : ""}`}
            title="Refresh insights"
          >
            <RefreshCw
              className={`w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-600"} ${generating ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* Insights List */}
      <div className="p-6 pt-4">
        <AnimatePresence mode="popLayout">
          {insights.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`text-center py-8 rounded-lg ${isDark ? "bg-gray-700/30" : "bg-gray-50"}`}
            >
              <Lightbulb
                className={`w-12 h-12 mx-auto mb-3 ${isDark ? "text-gray-600" : "text-gray-400"}`}
              />
              <p
                className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                No insights available yet
              </p>
              <p
                className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-gray-500"}`}
              >
                Click refresh to generate new insights
              </p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {insights.map((insight, index) => {
                const Icon = getInsightIcon(insight.type);
                const colors = getInsightColors(insight.type);

                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className={`relative group rounded-lg border p-4 ${colors.bg} ${colors.border}`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${isDark ? "bg-black/20" : "bg-white/50"}`}
                      >
                        <Icon className={`w-4 h-4 ${colors.icon}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4
                          className={`text-sm font-semibold ${isDark ? "text-white" : "text-gray-900"} mb-1`}
                        >
                          {insight.title}
                        </h4>
                        <p className={`text-xs ${colors.text} line-clamp-2`}>
                          {insight.description}
                        </p>

                        {/* Confidence Badge */}
                        <div className="flex items-center gap-2 mt-2">
                          <div
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              isDark ? "bg-black/20" : "bg-white/50"
                            } ${colors.text}`}
                          >
                            {Math.round(insight.confidence * 100)}% confidence
                          </div>
                          <span
                            className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
                          >
                            {new Date(insight.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Dismiss Button */}
                      <button
                        onClick={() => handleDismiss(insight.id)}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/10 dark:hover:bg-white/10`}
                        title="Dismiss insight"
                      >
                        <X
                          className={`w-4 h-4 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                        />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default InsightsWidget;
