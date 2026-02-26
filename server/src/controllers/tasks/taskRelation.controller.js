import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Create task relationship
export const createTaskRelation = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { targetTaskId, relationType } = req.body;

    if (!targetTaskId || !relationType) {
      return res
        .status(400)
        .json({ error: "targetTaskId and relationType are required" });
    }

    // Check if source task exists
    const sourceTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!sourceTask) {
      return res.status(404).json({ error: "Source task not found" });
    }

    // Check if target task exists
    const targetTask = await prisma.task.findUnique({
      where: { id: targetTaskId },
      include: { project: true },
    });

    if (!targetTask) {
      return res.status(404).json({ error: "Target task not found" });
    }

    // Check if user has permission (is assigned, manager, or admin)
    if (
      sourceTask.assigneeId !== req.user.id &&
      sourceTask.project.managerId !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Prevent self-relationship
    if (taskId === targetTaskId) {
      return res
        .status(400)
        .json({ error: "Cannot create relationship with self" });
    }

    // Check for circular dependencies (only for BLOCKS/BLOCKED_BY)
    if (relationType === "BLOCKS" || relationType === "BLOCKED_BY") {
      const circularCheck = await checkCircularDependency(
        taskId,
        targetTaskId,
        relationType,
      );
      if (circularCheck) {
        return res
          .status(400)
          .json({ error: "This would create a circular dependency" });
      }
    }

    const relation = await prisma.taskRelation.create({
      data: {
        sourceTaskId: taskId,
        targetTaskId,
        relationType,
        createdById: req.user.id,
      },
      include: {
        sourceTask: {
          select: { id: true, title: true, status: true },
        },
        targetTask: {
          select: { id: true, title: true, status: true },
        },
      },
    });

    res.status(201).json(relation);
  } catch (error) {
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "This relationship already exists" });
    }
    console.error("Error creating task relation:", error);
    res.status(500).json({ error: "Failed to create task relation" });
  }
};

// Helper function to check circular dependencies
async function checkCircularDependency(sourceId, targetId, relationType) {
  // Build a graph of dependencies
  const visited = new Set();
  const queue = [targetId];

  while (queue.length > 0) {
    const currentId = queue.shift();

    if (currentId === sourceId) {
      return true; // Circular dependency found
    }

    if (visited.has(currentId)) {
      continue;
    }

    visited.add(currentId);

    // Get all tasks that current task blocks
    const relations = await prisma.taskRelation.findMany({
      where: {
        sourceTaskId: currentId,
        relationType: relationType === "BLOCKS" ? "BLOCKS" : "BLOCKED_BY",
      },
    });

    for (const rel of relations) {
      queue.push(rel.targetTaskId);
    }
  }

  return false;
}

// Get task relationships
export const getTaskRelations = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { type } = req.query;

    const where = {
      OR: [{ sourceTaskId: taskId }, { targetTaskId: taskId }],
    };

    if (type) {
      where.relationType = type;
    }

    const relations = await prisma.taskRelation.findMany({
      where,
      include: {
        sourceTask: {
          select: { id: true, title: true, status: true, taskType: true },
        },
        targetTask: {
          select: { id: true, title: true, status: true, taskType: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format relations to show direction
    const formattedRelations = relations.map((rel) => ({
      ...rel,
      direction: rel.sourceTaskId === taskId ? "outgoing" : "incoming",
      relatedTask:
        rel.sourceTaskId === taskId ? rel.targetTask : rel.sourceTask,
    }));

    res.json(formattedRelations);
  } catch (error) {
    console.error("Error fetching task relations:", error);
    res.status(500).json({ error: "Failed to fetch task relations" });
  }
};

// Delete task relationship
export const deleteTaskRelation = async (req, res) => {
  try {
    const { taskId, relationId } = req.params;

    const relation = await prisma.taskRelation.findUnique({
      where: { id: relationId },
      include: {
        sourceTask: {
          include: { project: true },
        },
      },
    });

    if (!relation) {
      return res.status(404).json({ error: "Relation not found" });
    }

    // Check if relation involves the specified task
    if (relation.sourceTaskId !== taskId && relation.targetTaskId !== taskId) {
      return res
        .status(400)
        .json({ error: "Relation does not involve this task" });
    }

    // Check permissions
    if (
      relation.sourceTask.assigneeId !== req.user.id &&
      relation.sourceTask.project.managerId !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    await prisma.taskRelation.delete({
      where: { id: relationId },
    });

    res.json({ message: "Relation deleted successfully" });
  } catch (error) {
    console.error("Error deleting task relation:", error);
    res.status(500).json({ error: "Failed to delete task relation" });
  }
};

// Get subtasks
export const getSubtasks = async (req, res) => {
  try {
    const { taskId } = req.params;

    const subtasks = await prisma.task.findMany({
      where: { parentTaskId: taskId },
      include: {
        assignee: {
          select: { id: true, name: true, username: true },
        },
        labels: {
          include: { label: true },
        },
      },
      orderBy: { position: "asc" },
    });

    res.json(subtasks);
  } catch (error) {
    console.error("Error fetching subtasks:", error);
    res.status(500).json({ error: "Failed to fetch subtasks" });
  }
};

// Get blocking/blocked tasks
export const getTaskDependencies = async (req, res) => {
  try {
    const { taskId } = req.params;

    const [blocking, blockedBy] = await Promise.all([
      // Tasks that this task blocks
      prisma.taskRelation.findMany({
        where: {
          sourceTaskId: taskId,
          relationType: "BLOCKS",
        },
        include: {
          targetTask: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              dueDate: true,
            },
          },
        },
      }),
      // Tasks that block this task
      prisma.taskRelation.findMany({
        where: {
          targetTaskId: taskId,
          relationType: "BLOCKS",
        },
        include: {
          sourceTask: {
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              dueDate: true,
            },
          },
        },
      }),
    ]);

    res.json({
      blocking: blocking.map((r) => r.targetTask),
      blockedBy: blockedBy.map((r) => r.sourceTask),
    });
  } catch (error) {
    console.error("Error fetching task dependencies:", error);
    res.status(500).json({ error: "Failed to fetch task dependencies" });
  }
};
