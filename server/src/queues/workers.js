import { Worker } from "bullmq";
import { getConnection } from "../config/redis.js";

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
    console.log(`[BullMQ] 🔍 Processing risk analysis job #${job.id}`);
    await runAutomation();
    return { success: true };
  },
  { connection, concurrency: 1 },
);

riskAnalysisWorker.on("completed", (job) => {
  console.log(`[BullMQ] ✅ Risk analysis job #${job.id} completed`);
});

riskAnalysisWorker.on("failed", (job, err) => {
  console.error(
    `[BullMQ] ❌ Risk analysis job #${job?.id} failed: ${err.message}`,
  );
});

// ─── NOTIFICATIONS WORKER ───────────────────────────────────────────
const notificationsWorker = new Worker(
  "nova-notifications",
  async (job) => {
    console.log(`[BullMQ] 🔔 Processing notification job #${job.id}`);
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
  console.log(
    `[BullMQ] ✅ Notifications job #${job.id} (${job.data?.task}) completed`,
  );
});

notificationsWorker.on("failed", (job, err) => {
  console.error(
    `[BullMQ] ❌ Notifications job #${job?.id} failed: ${err.message}`,
  );
});

// ─── AUTOMATION ACTIONS WORKER ──────────────────────────────────────
const automationActionsWorker = new Worker(
  "nova-automation-actions",
  async (job) => {
    console.log(`[BullMQ] 🤖 Processing automation actions job #${job.id}`);
    await runAutomationActions();
    return { success: true };
  },
  { connection, concurrency: 1 },
);

automationActionsWorker.on("completed", (job) => {
  console.log(`[BullMQ] ✅ Automation actions job #${job.id} completed`);
});

automationActionsWorker.on("failed", (job, err) => {
  console.error(
    `[BullMQ] ❌ Automation actions job #${job?.id} failed: ${err.message}`,
  );
});

// ─── PREDICTIONS WORKER ─────────────────────────────────────────────
const predictionsWorker = new Worker(
  "nova-predictions",
  async (job) => {
    console.log(`[BullMQ] 🔮 Processing predictions job #${job.id}`);
    await refreshPredictions();
    return { success: true };
  },
  { connection, concurrency: 1 },
);

predictionsWorker.on("completed", (job) => {
  console.log(`[BullMQ] ✅ Predictions job #${job.id} completed`);
});

predictionsWorker.on("failed", (job, err) => {
  console.error(
    `[BullMQ] ❌ Predictions job #${job?.id} failed: ${err.message}`,
  );
});

// ─── INSIGHTS WORKER 
const insightsWorker = new Worker(
  "nova-insights",
  async (job) => {
    console.log(`[BullMQ] 💡 Processing insights job #${job.id}`);
    await generateInsightsForAllUsers();
    return { success: true };
  },
  { connection, concurrency: 1 },
);

insightsWorker.on("completed", (job) => {
  console.log(`[BullMQ] ✅ Insights job #${job.id} completed`);
});

insightsWorker.on("failed", (job, err) => {
  console.error(`[BullMQ] ❌ Insights job #${job?.id} failed: ${err.message}`);
});

// EXPORT ALL WORKERS
export const allWorkers = [
  riskAnalysisWorker,
  notificationsWorker,
  automationActionsWorker,
  predictionsWorker,
  insightsWorker,
];
