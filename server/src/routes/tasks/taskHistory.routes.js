import express from "express";
import { authenticateToken } from "../../middleware/auth.js";
import { getTaskHistory } from "../../services/taskHistory.service.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get("/:taskId", getTaskHistory);

export default router;
