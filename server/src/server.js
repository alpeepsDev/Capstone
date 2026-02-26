import app from "./app.js";
import prisma from "./config/database.js";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { initializeWebSocket } from "./services/websocket.service.js";

const PORT = process.env.PORT;

async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
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
    console.log(`🚀 TaskForge server running on port http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔌 WebSocket server ready for real-time notifications`);
  });
}

// Graceful shutdown — close BullMQ workers & queues (if active) before disconnecting DB
async function gracefulShutdown(signal) {
  console.log(`${signal} received, shutting down gracefully...`);

  try {
    // Dynamically import — only loads if BullMQ was actually initialized
    const { allWorkers } = await import("./automation/scheduler.js");

    if (allWorkers && allWorkers.length > 0) {
      console.log("[Shutdown] Closing BullMQ workers...");
      await Promise.allSettled(allWorkers.map((w) => w.close()));

      // Also close queues if they were loaded
      try {
        const { allQueues } = await import("./queues/queues.js");
        console.log("[Shutdown] Closing BullMQ queues...");
        await Promise.allSettled(allQueues.map((q) => q.close()));
      } catch {
        // Queues were never loaded (fallback mode) — nothing to close
      }
    }
  } catch {
    // Scheduler module issue — skip BullMQ cleanup
  }

  // Disconnect Prisma
  console.log("[Shutdown] Disconnecting database...");
  await prisma.$disconnect();

  console.log("[Shutdown] ✅ Clean shutdown complete");
  process.exit(0);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
