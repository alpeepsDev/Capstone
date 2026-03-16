import { Worker } from "bullmq";
import { getConnection } from "../config/redis.js";
import logger from "../utils/logger.js";

// Import existing automation functions (unchanged)
import { runAutomation } from "../automation/engine.js";
import { runAutomationActions } from "../services/nova/automationEngine.js";
import { refreshPredictions } from "../services/nova/predictiveAnalytics.js";
import { generateInsightsForAllUsers } from "../services/nova/insightGenerator.js";
import {
  sendDeadlineWarnings,
  sendRiskAlerts,
  generateWeeklySummaries,
} from "../services/nova/notificationScheduler.js";

/**
 * Nova BullMQ Workers
 *
 * Each worker processes jobs from its queue by calling the existing
 * automation service functions. Only loaded when Redis is confirmed available.
 */

const connection = getConnection();

// ─── RISK ANALYSIS WORKER ───────────────────────────────────────────
const riskAnalysisWorker = new Worker(
  "nova-risk-analysis",
  async (job) => {
    logger.info(`[BullMQ] Processing risk analysis job #${job.id}`);
    await runAutomation();
    return { success: true };
  },
  { connection, concurrency: 1 },
);

riskAnalysisWorker.on("completed", (job) => {
  logger.info(`[BullMQ] Risk analysis job #${job.id} completed`);
});

riskAnalysisWorker.on("failed", (job, err) => {
  logger.error(`[BullMQ] Risk analysis job #${job?.id} failed`, { err });
});

// ─── NOTIFICATIONS WORKER ───────────────────────────────────────────
const notificationsWorker = new Worker(
  "nova-notifications",
  async (job) => {
    logger.info(`[BullMQ] Processing notification job #${job.id}`);
    const { task } = job.data;

    switch (task) {
      case "deadline-warnings":
        await sendDeadlineWarnings();
        break;
      case "risk-alerts":
        await sendRiskAlerts();
        break;
      case "weekly-summaries":
        await generateWeeklySummaries();
        break;
      default:
        await sendDeadlineWarnings();
        await sendRiskAlerts();
    }

    return { success: true, task };
  },
  { connection, concurrency: 1 },
);

notificationsWorker.on("completed", (job) => {
  logger.info(
    `[BullMQ] Notifications job #${job.id} (${job.data?.task}) completed`,
  );
});

notificationsWorker.on("failed", (job, err) => {
  logger.error(`[BullMQ] Notifications job #${job?.id} failed`, { err });
});

// ─── AUTOMATION ACTIONS WORKER ──────────────────────────────────────
const automationActionsWorker = new Worker(
  "nova-automation-actions",
  async (job) => {
    logger.info(`[BullMQ] Processing automation actions job #${job.id}`);
    await runAutomationActions();
    return { success: true };
  },
  { connection, concurrency: 1 },
);

automationActionsWorker.on("completed", (job) => {
  logger.info(`[BullMQ] Automation actions job #${job.id} completed`);
});

automationActionsWorker.on("failed", (job, err) => {
  logger.error(`[BullMQ] Automation actions job #${job?.id} failed`, { err });
});

// ─── PREDICTIONS WORKER ─────────────────────────────────────────────
const predictionsWorker = new Worker(
  "nova-predictions",
  async (job) => {
    logger.info(`[BullMQ] Processing predictions job #${job.id}`);
    await refreshPredictions();
    return { success: true };
  },
  { connection, concurrency: 1 },
);

predictionsWorker.on("completed", (job) => {
  logger.info(`[BullMQ] Predictions job #${job.id} completed`);
});

predictionsWorker.on("failed", (job, err) => {
  logger.error(`[BullMQ] Predictions job #${job?.id} failed`, { err });
});

// ─── INSIGHTS WORKER 
const insightsWorker = new Worker(
  "nova-insights",
  async (job) => {
    logger.info(`[BullMQ] Processing insights job #${job.id}`);
    await generateInsightsForAllUsers();
    return { success: true };
  },
  { connection, concurrency: 1 },
);

insightsWorker.on("completed", (job) => {
  logger.info(`[BullMQ] Insights job #${job.id} completed`);
});

insightsWorker.on("failed", (job, err) => {
  logger.error(`[BullMQ] Insights job #${job?.id} failed`, { err });
});

// EXPORT ALL WORKERS
export const allWorkers = [
  riskAnalysisWorker,
  notificationsWorker,
  automationActionsWorker,
  predictionsWorker,
  insightsWorker,
];
