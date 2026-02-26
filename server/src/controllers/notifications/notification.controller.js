import pkg from "@prisma/client";
const { PrismaClient } = pkg;
import { asyncHandler } from "../../utils/asyncHandler.js";
import { emitNotificationToUser } from "../../services/websocket.service.js";

const prisma = new PrismaClient();

// Get all notifications for current user
export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, unreadOnly = false } = req.query;

  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(unreadOnly === "true" && { isRead: false }),
  };

  const [notifications, totalCount, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: parseInt(skip),
      take: parseInt(limit),
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ]);

  res.json({
    success: true,
    data: {
      notifications,
      pagination: {
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / limit),
      },
      unreadCount,
    },
  });
});

// Mark notification as read
export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: "Notification not found",
    });
  }

  const updatedNotification = await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  res.json({
    success: true,
    data: updatedNotification,
  });
});

// Mark all notifications as read
export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  res.json({
    success: true,
    message: "All notifications marked as read",
  });
});

// Delete notification
export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const notification = await prisma.notification.findFirst({
    where: { id, userId },
  });

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: "Notification not found",
    });
  }

  await prisma.notification.delete({
    where: { id },
  });

  res.json({
    success: true,
    message: "Notification deleted",
  });
});

// Create notification (internal use)
export const createNotification = async ({
  userId,
  type,
  title,
  message,
  taskId = null,
  projectId = null,
  io = null, // Socket.IO instance for real-time emission
}) => {
  console.log(
    `[${new Date().toISOString()}] createNotification called for User: ${userId}, Type: ${type}, Task: ${taskId}`,
  );
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        taskId,
        projectId,
      },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
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

    // Emit real-time notification if Socket.IO instance is provided
    if (io) {
      emitNotificationToUser(io, userId, {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        task: notification.task,
        project: notification.project,
      });
    }

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
};
