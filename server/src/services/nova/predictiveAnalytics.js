import { PrismaClient } from "@prisma/client";
import { addDays, differenceInDays, differenceInHours } from "date-fns";

const prisma = new PrismaClient();

/**
 * Nova Predictive Analytics Service
 * ML-based predictions for task completion, risks, and patterns
 */

/**
 * Predict when a task will be completed
 * Based on user velocity and similar task history
 */
export const predictCompletionDate = async (taskId) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: true,
        project: true,
      },
    });

    if (!task || !task.assigneeId) {
      return null;
    }

    // Calculate user velocity (average completion time)
    const userVelocity = await calculateUserVelocity(task.assigneeId);

    // Find similar completed tasks
    const similarTasks = await findSimilarTasks(task);

    // Calculate average time for similar tasks
    const avgSimilarTime =
      similarTasks.length > 0
        ? similarTasks.reduce((sum, t) => {
            const hours = differenceInHours(
              new Date(t.completedAt),
              new Date(t.createdAt),
            );
            return sum + hours;
          }, 0) / similarTasks.length
        : null;

    // Weighted prediction algorithm
    let estimatedHours;
    let confidence;

    if (avgSimilarTime !== null && userVelocity !== null) {
      // Combine both factors: 60% similar tasks, 40% user velocity
      estimatedHours = avgSimilarTime * 0.6 + userVelocity * 0.4;
      confidence = Math.min(0.85, 0.5 + similarTasks.length * 0.05);
    } else if (avgSimilarTime !== null) {
      // Only have similar tasks
      estimatedHours = avgSimilarTime;
      confidence = Math.min(0.7, 0.4 + similarTasks.length * 0.05);
    } else if (userVelocity !== null) {
      // Only have user velocity
      estimatedHours = userVelocity;
      confidence = 0.6;
    } else {
      // No data - use default estimate
      estimatedHours = 48; // 2 days default
      confidence = 0.3;
    }

    // Adjust for priority (urgent tasks tend to complete faster)
    if (task.priority === "URGENT") {
      estimatedHours *= 0.7;
    } else if (task.priority === "HIGH") {
      estimatedHours *= 0.85;
    }

    const predictedDate = addDays(new Date(), Math.ceil(estimatedHours / 24));

    // Store the prediction
    const prediction = await prisma.taskPrediction.create({
      data: {
        taskId: task.id,
        predictedCompletionAt: predictedDate,
        confidence,
        factors: {
          userVelocity,
          avgSimilarTime,
          similarTasksCount: similarTasks.length,
          priority: task.priority,
          estimatedHours,
        },
        basedOnSimilarTasks: similarTasks.length,
        userVelocityFactor: userVelocity,
      },
    });

    console.log(
      `[Nova Predictions] Task "${task.title}" predicted to complete by ${predictedDate.toLocaleDateString()}`,
    );

    return prediction;
  } catch (error) {
    console.error("[Nova Predictions] Error predicting completion:", error);
    return null;
  }
};

/**
 * Calculate user's average task completion velocity (in hours)
 */
const calculateUserVelocity = async (userId) => {
  const completedTasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      status: "COMPLETED",
      completedAt: { not: null },
      createdAt: {
        gte: addDays(new Date(), -90), // Last 90 days
      },
    },
    select: {
      createdAt: true,
      completedAt: true,
    },
  });

  if (completedTasks.length === 0) return null;

  const totalHours = completedTasks.reduce((sum, task) => {
    const hours = differenceInHours(
      new Date(task.completedAt),
      new Date(task.createdAt),
    );
    return sum + hours;
  }, 0);

  return totalHours / completedTasks.length;
};

/**
 * Find similar tasks based on project, priority, and title keywords
 */
const findSimilarTasks = async (task) => {
  const similarTasks = await prisma.task.findMany({
    where: {
      projectId: task.projectId,
      priority: task.priority,
      status: "COMPLETED",
      completedAt: { not: null },
      id: { not: task.id },
    },
    take: 10,
    orderBy: {
      completedAt: "desc",
    },
  });

  return similarTasks;
};

