import express from "express";
import { askNova } from "../../controllers/ai/assistantController.js";
import { authenticateToken } from "../../middleware/auth.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import { askNovaSchema } from "../../validations/ai.validation.js";

const router = express.Router();

// Protect all assistant routes
router.post(
  "/query",
  authenticateToken,
  validateRequest(askNovaSchema),
  askNova,
);

export default router;
