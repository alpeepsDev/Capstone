import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { asyncHandler } from "../utils/asyncHandler.js";
import { createNotification } from "./notification.controller.js";

const prisma = new PrismaClient();

// Get all tasks for a project
export const getProjectTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  // Check if user has access to this project
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [
        { managerId: req.user.id },
        { members: { some: { userId: req.user.id } } },
      ],
    },
  });

  if (!project) {
    return res.status(403).json({
      success: false,
      message: "Access denied to this project",
    });
  }

  const tasks = await prisma.task.findMany({
    where: { projectId },
    include: {
      assignee: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          comments: true,
          exchanges: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { position: "asc" }, { createdAt: "desc" }],
  });

  res.json({
    success: true,
    data: tasks,
  });
});

// Get single task
export const getTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      assignee: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          managerId: true,
        },
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  // Check access permissions
  const hasAccess =
    task.project.managerId === req.user.id ||
    task.assigneeId === req.user.id ||
    task.createdById === req.user.id ||
    req.user.role === "ADMIN" ||
    req.user.role === "MODERATOR";

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: "Access denied to this task",
    });
  }

  res.json({
    success: true,
    data: task,
  });
});

// Create new task
export const createTask = asyncHandler(async (req, res) => {
  const { title, description, projectId, assigneeId, priority, dueDate } =
    req.body;

  // Validate required fields
  if (!title || !projectId) {
    return res.status(400).json({
      success: false,
      message: "Title and project ID are required",
    });
  }

  // Check if user can create tasks in this project (must be manager or admin)
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: "Project not found",
    });
  }

  const canCreateTask =
    project.managerId === req.user.id || req.user.role === "ADMIN";

  if (!canCreateTask) {
    return res.status(403).json({
      success: false,
      message: "Only project managers can create tasks",
    });
  }

  // Get the highest position for new task ordering
  const maxPosition = await prisma.task.aggregate({
    where: { projectId, status: "PENDING" },
    _max: { position: true },
  });

  const task = await prisma.task.create({
    data: {
      title,
      description,
      projectId,
      createdById: req.user.id,
      assigneeId,
      priority: priority || "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : null,
      position: (maxPosition._max.position || 0) + 1,
    },
    include: {
      assignee: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: "Task created successfully",
    data: task,
  });
});

// Update task
export const updateTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Extract changeNote if provided (for logging/notifications)
  const { changeNote, ...taskUpdates } = updates;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          managerId: true,
        },
      },
    },
  });

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  // Check permissions
  const canEdit =
    task.project.managerId === req.user.id ||
    task.assigneeId === req.user.id ||
    req.user.role === "ADMIN";

  if (!canEdit) {
    return res.status(403).json({
      success: false,
      message: "Permission denied to edit this task",
    });
  }

  // Log change note if provided (for future audit trail)
  if (changeNote) {
    console.log(
      `📝 Change requested for task ${id} by ${req.user.username}: ${changeNote}`
    );
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      ...taskUpdates,
      dueDate: taskUpdates.dueDate ? new Date(taskUpdates.dueDate) : undefined,
      updatedAt: new Date(),
    },
    include: {
      assignee: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          managerId: true,
        },
      },
    },
  });

  // Get Socket.IO instance for real-time notifications
  const io = req.app.get("io");

  // Create notification for task assignee if changes were requested
  if (
    changeNote &&
    updatedTask.assigneeId &&
    updatedTask.assigneeId !== req.user.id
  ) {
    await createNotification({
      userId: updatedTask.assigneeId,
      type: "TASK_CHANGES_REQUESTED",
      title: "Changes Requested",
      message: `Changes requested for task "${updatedTask.title}": ${changeNote}`,
      taskId: updatedTask.id,
      projectId: updatedTask.projectId,
      io, // Pass Socket.IO instance for real-time emission
    });
  }

  // Create notification for general task updates (if not change request)
  if (
    !changeNote &&
    updatedTask.assigneeId &&
    updatedTask.assigneeId !== req.user.id
  ) {
    await createNotification({
      userId: updatedTask.assigneeId,
      type: "TASK_UPDATED",
      title: "Task Updated",
      message: `Task "${updatedTask.title}" has been updated`,
      taskId: updatedTask.id,
      projectId: updatedTask.projectId,
      io, // Pass Socket.IO instance for real-time emission
    });
  }

  res.json({
    success: true,
    message: "Task updated successfully",
    data: updatedTask,
  });
});

// Move task (for Kanban board)
export const moveTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, position } = req.body;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          managerId: true,
        },
      },
    },
  });

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  // Check move permissions based on role and task ownership
  const canMove = () => {
    // If the task is currently COMPLETED, only managers can move it back
    if (task.status === "COMPLETED") {
      return (
        task.project.managerId === req.user.id || req.user.role === "ADMIN"
      );
    }

    // All other tasks can be moved freely by anyone with project access
    return true;
  };

  if (!canMove()) {
    return res.status(403).json({
      success: false,
      message: "Permission denied to move this task",
    });
  }

  // Update task status and position
  const updateData = { status };
  if (position !== undefined && position !== null) {
    updateData.position = position;
  }

  // Mark as completed if moving to COMPLETED
  if (status === "COMPLETED") {
    updateData.completedAt = new Date();
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      assignee: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  res.json({
    success: true,
    message: "Task moved successfully",
    data: updatedTask,
  });
});

