import { PrismaClient } from "@prisma/client";
import {
  addDays,
  format,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
} from "date-fns";

const prisma = new PrismaClient();

/**
 * Nova Proactive Notification Scheduler
 * Sends timely alerts to users about deadlines, risks, and insights
 */

/**
 * Send deadline warnings based on user preferences
 * Checks tasks due in 1, 3, 7 days and notifies users
 */
export const sendDeadlineWarnings = async () => {
  console.log("[Nova Scheduler] Checking for upcoming deadlines...");

  try {
    // Get all active users with their preferences
    const users = await prisma.user.findMany({
      where: { isActive: true },
      include: {
        aiPreference: true,
        assignedTasks: {
          where: {
            status: { not: "COMPLETED" },
            dueDate: { not: null },
          },
          include: { project: true },
        },
      },
    });

    const now = new Date();
    let notificationCount = 0;

    for (const user of users) {
      const preferences = user.aiPreference || {
        enableProactiveNotifs: true,
        deadlineWarningDays: [1, 3, 7],
      };

      if (!preferences.enableProactiveNotifs) continue;

      const warningDays = preferences.deadlineWarningDays || [1, 3, 7];

      for (const task of user.assignedTasks) {
        if (!task.dueDate) continue;

        const daysUntilDue = Math.ceil(
          (new Date(task.dueDate) - now) / (1000 * 60 * 60 * 24),
        );

        // Check if we should warn about this task
        if (warningDays.includes(daysUntilDue) && daysUntilDue > 0) {
          // Check if we already sent this notification today
          const existingNotif = await prisma.notification.findFirst({
            where: {
              userId: user.id,
              taskId: task.id,
              type: "DEADLINE_WARNING",
              createdAt: {
                gte: new Date(now.setHours(0, 0, 0, 0)),
              },
            },
          });

          if (!existingNotif) {
            await prisma.notification.create({
              data: {
                userId: user.id,
                taskId: task.id,
                projectId: task.projectId,
                type: "DEADLINE_WARNING",
                title: `Deadline Approaching: ${task.title}`,
                message: `This task is due in ${daysUntilDue} day${daysUntilDue > 1 ? "s" : ""}`,
              },
            });
            notificationCount++;
          }
        }
      }
    }

    console.log(`[Nova Scheduler] Sent ${notificationCount} deadline warnings`);
  } catch (error) {
    console.error("[Nova Scheduler] Error sending deadline warnings:", error);
  }
};

/**
 * Generate and send weekly summary reports
 * Runs every configured day (e.g., Monday morning)
 */
export const generateWeeklySummaries = async () => {
  console.log("[Nova Scheduler] Generating weekly summaries...");

  try {
    const now = new Date();
    const currentDay = now.getDay(); // 0=Sunday, 1=Monday, etc.

    // Get users who want weekly reports on this day
    const users = await prisma.user.findMany({
      where: {
        isActive: true,
        aiPreference: {
          weeklyReportDay: currentDay,
        },
      },
      include: {
        aiPreference: true,
        assignedTasks: {
          include: { project: true },
        },
      },
    });

    const weekStart = startOfWeek(now);
    const weekEnd = endOfWeek(now);

    for (const user of users) {
      // Get last week's completed tasks
      const completedTasks = await prisma.task.findMany({
        where: {
          assigneeId: user.id,
          status: "COMPLETED",
          completedAt: {
            gte: addDays(weekStart, -7),
            lt: weekStart,
          },
        },
      });

      // Get current week's tasks
      const thisWeekTasks = user.assignedTasks.filter((t) => {
        if (!t.dueDate) return false;
        return isWithinInterval(new Date(t.dueDate), {
          start: weekStart,
          end: weekEnd,
        });
      });

      // Get high-risk tasks
      const highRiskTasks = user.assignedTasks.filter(
        (t) => t.riskLevel === "HIGH" || t.riskLevel === "CRITICAL",
      );

      // Build summary message
      const summary = `
Weekly Summary for ${user.name}:

Last Week: Completed ${completedTasks.length} tasks
This Week: ${thisWeekTasks.length} tasks due
High Risk: ${highRiskTasks.length} tasks need attention

${
  highRiskTasks.length > 0
    ? `Priority Tasks:\n${highRiskTasks
        .slice(0, 3)
        .map((t) => `• ${t.title}`)
        .join("\n")}`
    : "Keep up the great work!"
}
      `.trim();

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "WEEKLY_SUMMARY",
          title: `📊 Your Weekly Summary`,
          message: summary,
        },
      });
    }

    console.log(`[Nova Scheduler] Generated ${users.length} weekly summaries`);
  } catch (error) {
    console.error("[Nova Scheduler] Error generating summaries:", error);
  }
};

/**
 * Send risk alerts when high-risk tasks are detected
 * Triggered when automation engine updates risk levels
 */
export const sendRiskAlerts = async () => {
  console.log("[Nova Scheduler] Checking for new risk alerts...");

  try {
    const now = new Date();
    const recentRiskyTasks = await prisma.task.findMany({
      where: {
        riskLevel: { in: ["HIGH", "CRITICAL"] },
        status: { not: "COMPLETED" },
        lastActivity: {
          gte: addDays(now, -1), // Updated in last 24 hours
        },
      },
      include: {
        assignee: true,
        project: true,
      },
    });

    for (const task of recentRiskyTasks) {
      if (!task.assigneeId) continue;

      // Check if we already alerted about this task recently
      const existingAlert = await prisma.notification.findFirst({
        where: {
          userId: task.assigneeId,
          taskId: task.id,
          type: "RISK_ALERT",
          createdAt: {
            gte: addDays(now, -2), // Within last 2 days
          },
        },
      });

      if (!existingAlert) {
        await prisma.notification.create({
          data: {
            userId: task.assigneeId,
            taskId: task.id,
            projectId: task.projectId,
            type: "RISK_ALERT",
            title: `⚠️ ${task.riskLevel} Risk: ${task.title}`,
            message: `This task requires immediate attention. ${task.isOverdue ? "It's overdue!" : ""}`,
          },
        });
      }
    }

    console.log(
      `[Nova Scheduler] Processed ${recentRiskyTasks.length} risk alerts`,
    );
  } catch (error) {
    console.error("[Nova Scheduler] Error sending risk alerts:", error);
  }
};

/**
 * Initialize the notification scheduler
 * Sets up recurring jobs for proactive notifications
 */
export const initNotificationScheduler = () => {
  console.log("[Nova Scheduler] Initializing proactive notification system...");

  // Run deadline warnings every hour
  sendDeadlineWarnings();
  setInterval(sendDeadlineWarnings, 60 * 60 * 1000);

  // Run weekly summaries once per day at 9 AM
  // (In production, use a proper cron library)
  const checkWeeklySummaries = () => {
    const now = new Date();
    if (now.getHours() === 9 && now.getMinutes() < 15) {
      generateWeeklySummaries();
    }
  };
  setInterval(checkWeeklySummaries, 15 * 60 * 1000); // Check every 15 min

  // Run risk alerts every 30 minutes
  sendRiskAlerts();
  setInterval(sendRiskAlerts, 30 * 60 * 1000);

  console.log("[Nova Scheduler] Notification scheduler active ✅");
};
