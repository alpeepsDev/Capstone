// Labels Routes
import express from "express";
const router = express.Router();

import labelRoutes from "./label.routes.js";
import savedFilterRoutes from "./savedFilter.routes.js";

// Mount label-related routes
router.use("/", labelRoutes);
router.use("/filters", savedFilterRoutes);

export default router;
