import prisma from "../config/database.js";
import * as rules from "./rules.js";

/**
 * Runs the Nova Automation Engine.
 * Analyzes all active tasks and updates their intelligence fields.
 */
export const runAutomation = async () => {
  console.log("[Nova] 🚀 Starting automation analysis...");
  const startTime = Date.now();
  let updatedCount = 0;

  try {
    // 1. Fetch all active tasks
    // limiting to 1000 for safety, could be paginated in production
    const tasks = await prisma.task.findMany({
      where: {
        status: {
          notIn: ["COMPLETED", "CANCELLED", "IN_REVIEW"],
        },
      },
      take: 1000,
    });

    console.log(`[Nova] 🔍 Analyzing ${tasks.length} active tasks...`);

    // 2. Analyze each task and prepare updates
    const updates = [];

    for (const task of tasks) {
      // Apply Rules
      const isOverdue = rules.calculateIsOverdue(task.dueDate, task.status);
      const riskLevel = rules.calculateRiskLevel(
        isOverdue,
        task.updatedAt, // Using updatedAt as proxy for lastActivity
        task.priority,
      );
      const priorityScore = rules.calculatePriorityScore(
        task.priority,
        isOverdue,
        riskLevel,
      );

      // Check if update is needed (optimization)
      if (
        task.isOverdue !== isOverdue ||
        task.riskLevel !== riskLevel ||
        task.priorityScore !== priorityScore
      ) {
        updates.push(
          prisma.task.update({
            where: { id: task.id },
            data: {
              isOverdue,
              riskLevel,
              priorityScore,
              // We don't update updatedAt here to avoid infinite loops of "activity"
              // But we could update a separate 'lastAnalyzedAt' if we added it
            },
          }),
        );
      }
    }

    // 3. Execute Batch Updates
    if (updates.length > 0) {
      // Prisma transaction for atomicity
      // processing in chunks if necessary, but transaction is good for now
      await prisma.$transaction(updates);
      updatedCount = updates.length;
      console.log(`[Nova] ✅ Updated ${updatedCount} tasks with new insights.`);
    } else {
      console.log("[Nova] ✨ No changes detected.");
    }
  } catch (error) {
    console.error("[Nova] ❌ Automation Error:", error);
  } finally {
    const duration = Date.now() - startTime;
    console.log(`[Nova] 🏁 Finished in ${duration}ms.`);
  }
};

// No export needed as we used named export above