/**
 * Analyze user productivity patterns
 * Detects when users are most productive, common bottlenecks, etc.
 */
export const analyzeUserPatterns = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignedTasks: {
          where: {
            completedAt: { not: null },
            createdAt: {
              gte: addDays(new Date(), -90),
            },
          },
        },
      },
    });

    if (!user || user.assignedTasks.length < 5) {
      return { patterns: [], confidence: 0 };
    }

    const patterns = [];

    // Pattern 1: Days of week analysis
    const dayOfWeekCompletion = {};
    user.assignedTasks.forEach((task) => {
      const day = new Date(task.completedAt).getDay();
      dayOfWeekCompletion[day] = (dayOfWeekCompletion[day] || 0) + 1;
    });

    const mostProductiveDay = Object.entries(dayOfWeekCompletion).sort(
      ([, a], [, b]) => b - a,
    )[0];

    if (mostProductiveDay) {
      const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      patterns.push({
        type: "PRODUCTIVITY_PATTERN",
        description: `Most productive on ${dayNames[mostProductiveDay[0]]}`,
        confidence: 0.7,
      });
    }

    // Pattern 2: Task type preference
    const priorityCompletion = {};
    user.assignedTasks.forEach((task) => {
      priorityCompletion[task.priority] =
        (priorityCompletion[task.priority] || 0) + 1;
    });

    // Pattern 3: Overdue tendency
    const overdueTasks = user.assignedTasks.filter((t) => t.isOverdue);
    if (overdueTasks.length > user.assignedTasks.length * 0.3) {
      patterns.push({
        type: "RISK_PATTERN",
        description: "Tends to miss deadlines - consider earlier warnings",
        confidence: 0.8,
      });
    }

    return {
      patterns,
      confidence: patterns.length > 0 ? 0.75 : 0.3,
      totalTasksAnalyzed: user.assignedTasks.length,
    };
  } catch (error) {
    console.error("[Nova Predictions] Error analyzing patterns:", error);
    return { patterns: [], confidence: 0 };
  }
};

/**
 * Calculate overall project health score (0-100)
 * Based on task completion rates, risks, and velocity
 */
export const calculateProjectHealth = async (projectId) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: true,
      },
    });

    if (!project || project.tasks.length === 0) {
      return { score: 50, status: "UNKNOWN", factors: {} };
    }

    let score = 100;
    const factors = {};

    // Factor 1: Completion rate
    const completedTasks = project.tasks.filter(
      (t) => t.status === "COMPLETED",
    ).length;
    const completionRate = completedTasks / project.tasks.length;
    factors.completionRate = completionRate;

    if (completionRate < 0.3) score -= 30;
    else if (completionRate < 0.5) score -= 15;

    // Factor 2: Overdue tasks
    const overdueTasks = project.tasks.filter((t) => t.isOverdue).length;
    const overdueRate = overdueTasks / project.tasks.length;
    factors.overdueRate = overdueRate;

    if (overdueRate > 0.3) score -= 40;
    else if (overdueRate > 0.15) score -= 20;
    else if (overdueRate > 0.05) score -= 10;

    // Factor 3: High-risk tasks
    const highRiskTasks = project.tasks.filter(
      (t) => t.riskLevel === "HIGH" || t.riskLevel === "CRITICAL",
    ).length;
    const riskRate = highRiskTasks / project.tasks.length;
    factors.riskRate = riskRate;

    if (riskRate > 0.5) score -= 25;
    else if (riskRate > 0.25) score -= 15;

    // Factor 4: Unassigned tasks
    const unassignedTasks = project.tasks.filter(
      (t) => !t.assigneeId && t.status !== "COMPLETED",
    ).length;
    const unassignedRate = unassignedTasks / project.tasks.length;
    factors.unassignedRate = unassignedRate;

    if (unassignedRate > 0.2) score -= 15;

    // Determine status
    let status;
    if (score >= 80) status = "HEALTHY";
    else if (score >= 60) status = "GOOD";
    else if (score >= 40) status = "AT_RISK";
    else status = "CRITICAL";

    factors.completedTasks = completedTasks;
    factors.totalTasks = project.tasks.length;
    factors.overdueTasks = overdueTasks;
    factors.highRiskTasks = highRiskTasks;

    return {
      score: Math.max(0, Math.min(100, score)),
      status,
      factors,
    };
  } catch (error) {
    console.error(
      "[Nova Predictions] Error calculating project health:",
      error,
    );
    return { score: 50, status: "ERROR", factors: {} };
  }
};

