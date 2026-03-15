import app from "./app.js";
import prisma from "./config/database.js";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { initializeWebSocket } from "./services/websocket.service.js";
import logger from "./utils/logger.js";

const PORT = process.env.PORT;

async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    logger.info("✅ Database connected successfully");
  } catch (error) {
    logger.error("⚠️ Database connection failed on startup. Server will run in degraded mode:", error.message);
    // Do not exit, allow server to serve static files and health check
  }
}

async function startServer() {
  await testDatabaseConnection();

  // Create HTTP server
  const server = createServer(app);

  // Initialize Socket.IO
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
    },
  });

  // Initialize WebSocket handlers
  initializeWebSocket(io);

  // Make io accessible throughout the app
  app.set("io", io);

  server.listen(PORT, () => {
    logger.info(`🚀 TaskForge server running on port http://localhost:${PORT}`);
    logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
    logger.info(`🔌 WebSocket server ready for real-time notifications`);
  });
}

// Graceful shutdown — close BullMQ workers & queues (if active) before disconnecting DB
async function gracefulShutdown(signal) {
  logger.info(`${signal} received, shutting down gracefully...`);

  try {
    // Dynamically import — only loads if BullMQ was actually initialized
    const { allWorkers } = await import("./automation/scheduler.js");

    if (allWorkers && allWorkers.length > 0) {
      logger.info("[Shutdown] Closing BullMQ workers...");
      await Promise.allSettled(allWorkers.map((w) => w.close()));

      // Also close queues if they were loaded
      try {
        const { allQueues } = await import("./queues/queues.js");
        logger.info("[Shutdown] Closing BullMQ queues...");
        await Promise.allSettled(allQueues.map((q) => q.close()));
      } catch {
        // Queues were never loaded (fallback mode) — nothing to close
      }
    }
  } catch {
    // Scheduler module issue — skip BullMQ cleanup
  }

  // Disconnect Prisma
  logger.info("[Shutdown] Disconnecting database...");
  await prisma.$disconnect();

  logger.info("[Shutdown] ✅ Clean shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer().catch((error) => {
  logger.error("Failed to start server:", error);
  process.exit(1);
});
