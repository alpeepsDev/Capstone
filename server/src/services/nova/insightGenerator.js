import prisma from "../../config/database.js";
import {
  analyzeUserPatterns,
  calculateProjectHealth,
  predictFutureRisks,
} from "./predictiveAnalytics.js";

/**
 * Nova Insight Generator
 * Creates actionable insights for dashboard display
 */

/**
 * Generate daily insights for a user
 * Creates personalized recommendations based on current tasks and patterns
 */
export const generateDailyInsights = async (userId) => {
  console.log(
    `[Nova Insights] Generating daily insights for user ${userId}...`,
  );

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignedTasks: {
          where: {
            status: { notIn: ["COMPLETED", "CANCELLED"] },
          },
          include: {
            project: true,
          },
        },
        aiPreference: true,
      },
    });

    if (!user) return [];

    const preferences = user.aiPreference || {
      preferredInsightTypes: [
        "RISK_DETECTED",
        "DEADLINE_WARNING",
        "PATTERN_FOUND",
      ],
    };

    const insights = [];

    // Insight 1: High-risk tasks
    if (preferences.preferredInsightTypes.includes("RISK_DETECTED")) {
      const highRiskTasks = user.assignedTasks.filter(
        (t) => t.riskLevel === "HIGH" || t.riskLevel === "CRITICAL",
      );

      if (highRiskTasks.length > 0) {
        insights.push({
          userId,
          type: "RISK_DETECTED",
          title: `${highRiskTasks.length} high-risk task${highRiskTasks.length > 1 ? "s" : ""} need attention`,
          description: `Focus on: ${highRiskTasks
            .slice(0, 3)
            .map((t) => `"${t.title}"`)
            .join(", ")}`,
          taskId: highRiskTasks[0].id,
          projectId: highRiskTasks[0].projectId,
          confidence: 0.9,
          metadata: {
            taskCount: highRiskTasks.length,
            topTasks: highRiskTasks.slice(0, 3).map((t) => ({
              id: t.id,
              title: t.title,
              riskLevel: t.riskLevel,
            })),
          },
        });
      }
    }

    // Insight 2: Upcoming deadlines
    if (preferences.preferredInsightTypes.includes("DEADLINE_WARNING")) {
      const upcomingDeadlines = user.assignedTasks.filter((t) => {
        if (!t.dueDate) return false;
        const daysUntil = Math.ceil(
          (new Date(t.dueDate) - new Date()) / (1000 * 60 * 60 * 24),
        );
        return daysUntil >= 0 && daysUntil <= 3;
      });

      if (upcomingDeadlines.length > 0) {
        insights.push({
          userId,
          type: "DEADLINE_WARNING",
          title: `${upcomingDeadlines.length} task${upcomingDeadlines.length > 1 ? "s" : ""} due soon`,
          description: `Deadlines approaching in the next 3 days`,
          confidence: 1.0,
          metadata: {
            tasks: upcomingDeadlines.map((t) => ({
              id: t.id,
              title: t.title,
              dueDate: t.dueDate,
              daysUntil: Math.ceil(
                (new Date(t.dueDate) - new Date()) / (1000 * 60 * 60 * 24),
              ),
            })),
          },
        });
      }
    }

    // Insight 3: Pattern-based suggestions
    if (preferences.preferredInsightTypes.includes("PATTERN_FOUND")) {
      const patterns = await analyzeUserPatterns(userId);
      if (patterns.patterns.length > 0) {
        patterns.patterns.forEach((pattern) => {
          insights.push({
            userId,
            type: "PATTERN_FOUND",
            title: "Productivity insight",
            description: pattern.description,
            confidence: pattern.confidence,
            metadata: {
              patternType: pattern.type,
              analyzedTaskCount: patterns.totalTasksAnalyzed,
            },
          });
        });
      }
    }

    // Insight 4: Workload balance
    if (preferences.preferredInsightTypes.includes("WORKLOAD_IMBALANCE")) {
      const activeTasks = user.assignedTasks.length;
      if (activeTasks > 15) {
        insights.push({
          userId,
          type: "WORKLOAD_IMBALANCE",
          title: "High workload detected",
          description: `You have ${activeTasks} active tasks. Consider delegating or postponing lower-priority items.`,
          confidence: 0.85,
          metadata: {
            activeTaskCount: activeTasks,
            suggestion: "DELEGATE",
          },
        });
      } else if (activeTasks === 0) {
        insights.push({
          userId,
          type: "TASK_SUGGESTION",
          title: "No active tasks",
          description: "Consider picking up new tasks from your projects.",
          confidence: 0.7,
          metadata: {
            suggestion: "PICKUP_TASKS",
          },
        });
      }
    }

    // Store unique insights (avoid duplicates)
    const uniqueInsights = await deduplicateInsights(insights);
    const createdInsights = [];

    for (const insightData of uniqueInsights) {
      const created = await prisma.novaInsight.create({
        data: insightData,
      });
      createdInsights.push(created);
    }

    console.log(
      `[Nova Insights] Created ${createdInsights.length} insights for user ${userId}`,
    );
    return createdInsights;
  } catch (error) {
    console.error("[Nova Insights] Error generating insights:", error);
    return [];
  }
};

/**
 * Remove duplicate insights created recently
 */
const deduplicateInsights = async (newInsights) => {
  const uniqueInsights = [];

  for (const insight of newInsights) {
    // Check if similar insight exists in last 24 hours
    const existing = await prisma.novaInsight.findFirst({
      where: {
        userId: insight.userId,
        type: insight.type,
        dismissed: false,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
    });

    if (!existing) {
      uniqueInsights.push(insight);
    }
  }

  return uniqueInsights;
};

/**
 * Get top insights for a user (for dashboard display)
 * Returns most important, non-dismissed insights
 */
export const getTopInsights = async (userId, limit = 5) => {
  try {
    const insights = await prisma.novaInsight.findMany({
      where: {
        userId,
        dismissed: false,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [{ confidence: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    return insights;
  } catch (error) {
    console.error("[Nova Insights] Error fetching top insights:", error);
    return [];
  }
};

/**
 * Dismiss an insight
 * User indicates they've seen it or it's not useful
 */
export const dismissInsight = async (insightId) => {
  try {
    const insight = await prisma.novaInsight.update({
      where: { id: insightId },
      data: { dismissed: true },
    });

    console.log(`[Nova Insights] Dismissed insight ${insightId}`);
    return insight;
  } catch (error) {
    console.error("[Nova Insights] Error dismissing insight:", error);
    return null;
  }
};

/**
 * Mark insight as acted upon
 * User took action based on the insight
 */
export const markActionTaken = async (insightId) => {
  try {
    const insight = await prisma.novaInsight.update({
      where: { id: insightId },
      data: { actionTaken: true },
    });

    console.log(`[Nova Insights] Marked action taken for insight ${insightId}`);
    return insight;
  } catch (error) {
    console.error("[Nova Insights] Error marking action:", error);
    return null;
  }
};

/**
 * Generate insights for all active users
 * Called by scheduler
 */
export const generateInsightsForAllUsers = async () => {
  console.log("[Nova Insights] Generating insights for all active users...");

  try {
    const activeUsers = await prisma.user.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });

    for (const user of activeUsers) {
      await generateDailyInsights(user.id);
    }

    console.log(
      `[Nova Insights] Generated insights for ${activeUsers.length} users`,
    );
  } catch (error) {
    console.error("[Nova Insights] Error in batch insight generation:", error);
  }
};
