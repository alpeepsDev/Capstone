// AI/Assistant Routes
import express from "express";
const router = express.Router();

import assistantRoutes from "./assistantRoutes.js";
import insightRoutes from "./insightRoutes.js";
import aiPreferenceRoutes from "./aiPreferenceRoutes.js";

// Mount AI-related routes
router.use("/assistant", assistantRoutes);
router.use("/insights", insightRoutes);
router.use("/preferences", aiPreferenceRoutes);

export default router;
