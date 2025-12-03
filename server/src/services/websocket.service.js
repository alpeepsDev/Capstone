import jwt from "jsonwebtoken";

// Store connected users
const connectedUsers = new Map();

export const initializeWebSocket = (io) => {
  // Authentication middleware for WebSocket
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      console.log("🔐 WebSocket auth attempt:", {
        hasToken: !!token,
        authHeader: socket.handshake.headers.authorization,
        authToken: socket.handshake.auth.token,
      });

      if (!token) {
        console.log("❌ WebSocket auth failed: No token provided");
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;

      console.log("✅ WebSocket auth success:", {
        userId: decoded.userId,
        role: decoded.role,
      });
      next();
    } catch (error) {
      console.log("❌ WebSocket auth failed:", error.message);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`👤 User ${socket.userId} connected to WebSocket`);

    // Store user socket for notification targeting
    connectedUsers.set(socket.userId, socket);

    // Handle user joining their notification room
    socket.join(`user:${socket.userId}`);

    // Handle user joining project-specific rooms
    socket.on("join-project", (projectId) => {
      // Ideally we should verify if user is member of project here, but for now we allow joining
      socket.join(`project:${projectId}`);
      console.log(
        `👤 User ${socket.userId} joined project room: project:${projectId}`
      );

      // Verify room membership
      const rooms = Array.from(socket.rooms);
      console.log(`🏠 User ${socket.userId} is now in rooms:`, rooms);
    });

    // Handle user leaving project rooms
    socket.on("leave-project", (projectId) => {
      socket.leave(`project:${projectId}`);
      console.log(`👤 User ${socket.userId} left project room: ${projectId}`);
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`👤 User ${socket.userId} disconnected from WebSocket`);
      connectedUsers.delete(socket.userId);
    });
  });

  return io;
};

// Helper functions to emit notifications
export const emitNotificationToUser = (io, userId, notification) => {
  io.to(`user:${userId}`).emit("notification", notification);
  console.log(`📢 Notification sent to user ${userId}:`, notification.title);
};

export const emitNotificationToProject = (io, projectId, notification) => {
  io.to(`project:${projectId}`).emit("notification", notification);
  console.log(
    `📢 Notification sent to project ${projectId}:`,
    notification.title
  );
};

export const emitNotificationToAll = (io, notification) => {
  io.emit("notification", notification);
  console.log(`📢 Broadcast notification sent:`, notification.title);
};

// Get connected users (for debugging)
export const getConnectedUsers = () => {
  return Array.from(connectedUsers.keys());
};

// Task related events
export const emitTaskCreated = (io, projectId, task) => {
  io.to(`project:${projectId}`).emit("task-created", task);
  console.log(`📢 Task created event sent to project ${projectId}`);
};

export const emitTaskUpdated = (io, projectId, task) => {
  io.to(`project:${projectId}`).emit("task-updated", task);
  console.log(`📢 Task updated event sent to project ${projectId}`);
};

export const emitTaskMoved = (io, projectId, task) => {
  io.to(`project:${projectId}`).emit("task-moved", task);
  console.log(`📢 Task moved event sent to project ${projectId}`);
};

export const emitTaskDeleted = (io, projectId, taskId) => {
  io.to(`project:${projectId}`).emit("task-deleted", { taskId, projectId });
  console.log(`📢 Task deleted event sent to project ${projectId}`);
};

export const emitCommentAdded = (io, projectId, comment) => {
  io.to(`project:${projectId}`).emit("comment-added", comment);
  console.log(`📢 Comment added event sent to project ${projectId}`);
};
