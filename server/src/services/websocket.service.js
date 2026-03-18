import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

// Store connected users
const connectedUsers = new Map();
const adminDashboardEventTimestamps = new Map();
const ADMIN_UPDATE_EVENT = "admin-update";

let ioInstance = null;

export const initializeWebSocket = (io) => {
  ioInstance = io;

  // Authentication middleware for WebSocket
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      logger.debug("🔐 WebSocket auth attempt:", {
        hasToken: !!token,
        authHeader: socket.handshake.headers.authorization,
        authToken: socket.handshake.auth.token,
      });

      if (!token) {
        logger.warn("❌ WebSocket auth failed: No token provided");
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;

      if (decoded.role === "ADMIN") {
        socket.join("admin");
      }

      logger.info("✅ WebSocket auth success:", {
        userId: decoded.userId,
        role: decoded.role,
      });
      next();
    } catch (error) {
      logger.error("❌ WebSocket auth failed:", error.message);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    logger.info(`👤 User ${socket.userId} connected to WebSocket`);

    // Store user socket for notification targeting
    connectedUsers.set(socket.userId, socket);

    // Handle user joining their notification room
    socket.join(`user:${socket.userId}`);

    // Handle user joining project-specific rooms
    socket.on("join-project", (projectId) => {
      // Ideally we should verify if user is member of project here, but for now we allow joining
      socket.join(`project:${projectId}`);
      logger.debug(
        `👤 User ${socket.userId} joined project room: project:${projectId}`,
      );

      // Verify room membership
      const rooms = Array.from(socket.rooms);
      logger.debug(`🏠 User ${socket.userId} is now in rooms:`, rooms);
    });

    // Handle user leaving project rooms
    socket.on("leave-project", (projectId) => {
      socket.leave(`project:${projectId}`);
      logger.debug(`👤 User ${socket.userId} left project room: ${projectId}`);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      logger.info(`👤 User ${socket.userId} disconnected from WebSocket`);
      connectedUsers.delete(socket.userId);
    });
  });

  return io;
};

// Helper functions to emit notifications
export const emitNotificationToUser = (io, userId, notification) => {
  io.to(`user:${userId}`).emit("notification", notification);
  logger.info(`📢 Notification sent to user ${userId}: ${notification.title}`);
};

export const emitNotificationToProject = (io, projectId, notification) => {
  io.to(`project:${projectId}`).emit("notification", notification);
  logger.info(
    `📢 Notification sent to project ${projectId}: ${notification.title}`,
  );
};

export const emitNotificationToAll = (io, notification) => {
  io.emit("notification", notification);
  logger.info(`📢 Broadcast notification sent: ${notification.title}`);
};

// Get connected users (for debugging)
export const getConnectedUsers = () => {
  return Array.from(connectedUsers.keys());
};

// Task related events
export const emitTaskCreated = (io, projectId, task) => {
  io.to(`project:${projectId}`).emit("task-created", task);
  logger.info(`📢 Task created event sent to project ${projectId}`);
};

export const emitTaskUpdated = (io, projectId, task) => {
  io.to(`project:${projectId}`).emit("task-updated", task);
  logger.info(`📢 Task updated event sent to project ${projectId}`);
};

export const emitTaskMoved = (io, projectId, task) => {
  io.to(`project:${projectId}`).emit("task-moved", task);
  logger.info(`📢 Task moved event sent to project ${projectId}`);
};

export const emitTaskDeleted = (io, projectId, taskId) => {
  io.to(`project:${projectId}`).emit("task-deleted", { taskId, projectId });
  logger.info(`📢 Task deleted event sent to project ${projectId}`);
};

export const emitCommentAdded = (io, projectId, comment) => {
  io.to(`project:${projectId}`).emit("comment-added", comment);
  logger.info(`📢 Comment added event sent to project ${projectId}`);
};

export const getIO = () => ioInstance;

export const emitAdminDashboardEvent = (event) => {
  if (!ioInstance || !event?.type) {
    return false;
  }

  const payload = {
    timestamp: Date.now(),
    ...event,
  };

  ioInstance.to("admin").emit(ADMIN_UPDATE_EVENT, payload);
  logger.info(`📢 Admin dashboard event emitted: ${payload.type}`);
  return true;
};

export const emitThrottledAdminDashboardEvent = (
  event,
  throttleMs = 5000,
) => {
  if (!event?.type) {
    return false;
  }

  const now = Date.now();
  const lastEmittedAt = adminDashboardEventTimestamps.get(event.type) || 0;

  if (now - lastEmittedAt < throttleMs) {
    return false;
  }

  adminDashboardEventTimestamps.set(event.type, now);
  return emitAdminDashboardEvent(event);
};

export const emitAdminUpdate = (model, operation, data) => {
  if (!ioInstance) {
    return false;
  }

  if (typeof model === "object" && model !== null) {
    return emitAdminDashboardEvent(model);
  }

  const payload = {
    model,
    operation,
    data,
    timestamp: Date.now(),
  };

  ioInstance.to("admin").emit(ADMIN_UPDATE_EVENT, payload);
  logger.info(`📢 Admin update emitted for model ${model} (${operation})`);
  return true;
};
