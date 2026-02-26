import express from "express";
import { authenticateToken } from "../../middleware/auth.js";
import {
  createTaskRelation,
  getTaskRelations,
  deleteTaskRelation,
  getSubtasks,
  getTaskDependencies,
} from "../../controllers/tasks/taskRelation.controller.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import { createRelationSchema } from "../../validations/taskRelation.validation.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Task relationships
router.post(
  "/:taskId/relations",
  validateRequest(createRelationSchema),
  createTaskRelation,
);
router.get("/:taskId/relations", getTaskRelations);
router.delete("/:taskId/relations/:relationId", deleteTaskRelation);

// Subtasks
router.get("/:taskId/subtasks", getSubtasks);

// Dependencies
router.get("/:taskId/dependencies", getTaskDependencies);

export default router;
