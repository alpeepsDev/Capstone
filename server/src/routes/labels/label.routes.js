import express from "express";
import { authenticateToken } from "../../middleware/auth.js";
import {
  getLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  addLabelToTask,
  removeLabelFromTask,
  getTaskLabels,
} from "../../controllers/labels/label.controller.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import {
  createLabelSchema,
  updateLabelSchema,
  addLabelToTaskSchema,
} from "../../validations/label.validation.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Label CRUD
router.get("/", getLabels);
router.post("/", validateRequest(createLabelSchema), createLabel);
router.put("/:id", validateRequest(updateLabelSchema), updateLabel);
router.delete("/:id", deleteLabel);

// Task label associations
router.get("/task/:taskId", getTaskLabels);
router.post(
  "/task/:taskId",
  validateRequest(addLabelToTaskSchema),
  addLabelToTask,
);
router.delete("/task/:taskId/:labelId", removeLabelFromTask);

export default router;
