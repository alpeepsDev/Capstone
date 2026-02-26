import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Get savedfilters (user's own + public filters)
export const getSavedFilters = async (req, res) => {
  try {
    const { projectId } = req.query;

    const where = {
      OR: [{ userId: req.user.id }, { isPublic: true }],
    };

    if (projectId) {
      where.OR = where.OR.map((condition) => ({ ...condition, projectId }));
    }

    const filters = await prisma.savedFilter.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, username: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    res.json(filters);
  } catch (error) {
    console.error("Error fetching saved filters:", error);
    res.status(500).json({ error: "Failed to fetch saved filters" });
  }
};

// Create saved filter
export const createSavedFilter = async (req, res) => {
  try {
    const { name, criteria, projectId, isPublic = false } = req.body;

    if (!name || !criteria) {
      return res.status(400).json({ error: "Name and criteria are required" });
    }

    // Only managers can create public filters
    if (isPublic) {
      if (projectId) {
        const project = await prisma.project.findUnique({
          where: { id: projectId },
        });

        if (
          project.managerId !== req.user.id &&
          req.user.role !== "ADMIN"
        ) {
          return res
            .status(403)
            .json({ error: "Only project managers can create public filters" });
        }
      } else if (req.user.role !== "ADMIN") {
        return res
          .status(403)
          .json({ error: "Only admins can create global public filters" });
      }
    }

    const savedFilter = await prisma.savedFilter.create({
      data: {
        name,
        criteria,
        projectId,
        isPublic,
        userId: req.user.id,
      },
    });

    res.status(201).json(savedFilter);
  } catch (error) {
    console.error("Error creating saved filter:", error);
    res.status(500).json({ error: "Failed to create saved filter" });
  }
};

// Update saved filter
export const updateSavedFilter = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, criteria, isPublic } = req.body;

    const existingFilter = await prisma.savedFilter.findUnique({
      where: { id },
      include: { project: true },
    });

    if (!existingFilter) {
      return res.status(404).json({ error: "Filter not found" });
    }

    // Only the owner can update their filter
    if (
      existingFilter.userId !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return res
        .status(403)
        .json({ error: "You can only update your own filters" });
    }

    // Check permissions for making filter public
    if (isPublic && !existingFilter.isPublic) {
      if (existingFilter.projectId) {
        const project = await prisma.project.findUnique({
          where: { id: existingFilter.projectId },
        });

        if (
          project.managerId !== req.user.id &&
          req.user.role !== "ADMIN"
        ) {
          return res
            .status(403)
            .json({ error: "Only project managers can make filters public" });
        }
      } else if (req.user.role !== "ADMIN") {
        return res
          .status(403)
          .json({ error: "Only admins can make global filters public" });
      }
    }

    const updated = await prisma.savedFilter.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(criteria && { criteria }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating saved filter:", error);
    res.status(500).json({ error: "Failed to update saved filter" });
  }
};

// Delete saved filter
export const deleteSavedFilter = async (req, res) => {
  try {
    const { id } = req.params;

    const existingFilter = await prisma.savedFilter.findUnique({
      where: { id },
    });

    if (!existingFilter) {
      return res.status(404).json({ error: "Filter not found" });
    }

    // Only the owner can delete their filter
    if (
      existingFilter.userId !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return res
        .status(403)
        .json({ error: "You can only delete your own filters" });
    }

    await prisma.savedFilter.delete({
      where: { id },
    });

    res.json({ message: "Filter deleted successfully" });
  } catch (error) {
    console.error("Error deleting saved filter:", error);
    res.status(500).json({ error: "Failed to delete saved filter" });
  }
};

// Apply saved filter
export const applySavedFilter = async (req, res) => {
  try {
    const { id } = req.params;

    const filter = await prisma.savedFilter.findUnique({
      where: { id },
    });

    if (!filter) {
      return res.status(404).json({ error: "Filter not found" });
    }

    // Check if user has access to this filter
    if (filter.userId !== req.user.id && !filter.isPublic) {
      return res.status(403).json({ error: "Access denied to this filter" });
    }

    // Build the Prisma query from criteria
    const where = buildWhereClause(filter.criteria);

    // Also filter by user access
    const tasks = await prisma.task.findMany({
      where: {
        ...where,
        OR: [
          { assigneeId: req.user.id },
          { project: { managerId: req.user.id } },
          { createdById: req.user.id },
        ],
      },
      include: {
        assignee: {
          select: { id: true, name: true, username: true },
        },
        project: {
          select: { id: true, name: true },
        },
        labels: {
          include: { label: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    res.json({ filter, tasks });
  } catch (error) {
    console.error("Error applying saved filter:", error);
    res.status(500).json({ error: "Failed to apply saved filter" });
  }
};

// Helper function to build Prisma where clause from filter criteria
function buildWhereClause(criteria) {
  const where = {};

  if (criteria.status && criteria.status.length > 0) {
    where.status = { in: criteria.status };
  }

  if (criteria.priority && criteria.priority.length > 0) {
    where.priority = { in: criteria.priority };
  }

  if (criteria.taskType && criteria.taskType.length > 0) {
    where.taskType = { in: criteria.taskType };
  }

  if (criteria.assigneeId && criteria.assigneeId.length > 0) {
    where.assigneeId = { in: criteria.assigneeId };
  }

  if (criteria.projectId) {
    where.projectId = criteria.projectId;
  }

  if (criteria.labelIds && criteria.labelIds.length > 0) {
    where.labels = {
      some: {
        labelId: { in: criteria.labelIds },
      },
    };
  }

  if (criteria.dueDateFrom || criteria.dueDateTo) {
    where.dueDate = {};
    if (criteria.dueDateFrom) {
      where.dueDate.gte = new Date(criteria.dueDateFrom);
    }
    if (criteria.dueDateTo) {
      where.dueDate.lte = new Date(criteria.dueDateTo);
    }
  }

  if (criteria.isOverdue !== undefined) {
    where.isOverdue = criteria.isOverdue;
  }

  if (criteria.searchText) {
    where.OR = [
      { title: { contains: criteria.searchText, mode: "insensitive" } },
      { description: { contains: criteria.searchText, mode: "insensitive" } },
    ];
  }

  return where;
}
