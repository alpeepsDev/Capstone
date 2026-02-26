import prisma from "../config/database.js";
import { decrypt } from "../utils/encryption.js";

export const globalSearch = async (req, res) => {
  try {
    const { query } = req.query;
    const userId = req.user.id;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const lowerQuery = query.toLowerCase();

    // 1. Search TASKS (remains database-level search as they are not encrypted)
    const tasksPromise = prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
        // Ensure user has access to project
        project: {
          members: {
            some: {
              userId: userId,
            },
          },
        },
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        projectId: true,
        project: {
          select: {
            name: true, // We will need to decrypt this if we want to show it? Yes.
          },
        },
      },
      take: 10,
    });

    // 2. Search PROJECTS (In-memory filtering due to encryption)
    // Fetch all projects user has access to
    const projectsPromise = prisma.project.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        isActive: true,
      },
      // We can't limit by 'take' here because we don't know which ones match yet
    });

    const [rawTasks, rawProjects] = await Promise.all([
      tasksPromise,
      projectsPromise,
    ]);

    // Process Projects: Decrypt and Filter
    const projects = rawProjects
      .map((p) => ({
        ...p,
        name: decrypt(p.name),
        description: p.description ? decrypt(p.description) : p.description,
      }))
      .filter((p) => {
        return (
          p.name.toLowerCase().includes(lowerQuery) ||
          (p.description && p.description.toLowerCase().includes(lowerQuery))
        );
      })
      .slice(0, 5); // Take top 5 after filtering

    // Process Tasks: Decrypt project name in the result
    const tasks = rawTasks.map((t) => ({
      ...t,
      project: {
        ...t.project,
        name: decrypt(t.project.name),
      },
    }));

    res.json({
      projects,
      tasks,
    });
  } catch (error) {
    console.error("Global search error:", error);
    res.status(500).json({ message: "Error performing search" });
  }
};
