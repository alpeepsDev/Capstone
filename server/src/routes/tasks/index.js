// Tasks Routes
import express from "express";
const router = express.Router();

import taskRoutes from "./task.routes.js";
import taskHistoryRoutes from "./taskHistory.routes.js";
import taskRelationRoutes from "./taskRelation.routes.js";
import taskTemplateRoutes from "./taskTemplate.routes.js";

// Mount task-related routes
router.use("/", taskRoutes);
router.use("/history", taskHistoryRoutes);
router.use("/relations", taskRelationRoutes);
router.use("/templates", taskTemplateRoutes);

export default router;
