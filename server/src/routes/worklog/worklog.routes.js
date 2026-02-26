import express from "express";
import { PrismaClient } from "@prisma/client";
import { auth } from "../../middleware/auth.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import {
  createWorklogSchema,
  updateWorklogSchema,
} from "../../validations/worklog.validation.js";

const router = express.Router();
const prisma = new PrismaClient();

// Create a new work log
router.post(
  "/",
  auth,
  validateRequest(createWorklogSchema),
  async (req, res) => {
    try {
      const { taskId, timeSpent, date, description, timeRemaining } = req.body;
      const userId = req.user.id;

      // Start transaction to update task and create log
      const result = await prisma.$transaction(async (prisma) => {
        // Create work log
        const workLog = await prisma.workLog.create({
          data: {
            taskId,
            userId,
            timeSpent: parseInt(timeSpent),
            startedAt: date ? new Date(date) : new Date(),
            description,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
              },
            },
          },
        });

        // Update task totals
        const task = await prisma.task.update({
          where: { id: taskId },
          data: {
            timeSpent: { increment: parseInt(timeSpent) },
            timeRemaining:
              timeRemaining !== undefined ? parseInt(timeRemaining) : undefined,
          },
        });

        return { workLog, task };
      });

      res.status(201).json({
        success: true,
        data: result.workLog,
        task: result.task,
      });
    } catch (error) {
      console.error("Error creating work log:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create work log",
      });
    }
  },
);

// Get work logs for a task
router.get("/task/:taskId", auth, async (req, res) => {
  try {
    const { taskId } = req.params;

    const workLogs = await prisma.workLog.findMany({
      where: { taskId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });

    res.json({
      success: true,
      data: workLogs,
    });
  } catch (error) {
    console.error("Error fetching work logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch work logs",
    });
  }
});

// Delete a work log
router.delete("/:id", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existingLog = await prisma.workLog.findUnique({
      where: { id },
    });

    if (!existingLog) {
      return res.status(404).json({
        success: false,
        message: "Work log not found",
      });
    }

    if (existingLog.userId !== userId && req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this work log",
      });
    }

    // Transaction to delete log and update task totals
    const result = await prisma.$transaction(async (prisma) => {
      await prisma.workLog.delete({
        where: { id },
      });

      const task = await prisma.task.update({
        where: { id: existingLog.taskId },
        data: {
          timeSpent: { decrement: existingLog.timeSpent },
          timeRemaining: { increment: existingLog.timeSpent },
        },
      });

      return task;
    });

    res.json({
      success: true,
      message: "Work log deleted successfully",
      task: result,
    });
  } catch (error) {
    console.error("Error deleting work log:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete work log",
    });
  }
});

// Update a work log
router.put(
  "/:id",
  auth,
  validateRequest(updateWorklogSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { timeSpent, date, description, timeRemaining } = req.body;
      const userId = req.user.id;

      const existingLog = await prisma.workLog.findUnique({
        where: { id },
      });

      if (!existingLog) {
        return res.status(404).json({
          success: false,
          message: "Work log not found",
        });
      }

      if (existingLog.userId !== userId && req.user.role !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Not authorized to update this work log",
        });
      }

      // Calculate difference to update task total
      const timeDifference = parseInt(timeSpent) - existingLog.timeSpent;

      const result = await prisma.$transaction(async (prisma) => {
        const updatedLog = await prisma.workLog.update({
          where: { id },
          data: {
            timeSpent: parseInt(timeSpent),
            startedAt: date ? new Date(date) : undefined,
            description,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                name: true,
                avatar: true,
              },
            },
          },
        });

        const task = await prisma.task.update({
          where: { id: existingLog.taskId },
          data: {
            timeSpent: { increment: timeDifference },
            timeRemaining:
              timeRemaining !== undefined ? parseInt(timeRemaining) : undefined,
          },
        });

        return { workLog: updatedLog, task };
      });

      res.json({
        success: true,
        data: result.workLog,
        task: result.task,
      });
    } catch (error) {
      console.error("Error updating work log:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update work log",
      });
    }
  },
);

export default router;
