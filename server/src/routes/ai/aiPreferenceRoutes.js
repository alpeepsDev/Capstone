import express from "express";
import {
  getAIPreferences,
  updateAIPreferences,
  resetAIPreferences,
} from "../../controllers/ai/aiPreferenceController.js";
import { authenticateToken, requireManagerOrHigher } from "../../middleware/auth.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import { updatePreferencesSchema } from "../../validations/aiPreference.validation.js";

const router = express.Router();

// Protect all AI preference routes
router.get("/", authenticateToken, getAIPreferences);
router.put(
  "/",
  authenticateToken,
  requireManagerOrHigher,
  validateRequest(updatePreferencesSchema),
  updateAIPreferences,
);
router.post("/reset", authenticateToken, requireManagerOrHigher, resetAIPreferences);

export default router;
