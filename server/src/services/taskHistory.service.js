import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * Track a change to a task field in the task history
 * @param {string} taskId - The ID of the task being modified
 * @param {string} userId - The ID of the user making the change
 * @param {string} field - The name of the field being changed
 * @param {any} oldValue - The old value of the field
 * @param {any} newValue - The new value of the field
 */
export const trackTaskChange = async (
  taskId,
  userId,
  field,
  oldValue,
  newValue,
) => {
  try {
    // Don't track if values are the same
    if (oldValue === newValue) {
      return;
    }

    // Convert values to strings for storage
    const oldValueStr =
      oldValue !== null && oldValue !== undefined ? String(oldValue) : null;
    const newValueStr =
      newValue !== null && newValue !== undefined ? String(newValue) : null;

    await prisma.taskHistory.create({
      data: {
        taskId,
        userId,
        field,
        oldValue: oldValueStr,
        newValue: newValueStr,
      },
    });
  } catch (error) {
    console.error("Error tracking task change:", error);
    // Don't throw error - history tracking failure shouldn't break the main operation
  }
};

/**
 * Track multiple changes to a task at once
 * @param {string} taskId - The ID of the task being modified
 * @param {string} userId - The ID of the user making the change
 * @param {Object} oldTask - The task object before changes
 * @param {Object} newTask - The task object after changes
 * @param {string[]} fieldsToTrack - Array of field names to track
 */
export const trackTaskChanges = async (
  taskId,
  userId,
  oldTask,
  newTask,
  fieldsToTrack,
) => {
  try {
    const changes = [];

    for (const field of fieldsToTrack) {
      const oldValue = oldTask[field];
      const newValue = newTask[field];

      // Only track if values are different
      if (oldValue !== newValue) {
        const oldValueStr =
          oldValue !== null && oldValue !== undefined ? String(oldValue) : null;
        const newValueStr =
          newValue !== null && newValue !== undefined ? String(newValue) : null;

        changes.push({
          taskId,
          userId,
          field,
          oldValue: oldValueStr,
          newValue: newValueStr,
        });
      }
    }

    if (changes.length > 0) {
      await prisma.taskHistory.createMany({
        data: changes,
      });
    }
  } catch (error) {
    console.error("Error tracking task changes:", error);
    // Don't throw error - history tracking failure shouldn't break the main operation
  }
};

/**
 * Get task history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getTaskHistory = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Check if task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check if user has access to this task
    if (
      task.assigneeId !== req.user.userId &&
      task.createdById !== req.user.userId &&
      task.project.managerId !== req.user.userId &&
      req.user.role !== "ADMIN"
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    const history = await prisma.taskHistory.findMany({
      where: { taskId },
      include: {
        user: {
          select: { id: true, name: true, username: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    const total = await prisma.taskHistory.count({
      where: { taskId },
    });

    res.json({
      history,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < total,
      },
    });
  } catch (error) {
    console.error("Error fetching task history:", error);
    res.status(500).json({ error: "Failed to fetch task history" });
  }
};
