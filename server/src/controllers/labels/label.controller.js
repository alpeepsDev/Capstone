import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Get all labels (with optional project filter)
export const getLabels = async (req, res) => {
  try {
    const { projectId, includeGlobal = "true" } = req.query;

    const where = {};

    if (projectId && includeGlobal === "true") {
      where.OR = [{ projectId }, { isGlobal: true }];
    } else if (projectId) {
      where.projectId = projectId;
    } else if (includeGlobal === "true") {
      where.isGlobal = true;
    }

    const labels = await prisma.label.findMany({
      where,
      include: {
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { name: "asc" },
    });

    res.json(labels);
  } catch (error) {
    console.error("Error fetching labels:", error);
    res.status(500).json({ error: "Failed to fetch labels" });
  }
};

// Create a new label
export const createLabel = async (req, res) => {
  try {
    const { name, color, description, projectId, isGlobal = false } = req.body;

    // Validation
    if (!name || !color) {
      return res.status(400).json({ error: "Name and color are required" });
    }

    // Only admins or managers can create global labels
    if (isGlobal && !["ADMIN", "MANAGER"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Only admins and managers can create global labels" });
    }

    // Check if user is manager of the project (for project-specific labels)
    if (projectId && !isGlobal) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      if (project.managerId !== req.user.id && req.user.role !== "ADMIN") {
        return res
          .status(403)
          .json({ error: "Only project managers can create project labels" });
      }
    }

    const label = await prisma.label.create({
      data: {
        name,
        color,
        description,
        projectId: isGlobal ? null : projectId,
        isGlobal,
      },
    });

    res.status(201).json(label);
  } catch (error) {
    console.error("Error creating label:", error);
    res.status(500).json({ error: "Failed to create label" });
  }
};

// Update a label
export const updateLabel = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, description } = req.body;

    // Check if label exists and user has permission
    const existingLabel = await prisma.label.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existingLabel) {
      return res.status(404).json({ error: "Label not found" });
    }

    // Check permissions
    if (existingLabel.isGlobal && req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Only admins can update global labels" });
    }

    if (existingLabel.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: existingLabel.projectId },
      });

      if (project.managerId !== req.user.id && req.user.role !== "ADMIN") {
        return res
          .status(403)
          .json({ error: "Only project managers can update project labels" });
      }
    }

    const label = await prisma.label.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(color && { color }),
        ...(description !== undefined && { description }),
      },
    });

    res.json(label);
  } catch (error) {
    console.error("Error updating label:", error);
    res.status(500).json({ error: "Failed to update label" });
  }
};

// Delete a label
export const deleteLabel = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if label exists and user has permission
    const existingLabel = await prisma.label.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existingLabel) {
      return res.status(404).json({ error: "Label not found" });
    }

    // Check permissions
    if (existingLabel.isGlobal && req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Only admins can delete global labels" });
    }

    if (existingLabel.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: existingLabel.projectId },
      });

      if (project.managerId !== req.user.id && req.user.role !== "ADMIN") {
        return res
          .status(403)
          .json({ error: "Only project managers can delete project labels" });
      }
    }

    await prisma.label.delete({
      where: { id },
    });

    res.json({ message: "Label deleted successfully" });
  } catch (error) {
    console.error("Error deleting label:", error);
    res.status(500).json({ error: "Failed to delete label" });
  }
};

// Add label to task
export const addLabelToTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { labelId } = req.body;

    if (!labelId) {
      return res.status(400).json({ error: "labelId is required" });
    }

    // Check if task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check if user is assigned or is manager/admin
    if (
      task.assigneeId !== req.user.id &&
      task.project.managerId !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Check if label exists
    const label = await prisma.label.findUnique({
      where: { id: labelId },
    });

    if (!label) {
      return res.status(404).json({ error: "Label not found" });
    }

    // Check if label is accessible for this task
    if (!label.isGlobal && label.projectId !== task.projectId) {
      return res
        .status(403)
        .json({ error: "This label is not accessible for this task" });
    }

    // Create the association
    const taskLabel = await prisma.taskLabel.create({
      data: {
        taskId,
        labelId,
      },
      include: {
        label: true,
      },
    });

    res.status(201).json(taskLabel);
  } catch (error) {
    // Handle unique constraint violation
    if (error.code === "P2002") {
      return res
        .status(409)
        .json({ error: "Label already added to this task" });
    }
    console.error("Error adding label to task:", error);
    res.status(500).json({ error: "Failed to add label to task" });
  }
};

// Remove label from task
export const removeLabelFromTask = async (req, res) => {
  try {
    const { taskId, labelId } = req.params;

    // Check if task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Check if user is assigned or is manager/admin
    if (
      task.assigneeId !== req.user.id &&
      task.project.managerId !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    await prisma.taskLabel.delete({
      where: {
        taskId_labelId: {
          taskId,
          labelId,
        },
      },
    });

    res.json({ message: "Label removed from task successfully" });
  } catch (error) {
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ error: "Task label association not found" });
    }
    console.error("Error removing label from task:", error);
    res.status(500).json({ error: "Failed to remove label from task" });
  }
};

// Get task labels
export const getTaskLabels = async (req, res) => {
  try {
    const { taskId } = req.params;

    const labels = await prisma.taskLabel.findMany({
      where: { taskId },
      include: { label: true },
    });

    res.json(labels.map((tl) => tl.label));
  } catch (error) {
    console.error("Error fetching task labels:", error);
    res.status(500).json({ error: "Failed to fetch task labels" });
  }
};
