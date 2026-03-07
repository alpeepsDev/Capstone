import prisma from "../../config/database.js";

/**
 * Nova Automation Engine
 * Performs intelligent automated actions to reduce manual work
 */

/**
 * Auto-escalate overdue tasks to managers
 * Increases priority and notifies project managers
 */
export const escalateOverdueTasks = async () => {
  console.log("[Nova Automation] Running auto-escalation...");

  try {
    // Find overdue tasks that haven't been escalated recently
    const overdueTasks = await prisma.task.findMany({
      where: {
        isOverdue: true,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
      include: {
        project: {
          include: {
            manager: true,
          },
        },
        assignee: true,
      },
    });

    console.log(`[Nova Automation] Found ${overdueTasks.length} overdue tasks`);

    for (const task of overdueTasks) {
      // Check if we already escalated this task in the last 3 days
      const recentEscalation = await prisma.automationAction.findFirst({
        where: {
          type: "AUTO_ESCALATE",
          taskId: task.id,
          success: true,
          createdAt: {
            gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          },
        },
      });

      if (recentEscalation) continue;

      // Only escalate if enabled for the project manager
      const managerPrefs = await prisma.userAIPreference.findUnique({
        where: { userId: task.project.managerId },
      });

      if (managerPrefs && !managerPrefs.enableAutoEscalation) continue;

      // Escalate: Increase priority if not already urgent
      let priorityUpdated = false;
      if (task.priority !== "URGENT") {
        const newPriority =
          task.priority === "HIGH"
            ? "URGENT"
            : task.priority === "MEDIUM"
              ? "HIGH"
              : "MEDIUM";

        await prisma.task.update({
          where: { id: task.id },
          data: {
            priority: newPriority,
          },
        });
        priorityUpdated = true;
      }

      // Notify the manager
      await prisma.notification.create({
        data: {
          userId: task.project.managerId,
          taskId: task.id,
          projectId: task.projectId,
          type: "RISK_ALERT",
          title: `🚨 Overdue Task: ${task.title}`,
          message: `This task is overdue${task.assigneeId ? ` (assigned to ${task.assignee?.name})` : " and unassigned"}. ${priorityUpdated ? "Priority increased." : ""}`,
        },
      });

      // Log the action
      await prisma.automationAction.create({
        data: {
          type: "AUTO_ESCALATE",
          taskId: task.id,
          userId: task.project.managerId,
          description: `Escalated overdue task "${task.title}" to manager: ${task.project.manager.name}`,
          success: true,
          metadata: {
            previousPriority: task.priority,
            priorityUpdated,
            daysOverdue: Math.ceil(
              (new Date() - new Date(task.dueDate)) / (1000 * 60 * 60 * 24),
            ),
          },
        },
      });

      console.log(
        `[Nova Automation] Escalated task "${task.title}" to ${task.project.manager.name}`,
      );
    }
  } catch (error) {
    console.error("[Nova Automation] Error in auto-escalation:", error);

    await prisma.automationAction.create({
      data: {
        type: "AUTO_ESCALATE",
        description: "Auto-escalation batch failed",
        success: false,
        errorMessage: error.message,
      },
    });
  }
};


/**
 * Run all automation actions
 * Called periodically by the scheduler
 */
export const runAutomationActions = async () => {
  console.log("[Nova Automation] 🤖 Running automation batch...");

  try {
    await escalateOverdueTasks();

    console.log("[Nova Automation] ✅ Automation batch complete");
  } catch (error) {
    console.error("[Nova Automation] ❌ Automation batch error:", error);
  }
};
