// Admin Routes
import express from "express";
const router = express.Router();

import adminRoutes from "./admin.routes.js";
import userRoutes from "./user.routes.js";

// Mount admin-related routes
router.use("/", adminRoutes);
router.use("/users", userRoutes);

export default router;
