import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import userRoutes from "./routes/admin/user.routes.js"; // User authentication routes
import taskRoutes from "./routes/tasks/index.js";
import projectRoutes from "./routes/projects/index.js";
import exchangeRoutes from "./routes/exchanges/index.js";
import notificationRoutes from "./routes/notifications/index.js";
import adminRoutes from "./routes/admin/index.js";
import workLogRoutes from "./routes/worklog/index.js";
import budgetRoutes from "./routes/budget/index.js";
import aiRoutes from "./routes/ai/index.js"; // AI includes assistant, insights, preferences
import labelRoutes from "./routes/labels/index.js"; // Labels includes filters
import searchRoutes from "./routes/search.routes.js";
// Backward-compatible imports for direct access
import assistantRoutes from "./routes/ai/assistantRoutes.js";
import insightRoutes from "./routes/ai/insightRoutes.js";
import aiPreferenceRoutes from "./routes/ai/aiPreferenceRoutes.js";

// Middleware
import { errorHandler } from "./middleware/errorHandler.js";
import apiLogger from "./middleware/apiLogger.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { optionalAuth } from "./middleware/optionalAuth.js";

// Automation
import { initScheduler } from "./automation/scheduler.js";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../../client/dist")));
app.use(express.static(path.join(__dirname, "../../client/dist")));

// Middleware
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "https://*.ngrok-free.app"],
    },
  }),
);
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// API logging middleware (logs all requests)
app.use(apiLogger);

// Rate limiting middleware (applies to all routes)
// We use optionalAuth first so rateLimit knows who the user is
app.use(optionalAuth);

// Enable rate limiting (default to true if not specified)
if (process.env.RATE_LIMITING_ENABLED !== "false") {
  app.use(rateLimit);
} else {
  console.info(
    "Rate limiting is disabled. Set RATE_LIMITING_ENABLED=true (or unset) to enable enforcement.",
  );
}

// Routes - Organized by Feature

app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/tasks", taskRoutes); // Includes task, taskHistory, taskRelation, taskTemplate
app.use("/api/v1/worklogs", workLogRoutes);
app.use("/api/v1/budget", budgetRoutes);
app.use("/api/v1/exchanges", exchangeRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/labels", labelRoutes); // Includes labels and saved filters
app.use("/api/v1/users", userRoutes); // User authentication (login, register, profile)
app.use("/api/v1/admin", adminRoutes); // Admin operations
app.use("/api/v1/ai", aiRoutes); // Includes assistant, insights, AI preferences
app.use("/api/v1/search", searchRoutes); // Global search

// Backward-compatible routes for legacy frontend code
app.use("/api/v1/assistant", assistantRoutes); // Maps to ai/assistant/*
app.use("/api/v1/insights", insightRoutes); // Maps to ai/insights/*
app.use("/api/v1/ai-preferences", aiPreferenceRoutes); // Maps to ai/preferences/*

// Initialize Nova Automation Scheduler (BullMQ)
initScheduler().catch((err) => {
  console.error("[Nova Scheduler] Failed to initialize:", err);
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "TaskForge API is running",
    timestamp: new Date().toISOString(),
  });
});

// SPA Fallback (Only for non-API routes)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../../client/dist", "index.html"));
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;
