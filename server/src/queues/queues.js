import { Queue } from "bullmq";
import { getConnection } from "../config/redis.js";

/**
 * Nova BullMQ Queue Definitions
 *
 * Each queue maps to one automation phase.
 * These are only loaded via dynamic import() when Redis is confirmed available.
 */

const connection = getConnection();

export const riskAnalysisQueue = new Queue("nova-risk-analysis", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
});

export const notificationsQueue = new Queue("nova-notifications", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
});

export const automationActionsQueue = new Queue("nova-automation-actions", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 10000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 100 },
  },
});

export const predictionsQueue = new Queue("nova-predictions", {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 30000 },
    removeOnComplete: { count: 20 },
    removeOnFail: { count: 50 },
  },
});

export const insightsQueue = new Queue("nova-insights", {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 60000 },
    removeOnComplete: { count: 10 },
    removeOnFail: { count: 30 },
  },
});

export const allQueues = [
  riskAnalysisQueue,
  notificationsQueue,
  automationActionsQueue,
  predictionsQueue,
  insightsQueue,
];