// Assign task to user
export const assignTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { assigneeId } = req.body;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          managerId: true,
        },
      },
    },
  });

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  // Only managers and admins can assign tasks
  const canAssign =
    task.project.managerId === req.user.id || req.user.role === "ADMIN";

  if (!canAssign) {
    return res.status(403).json({
      success: false,
      message: "Only project managers can assign tasks",
    });
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: { assigneeId },
    include: {
      assignee: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
        },
      },
      createdBy: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  res.json({
    success: true,
    message: "Task assigned successfully",
    data: updatedTask,
  });
});

// Delete task
export const deleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          managerId: true,
        },
      },
    },
  });

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  // Only managers and admins can delete tasks
  const canDelete =
    task.project.managerId === req.user.id || req.user.role === "ADMIN";

  if (!canDelete) {
    return res.status(403).json({
      success: false,
      message: "Only project managers can delete tasks",
    });
  }

  await prisma.task.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: "Task deleted successfully",
  });
});

// Get task comments
export const getTaskComments = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const comments = await prisma.taskComment.findMany({
    where: { taskId: id },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({
    success: true,
    data: comments,
  });
});

// Add task comment
export const addTaskComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({
      success: false,
      message: "Comment content is required",
    });
  }

  const comment = await prisma.taskComment.create({
    data: {
      content: content.trim(),
      taskId: id,
      authorId: req.user.id,
    },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: "Comment added successfully",
    data: comment,
  });
});

// Get tasks awaiting approval (status = DONE) for manager
export const getTasksAwaitingApproval = asyncHandler(async (req, res) => {
  // Get all projects managed by this user
  const projects = await prisma.project.findMany({
    where: { managerId: req.user.id },
    select: { id: true },
  });

  const projectIds = projects.map((p) => p.id);

  if (projectIds.length === 0) {
    return res.status(200).json({
      success: true,
      data: [],
    });
  }

  const tasks = await prisma.task.findMany({
    where: {
      projectId: { in: projectIds },
      status: "DONE",
    },
    include: {
      assignee: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  res.status(200).json({
    success: true,
    data: tasks,
  });
});

// Approve a task (move from DONE to COMPLETED)
export const approveTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await prisma.task.findUnique({
    where: { id },
    include: {
      project: true,
      assignee: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!task) {
    return res.status(404).json({
      success: false,
      message: "Task not found",
    });
  }

  // Check if user is the project manager
  if (task.project.managerId !== req.user.id && req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Only the project manager can approve tasks",
    });
  }

  // Check if task is in DONE status
  if (task.status !== "DONE") {
    return res.status(400).json({
      success: false,
      message: "Task must be in DONE status to be approved",
    });
  }

  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
    },
    include: {
      assignee: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  res.status(200).json({
    success: true,
    message: "Task approved successfully",
    data: updatedTask,
  });
});

// Get manager dashboard stats
export const getManagerStats = asyncHandler(async (req, res) => {
  // Get all projects managed by this user
  const projects = await prisma.project.findMany({
    where: { managerId: req.user.id },
    include: {
      _count: {
        select: {
          tasks: true,
          members: true,
        },
      },
    },
  });

  const projectIds = projects.map((p) => p.id);

  if (projectIds.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        projectCount: 0,
        totalTasks: 0,
        tasksAwaitingApproval: 0,
        overdueTasks: 0,
        totalTeamMembers: 0,
      },
    });
  }

  // Get task statistics
  const [totalTasks, tasksAwaitingApproval, overdueTasks] = await Promise.all([
    prisma.task.count({
      where: { projectId: { in: projectIds } },
    }),
    prisma.task.count({
      where: {
        projectId: { in: projectIds },
        status: "DONE",
      },
    }),
    prisma.task.count({
      where: {
        projectId: { in: projectIds },
        dueDate: { lt: new Date() },
        status: { not: "COMPLETED" },
      },
    }),
  ]);

  const totalTeamMembers = projects.reduce(
    (sum, project) => sum + project._count.members,
    0
  );

  res.status(200).json({
    success: true,
    data: {
      projectCount: projects.length,
      totalTasks,
      tasksAwaitingApproval,
      overdueTasks,
      totalTeamMembers,
    },
  });
});

// Get all tasks across all managed projects
export const getManagerTasks = asyncHandler(async (req, res) => {
  // Get all projects managed by this user
  const projects = await prisma.project.findMany({
    where: { managerId: req.user.id },
    select: { id: true },
  });

  const projectIds = projects.map((p) => p.id);

  if (projectIds.length === 0) {
    return res.status(200).json({
      success: true,
      data: [],
    });
  }

  const tasks = await prisma.task.findMany({
    where: { projectId: { in: projectIds } },
    include: {
      assignee: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({
    success: true,
    data: tasks,
  });
});
