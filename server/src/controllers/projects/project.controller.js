import prisma from "../../config/database.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { encrypt, decrypt } from "../../utils/encryption.js";

// Get all projects for current user
export const getProjects = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  let projects;

  switch (userRole) {
    case "ADMIN":
    case "MODERATOR":
      // Admins and moderators can see all projects
      projects = await prisma.project.findMany({
        include: {
          manager: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  role: true,
                  _count: {
                    select: {
                      assignedTasks: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              tasks: true,
              members: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      break;

    case "MANAGER":
      // Managers see projects they manage + projects they're members of
      projects = await prisma.project.findMany({
        where: {
          OR: [{ managerId: userId }, { members: { some: { userId } } }],
        },
        include: {
          manager: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  role: true,
                  _count: {
                    select: {
                      assignedTasks: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              tasks: true,
              members: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      break;

    case "USER":
    default:
      // Users only see projects they're members of
      projects = await prisma.project.findMany({
        where: {
          members: {
            some: { userId },
          },
        },
        include: {
          manager: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  name: true,
                  role: true,
                  _count: {
                    select: {
                      assignedTasks: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              tasks: true,
              members: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      break;
      break;
  }

  res.json({
    success: true,
    data: projects,
  });
});

// Get single project
export const getProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      manager: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      },
      tasks: {
        include: {
          assignee: {
            select: {
              id: true,
              username: true,
              name: true,
            },
          },
          createdBy: {
            select: {
              id: true,
              username: true,
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
        orderBy: [
          { status: "asc" },
          { position: "asc" },
          { createdAt: "desc" },
        ],
      },
    },
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: "Project not found",
    });
  }

  // Check access permissions
  const hasAccess =
    project.managerId === userId ||
    project.members.some((member) => member.userId === userId) ||
    req.user.role === "ADMIN" ||
    req.user.role === "MODERATOR";

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: "Access denied to this project",
    });
  }

  res.json({
    success: true,
    data: project,
  });
});

// Create new project
export const createProject = asyncHandler(async (req, res) => {
  const { name, description, startDate, endDate, memberIds = [] } = req.body;

  // Validate required fields
  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Project name is required",
    });
  }

  // Only managers and admins can create projects
  if (req.user.role !== "MANAGER" && req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Only managers can create projects",
    });
  }

  const project = await prisma.project.create({
    data: {
      name: encrypt(name),
      description: description ? encrypt(description) : null,
      managerId: req.user.id,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      members: {
        create: memberIds.map((userId) => ({ userId })),
      },
    },
    include: {
      manager: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              role: true,
              _count: {
                select: {
                  assignedTasks: true,
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          tasks: true,
          members: true,
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: "Project created successfully",
    data: project,
  });
});

// Update project
export const updateProject = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: "Project not found",
    });
  }

  // Only project managers and admins can update projects
  const canUpdate =
    project.managerId === req.user.id || req.user.role === "ADMIN";

  if (!canUpdate) {
    return res.status(403).json({
      success: false,
      message: "Only project managers can update projects",
    });
  }

  const updatedProject = await prisma.project.update({
    where: { id },
    data: {
      ...updates,
      name: updates.name ? encrypt(updates.name) : undefined,
      description: updates.description
        ? encrypt(updates.description)
        : undefined,
      startDate: updates.startDate ? new Date(updates.startDate) : undefined,
      endDate: updates.endDate ? new Date(updates.endDate) : undefined,
      updatedAt: new Date(),
    },
    include: {
      manager: {
        select: {
          id: true,
          username: true,
          name: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              role: true,
            },
          },
        },
      },
      _count: {
        select: {
          tasks: true,
          members: true,
        },
      },
    },
  });

  res.json({
    success: true,
    message: "Project updated successfully",
    data: updatedProject,
  });
});

// Delete project
export const deleteProject = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: "Project not found",
    });
  }

  // Only project managers and admins can delete projects
  const canDelete =
    project.managerId === req.user.id || req.user.role === "ADMIN";

  if (!canDelete) {
    return res.status(403).json({
      success: false,
      message: "Only project managers can delete projects",
    });
  }

  await prisma.project.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: "Project deleted successfully",
  });
});

// Get project members
export const getProjectMembers = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: {
      id: true,
      managerId: true,
      members: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              name: true,
              email: true,
              role: true,
              isActive: true,
            },
          },
        },
      },
    },
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: "Project not found",
    });
  }

  // Check access permissions
  const hasAccess =
    project.managerId === req.user.id ||
    project.members.some((member) => member.userId === req.user.id) ||
    req.user.role === "ADMIN" ||
    req.user.role === "MODERATOR";

  if (!hasAccess) {
    return res.status(403).json({
      success: false,
      message: "Access denied to this project",
    });
  }

  res.json({
    success: true,
    data: project.members,
  });
});

// Add project member
export const addProjectMember = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({
      success: false,
      message: "User ID is required",
    });
  }

  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: "Project not found",
    });
  }

  // Only project managers and admins can add members
  const canAddMember =
    project.managerId === req.user.id || req.user.role === "ADMIN";

  if (!canAddMember) {
    return res.status(403).json({
      success: false,
      message: "Only project managers can add members",
    });
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Check if user is already a member
  const existingMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: id,
        userId,
      },
    },
  });

  if (existingMember) {
    return res.status(400).json({
      success: false,
      message: "User is already a member of this project",
    });
  }

  const member = await prisma.projectMember.create({
    data: {
      projectId: id,
      userId,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  res.status(201).json({
    success: true,
    message: "Member added successfully",
    data: member,
  });
});

// Remove project member
export const removeProjectMember = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;

  const project = await prisma.project.findUnique({
    where: { id },
  });

  if (!project) {
    return res.status(404).json({
      success: false,
      message: "Project not found",
    });
  }

  // Only project managers and admins can remove members
  const canRemoveMember =
    project.managerId === req.user.id || req.user.role === "ADMIN";

  if (!canRemoveMember) {
    return res.status(403).json({
      success: false,
      message: "Only project managers can remove members",
    });
  }

  const member = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: id,
        userId,
      },
    },
  });

  if (!member) {
    return res.status(404).json({
      success: false,
      message: "User is not a member of this project",
    });
  }

  await prisma.projectMember.delete({
    where: {
      projectId_userId: {
        projectId: id,
        userId,
      },
    },
  });

  res.json({
    success: true,
    message: "Member removed successfully",
  });
});