/**
 * Predict future risks for a project
 * Identifies potential issues before they become critical
 */
export const predictFutureRisks = async (projectId) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          where: {
            status: { notIn: ["COMPLETED", "CANCELLED"] },
          },
        },
      },
    });

    if (!project) return { risks: [] };

    const risks = [];

    // Risk 1: Approaching deadline with many incomplete tasks
    if (project.endDate) {
      const daysUntilEnd = differenceInDays(
        new Date(project.endDate),
        new Date(),
      );
      const incompleteTasks = project.tasks.length;

      if (daysUntilEnd < 14 && incompleteTasks > 10) {
        risks.push({
          type: "DEADLINE_RISK",
          title: "Project deadline at risk",
          description: `${incompleteTasks} tasks remaining with only ${daysUntilEnd} days until deadline`,
          confidence: 0.85,
          severity: "HIGH",
        });
      }
    }

    // Risk 2: Bottleneck - one person with too many tasks
    const assigneeWorkload = {};
    project.tasks.forEach((task) => {
      if (task.assigneeId) {
        assigneeWorkload[task.assigneeId] =
          (assigneeWorkload[task.assigneeId] || 0) + 1;
      }
    });

    const maxWorkload = Math.max(...Object.values(assigneeWorkload));
    if (maxWorkload > 10) {
      risks.push({
        type: "WORKLOAD_IMBALANCE",
        title: "Workload bottleneck detected",
        description: `One team member has ${maxWorkload} active tasks - consider redistributing`,
        confidence: 0.9,
        severity: "MEDIUM",
      });
    }

    // Risk 3: Many high-priority tasks
    const urgentTasks = project.tasks.filter(
      (t) => t.priority === "URGENT",
    ).length;
    if (urgentTasks > 5) {
      risks.push({
        type: "PRIORITY_OVERLOAD",
        title: "Too many urgent tasks",
        description: `${urgentTasks} urgent tasks may indicate poor planning or scope creep`,
        confidence: 0.7,
        severity: "MEDIUM",
      });
    }

    return { risks };
  } catch (error) {
    console.error("[Nova Predictions] Error predicting risks:", error);
    return { risks: [] };
  }
};

/**
 * Refresh predictions for all active tasks
 * Called periodically by scheduler
 */
export const refreshPredictions = async () => {
  console.log("[Nova Predictions] Refreshing predictions for active tasks...");

  try {
    const activeTasks = await prisma.task.findMany({
      where: {
        status: "IN_PROGRESS",
        assigneeId: { not: null },
      },
      take: 50, // Limit to avoid overload
    });

    for (const task of activeTasks) {
      // Only create new prediction if we don't have a recent one
      const existingPrediction = await prisma.taskPrediction.findFirst({
        where: {
          taskId: task.id,
          createdAt: {
            gte: addDays(new Date(), -7), // Within last week
          },
        },
      });

      if (!existingPrediction) {
        await predictCompletionDate(task.id);
      }
    }

    console.log(
      `[Nova Predictions] Refreshed predictions for ${activeTasks.length} tasks`,
    );
  } catch (error) {
    console.error("[Nova Predictions] Error refreshing predictions:", error);
  }
};
