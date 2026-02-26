import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Get all templates (optionally filtered by project)
export const getTemplates = async (req, res) => {
  try {
    const { projectId } = req.query;

    const where = {};

    if (projectId) {
      where.OR = [{ projectId }, { isDefault: true }];
    } else {
      where.isDefault = true;
    }

    const templates = await prisma.taskTemplate.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, username: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });

    res.json(templates);
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({ error: "Failed to fetch templates" });
  }
};

// Create template
export const createTemplate = async (req, res) => {
  try {
    const {
      name,
      description,
      taskType,
      projectId,
      priority,
      template,
      isDefault = false,
    } = req.body;

    if (!name || !taskType) {
      return res.status(400).json({ error: "Name and taskType are required" });
    }

    // Only managers can create templates, only admins can create default templates
    if (isDefault && req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Only admins can create default templates" });
    }

    if (projectId) {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }

      if (project.managerId !== req.user.id && req.user.role !== "ADMIN") {
        return res
          .status(403)
          .json({
            error: "Only project managers can create project templates",
          });
      }
    } else if (!isDefault) {
      return res
        .status(400)
        .json({ error: "projectId is required for non-default templates" });
    }

    const taskTemplate = await prisma.taskTemplate.create({
      data: {
        name,
        description,
        taskType,
        projectId: isDefault ? null : projectId,
        priority: priority || "MEDIUM",
        template: template || {},
        isDefault,
        createdById: req.user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    res.status(201).json(taskTemplate);
  } catch (error) {
    console.error("Error creating template:", error);
    res.status(500).json({ error: "Failed to create template" });
  }
};

// Update template
export const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, taskType, priority, template } = req.body;

    const existingTemplate = await prisma.taskTemplate.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Check permissions
    if (existingTemplate.isDefault && req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Only admins can update default templates" });
    }

    if (existingTemplate.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: existingTemplate.projectId },
      });

      if (project.managerId !== req.user.id && req.user.role !== "ADMIN") {
        return res
          .status(403)
          .json({
            error: "Only project managers can update project templates",
          });
      }
    }

    const updated = await prisma.taskTemplate.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(taskType && { taskType }),
        ...(priority && { priority }),
        ...(template && { template }),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating template:", error);
    res.status(500).json({ error: "Failed to update template" });
  }
};

// Delete template
export const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;

    const existingTemplate = await prisma.taskTemplate.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Check permissions
    if (existingTemplate.isDefault && req.user.role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Only admins can delete default templates" });
    }

    if (existingTemplate.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: existingTemplate.projectId },
      });

      if (project.managerId !== req.user.id && req.user.role !== "ADMIN") {
        return res
          .status(403)
          .json({
            error: "Only project managers can delete project templates",
          });
      }
    }

    await prisma.taskTemplate.delete({
      where: { id },
    });

    res.json({ message: "Template deleted successfully" });
  } catch (error) {
    console.error("Error deleting template:", error);
    res.status(500).json({ error: "Failed to delete template" });
  }
};

// Create task from template
export const createTaskFromTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const overrides = req.body;

    const template = await prisma.taskTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Merge template data with overrides
    const taskData = {
      ...template.template,
      taskType: template.taskType,
      priority: template.priority,
      ...overrides,
      createdById: req.user.id,
    };

    // Ensure required fields are present
    if (!taskData.title || !taskData.projectId) {
      return res
        .status(400)
        .json({ error: "title and projectId are required" });
    }

    const task = await prisma.task.create({
      data: taskData,
      include: {
        assignee: true,
        project: true,
        labels: {
          include: { label: true },
        },
      },
    });

    res.status(201).json(task);
  } catch (error) {
    console.error("Error creating task from template:", error);
    res.status(500).json({ error: "Failed to create task from template" });
  }
};
