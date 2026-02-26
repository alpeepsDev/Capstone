import express from "express";
import { auth } from "../../middleware/auth.js";
import * as taskController from "../../controllers/tasks/task.controller.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  assignTaskSchema,
  addCommentSchema,
} from "../../validations/task.validation.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// Task CRUD operations
router.get("/project/:projectId", taskController.getProjectTasks);
router.get("/:id", taskController.getTask);
router.post("/", validateRequest(createTaskSchema), taskController.createTask);
router.put(
  "/:id",
  validateRequest(updateTaskSchema),
  taskController.updateTask,
);
router.delete("/:id", taskController.deleteTask);

// Kanban board operations
router.put(
  "/:id/move",
  validateRequest(moveTaskSchema),
  taskController.moveTask,
);
router.put(
  "/:id/assign",
  validateRequest(assignTaskSchema),
  taskController.assignTask,
);

// Task comments
router.get("/:id/comments", taskController.getTaskComments);
router.post(
  "/:id/comments",
  validateRequest(addCommentSchema),
  taskController.addTaskComment,
);

// Manager-specific routes
router.get(
  "/manager/awaiting-approval",
  taskController.getTasksAwaitingApproval,
);
router.get("/manager/stats", taskController.getManagerStats);
router.get("/manager/all-tasks", taskController.getManagerTasks);
router.put("/:id/approve", taskController.approveTask);

export default router;
