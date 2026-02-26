import { PrismaClient } from "@prisma/client";
import {
  getTopInsights,
  generateDailyInsights,
  dismissInsight,
  markActionTaken,
} from "../../services/nova/insightGenerator.js";

const prisma = new PrismaClient();

/**
 * Nova Insights Controller
 * Manages AI-generated insights for users
 */

// Get user's active insights
export const getInsights = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 5 } = req.query;

    const insights = await getTopInsights(userId, parseInt(limit));

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    console.error("[Insights API] Error fetching insights:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch insights",
      error: error.message,
    });
  }
};

// Get insight history
export const getInsightHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [insights, total] = await Promise.all([
      prisma.novaInsight.findMany({
        where: { userId },
        include: {
          task: { select: { id: true, title: true } },
          project: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.novaInsight.count({ where: { userId } }),
    ]);

    res.json({
      success: true,
      data: insights,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("[Insights API] Error", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch insight history",
    });
  }
};

// Dismiss an insight
export const dismissInsightById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const insight = await prisma.novaInsight.findUnique({
      where: { id },
    });

    if (!insight || insight.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: "Insight not found",
      });
    }

    const updated = await dismissInsight(id);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("[Insights API] Error dismissing insight:", error);
    res.status(500).json({
      success: false,
      message: "Failed to dismiss insight",
    });
  }
};

// Mark insight as acted upon
export const markInsightAction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership
    const insight = await prisma.novaInsight.findUnique({
      where: { id },
    });

    if (!insight || insight.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: "Insight not found",
      });
    }

    const updated = await markActionTaken(id);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("[Insights API] Error marking action:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark action",
    });
  }
};

// Manually trigger insight generation for current user
export const generateInsights = async (req, res) => {
  try {
    const userId = req.user.id;

    const insights = await generateDailyInsights(userId);

    res.json({
      success: true,
      data: insights,
      message: `Generated ${insights.length} new insights`,
    });
  } catch (error) {
    console.error("[Insights API] Error generating insights:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate insights",
    });
  }
};

// Get insight statistics
export const getInsightStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await prisma.novaInsight.groupBy({
      by: ["type", "actionTaken"],
      where: { userId },
      _count: true,
    });

    const formatted = {
      total: stats.reduce((sum, s) => sum + s._count, 0),
      byType: {},
      actionTakenRate: 0,
    };

    let totalActionsTaken = 0;

    stats.forEach((stat) => {
      formatted.byType[stat.type] =
        (formatted.byType[stat.type] || 0) + stat._count;
      if (stat.actionTaken) {
        totalActionsTaken += stat._count;
      }
    });

    if (formatted.total > 0) {
      formatted.actionTakenRate = (totalActionsTaken / formatted.total) * 100;
    }

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("[Insights API] Error getting stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get insight statistics",
    });
  }
};
