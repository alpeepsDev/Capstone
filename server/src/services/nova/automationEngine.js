import prisma from "../../config/database.js";

/**
 * Nova Automation Engine
 * Performs intelligent automated actions to reduce manual work
 */

/**
 * Auto-assign unassigned tasks to team members based on workload
 * Balances work across team members
 */
export const autoAssignTasks = async () => {
  console.log("[Nova Automation] Running auto-assignment...");

  try {
    // Get all users who have auto-assignment enabled
    const usersWithAutoAssign = await prisma.user.findMany({
      where: {
        isActive: true,
        aiPreference: {
          enableAutoAssignment: true,
        },
      },
      include: {
        aiPreference: true,
        projectMemberships: {
          include: {
            project: true,
          },
        },
      },
    });

    if (usersWithAutoAssign.length === 0) {
      console.log("[Nova Automation] No users have auto-assignment enabled");
      return;
    }

    // Get all unassigned tasks from projects these users are in
    const projectIds = usersWithAutoAssign.flatMap((u) =>
      u.projectMemberships.map((m) => m.projectId),
    );

    const unassignedTasks = await prisma.task.findMany({
      where: {
        assigneeId: null,
        projectId: { in: projectIds },
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
      include: {
        project: true,
      },
    });

    console.log(
      `[Nova Automation] Found ${unassignedTasks.length} unassigned tasks`,
    );

    for (const task of unassignedTasks) {
      // Find team members in this project
      const projectMembers = await prisma.projectMember.findMany({
        where: {
          projectId: task.projectId,
        },
        include: {
          user: {
            include: {
              aiPreference: true,
              assignedTasks: {
                where: {
                  status: { notIn: ["COMPLETED", "CANCELLED"] },
                },
              },
            },
          },
        },
      });

      // Filter to users with auto-assignment enabled
      const eligibleMembers = projectMembers.filter(
        (m) => m.user.isActive && m.user.aiPreference?.enableAutoAssignment,
      );

      if (eligibleMembers.length === 0) continue;

      // Find the member with the least workload
      const memberWorkloads = eligibleMembers.map((member) => ({
        userId: member.userId,
        user: member.user,
        workload: member.user.assignedTasks.length,
      }));

      memberWorkloads.sort((a, b) => a.workload - b.workload);
      const selectedMember = memberWorkloads[0];

      // Assign the task
      await prisma.task.update({
        where: { id: task.id },
        data: {
          assigneeId: selectedMember.userId,
        },
      });

      // Log the automation action
      await prisma.automationAction.create({
        data: {
          type: "AUTO_ASSIGN",
          taskId: task.id,
          userId: selectedMember.userId,
          description: `Auto-assigned "${task.title}" to ${selectedMember.user.name} (workload: ${selectedMember.workload} tasks)`,
          success: true,
          metadata: {
            taskPriority: task.priority,
            memberWorkload: selectedMember.workload,
          },
        },
      });

      // Notify the user
      await prisma.notification.create({
        data: {
          userId: selectedMember.userId,
          taskId: task.id,
          projectId: task.projectId,
          type: "AUTO_ASSIGNMENT",
          title: "Nova auto-assigned you a task",
          message: `"${task.title}" has been assigned to you based on your current workload.`,
        },
      });

      console.log(
        `[Nova Automation] Assigned task "${task.title}" to ${selectedMember.user.name}`,
      );
    }
  } catch (error) {
    console.error("[Nova Automation] Error in auto-assignment:", error);

    await prisma.automationAction.create({
      data: {
        type: "AUTO_ASSIGN",
        description: "Auto-assignment batch failed",
        success: false,
        errorMessage: error.message,
      },
    });
  }
};

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
 * Suggest task splits for large/complex tasks
 * Uses AI to recommend breaking down tasks
 */
export const suggestTaskSplits = async (taskId) => {
  console.log(
    `[Nova Automation] Analyzing task ${taskId} for split suggestions...`,
  );

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: true,
        project: true,
      },
    });

    if (!task) {
      throw new Error("Task not found");
    }

    // Criteria for suggesting a split:
    // 1. Task has been in progress for more than 7 days
    // 2. Task description is long (suggests complexity)
    // 3. High priority but not moving forward

    const daysInProgress =
      task.status === "IN_PROGRESS" && task.startDate
        ? Math.ceil(
            (new Date() - new Date(task.startDate)) / (1000 * 60 * 60 * 24),
          )
        : 0;

    const shouldSuggestSplit =
      daysInProgress > 7 ||
      (task.description && task.description.length > 500) ||
      (task.priority === "HIGH" && task.priorityScore > 80);

    if (shouldSuggestSplit) {
      // Create an insight
      await prisma.novaInsight.create({
        data: {
          userId: task.assigneeId || task.createdById,
          taskId: task.id,
          projectId: task.projectId,
          type: "TASK_SUGGESTION",
          title: "Consider breaking down this task",
          description: `"${task.title}" seems complex. Breaking it into smaller subtasks may help with progress tracking and completion.`,
          confidence: 0.75,
          metadata: {
            daysInProgress,
            descriptionLength: task.description?.length || 0,
            priorityScore: task.priorityScore,
          },
        },
      });

      console.log(
        `[Nova Automation] Created split suggestion for task "${task.title}"`,
      );
      return { suggested: true };
    }

    return { suggested: false };
  } catch (error) {
    console.error("[Nova Automation] Error suggesting task split:", error);
    return { suggested: false, error: error.message };
  }
};

/**
 * Run all automation actions
 * Called periodically by the scheduler
 */
export const runAutomationActions = async () => {
  console.log("[Nova Automation] 🤖 Running automation batch...");

  try {
    await autoAssignTasks();
    await escalateOverdueTasks();

    console.log("[Nova Automation] ✅ Automation batch complete");
  } catch (error) {
    console.error("[Nova Automation] ❌ Automation batch error:", error);
  }
};
