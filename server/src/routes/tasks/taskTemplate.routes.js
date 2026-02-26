import express from "express";
import { authenticateToken } from "../../middleware/auth.js";
import {
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  createTaskFromTemplate,
} from "../../controllers/tasks/taskTemplate.controller.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import {
  createTemplateSchema,
  updateTemplateSchema,
  createFromTemplateSchema,
} from "../../validations/taskTemplate.validation.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

router.get("/", getTemplates);
router.post("/", validateRequest(createTemplateSchema), createTemplate);
router.put("/:id", validateRequest(updateTemplateSchema), updateTemplate);
router.delete("/:id", deleteTemplate);
router.post(
  "/:templateId/create-task",
  validateRequest(createFromTemplateSchema),
  createTaskFromTemplate,
);

export default router;
