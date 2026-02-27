import { testRedisConnection, getConnection } from "../config/redis.js";

// Import existing automation functions
import { runAutomation } from "./engine.js";
import { runAutomationActions } from "../services/nova/automationEngine.js";
import { refreshPredictions } from "../services/nova/predictiveAnalytics.js";
import { generateInsightsForAllUsers } from "../services/nova/insightGenerator.js";
import { initNotificationScheduler as initNotifFallback } from "../services/nova/notificationScheduler.js";

// Workers array — populated only if BullMQ mode is active
let activeWorkers = [];

/**
 * Initializes the Nova Automation Scheduler.
 *
 * - If Redis is available → uses BullMQ (queues + workers + repeatable jobs)
 * - If Redis is unavailable → falls back to setInterval/setTimeout (original behavior)
 *
 * Either way, the server starts and API requests are handled normally.
 */
export const initScheduler = async () => {
  const isAutomationDisabled = process.env.DISABLE_AUTOMATION === "true";

  if (isAutomationDisabled) {
    console.log(
      "[Nova Scheduler] ⚠️  Automation disabled (DISABLE_AUTOMATION=true)",
    );
    return;
  }

  // Test Redis connection (waits up to ~3s, never throws)
  const redisOk = await testRedisConnection();

  if (redisOk) {
    await initBullMQMode();
  } else {
    initFallbackMode();
  }
};

// BULLMQ MODE
async function initBullMQMode() {
  console.log("[Nova Scheduler] 🚀 Initializing with BullMQ (Redis-backed)...");

  try {
    // Dynamic imports — only load BullMQ modules when Redis is confirmed available
    const {
      riskAnalysisQueue,
      notificationsQueue,
      automationActionsQueue,
      predictionsQueue,
      insightsQueue,
    } = await import("../queues/queues.js");

    const { allWorkers } = await import("../queues/workers.js");
    activeWorkers = allWorkers;

    // Register repeatable jobs
    await riskAnalysisQueue.upsertJobScheduler(
      "risk-analysis-repeat",
      { every: 5 * 60 * 1000 },
      { name: "risk-analysis", data: {} },
    );

    await notificationsQueue.upsertJobScheduler(
      "deadline-warnings-repeat",
      { every: 60 * 60 * 1000 },
      { name: "deadline-warnings", data: { task: "deadline-warnings" } },
    );

    await notificationsQueue.upsertJobScheduler(
      "risk-alerts-repeat",
      { every: 30 * 60 * 1000 },
      { name: "risk-alerts", data: { task: "risk-alerts" } },
    );

    await notificationsQueue.upsertJobScheduler(
      "weekly-summaries-repeat",
      { every: 15 * 60 * 1000 },
      { name: "weekly-summaries", data: { task: "weekly-summaries" } },
    );

    await automationActionsQueue.upsertJobScheduler(
      "automation-actions-repeat",
      { every: 15 * 60 * 1000 },
      { name: "automation-actions", data: {} },
    );

    await predictionsQueue.upsertJobScheduler(
      "predictions-repeat",
      { every: 4 * 60 * 60 * 1000 },
      { name: "predictions", data: {} },
    );

    await insightsQueue.upsertJobScheduler(
      "insights-repeat",
      { every: 24 * 60 * 60 * 1000 },
      { name: "insights", data: {} },
    );

    console.log("[Nova Scheduler] ✅ BullMQ job schedulers registered");
    console.log("[Nova Scheduler] 📊 Risk Analysis: Every 5min");
    console.log(
      "[Nova Scheduler] 🔔 Notifications: Deadlines 1hr | Risks 30min",
    );
    console.log("[Nova Scheduler] 🤖 Automations: Every 15min");
    console.log("[Nova Scheduler] 🔮 Predictions: Every 4hrs");
    console.log("[Nova Scheduler] 💡 Insights: Every 24hrs");
    console.log(`[Nova Scheduler] 👷 ${activeWorkers.length} workers active`);
  } catch (error) {
    console.error("[Nova Scheduler] ❌ BullMQ init failed:", error.message);
    console.log("[Nova Scheduler] 🔄 Falling back to setInterval mode...");
    initFallbackMode();
  }
}

// FALLBACK MODE (setInterval) 
function initFallbackMode() {
  console.log(
    "[Nova Scheduler] 🔄 Using setInterval fallback (no Redis detected)...",
  );

  // Phase 1: Risk Analysis — every 5 minutes
  setTimeout(() => {
    runAutomation();
    setInterval(runAutomation, 5 * 60 * 1000);
  }, 30 * 1000);

  // Phase 2: Notifications
  initNotifFallback();

  // Phase 3: Automated Actions — every 15 minutes
  setTimeout(() => {
    runAutomationActions();
    setInterval(runAutomationActions, 15 * 60 * 1000);
  }, 60 * 1000);

  // Phase 4: Predictions — every 4 hours
  setTimeout(
    () => {
      refreshPredictions();
      setInterval(refreshPredictions, 4 * 60 * 60 * 1000);
    },
    2 * 60 * 1000,
  );

  // Phase 5: Insights — every 24 hours
  setTimeout(
    () => {
      generateInsightsForAllUsers();
      setInterval(generateInsightsForAllUsers, 24 * 60 * 60 * 1000);
    },
    3 * 60 * 1000,
  );

  console.log("[Nova Scheduler] ✅ Fallback scheduler active");
  console.log(
    "[Nova Scheduler] 💡 Install & start Redis for better reliability + retries",
  );
}

export { activeWorkers as allWorkers };
