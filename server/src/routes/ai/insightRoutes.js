import express from "express";
import {
  getInsights,
  getInsightHistory,
  dismissInsightById,
  markInsightAction,
  generateInsights,
  getInsightStats,
} from "../../controllers/ai/insightController.js";
import { authenticateToken } from "../../middleware/auth.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import {
  insightQuerySchema,
  insightHistoryQuerySchema,
} from "../../validations/insight.validation.js";

const router = express.Router();

// Protect all insight routes
router.get(
  "/",
  authenticateToken,
  validateRequest(insightQuerySchema, "query"),
  getInsights,
);
router.get(
  "/history",
  authenticateToken,
  validateRequest(insightHistoryQuerySchema, "query"),
  getInsightHistory,
);
router.get("/stats", authenticateToken, getInsightStats);
router.post("/generate", authenticateToken, generateInsights);
router.put("/:id/dismiss", authenticateToken, dismissInsightById);
router.put("/:id/action", authenticateToken, markInsightAction);

export default router;
