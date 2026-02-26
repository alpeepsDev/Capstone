import express from "express";
import { auth } from "../../middleware/auth.js";
import * as projectController from "../../controllers/projects/project.controller.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdParamSchema,
  addMemberSchema,
} from "../../validations/project.validation.js";

const router = express.Router();

// All routes require authentication
router.use(auth);

// Project CRUD operations
router.get("/", projectController.getProjects);
router.get("/:id", projectController.getProject);
router.post(
  "/",
  validateRequest(createProjectSchema),
  projectController.createProject,
);
router.put(
  "/:id",
  validateRequest(projectIdParamSchema, "params"),
  validateRequest(updateProjectSchema),
  projectController.updateProject,
);
router.delete("/:id", projectController.deleteProject);

// Project member management
router.get("/:id/members", projectController.getProjectMembers);
router.post(
  "/:id/members",
  validateRequest(addMemberSchema),
  projectController.addProjectMember,
);
router.delete("/:id/members/:userId", projectController.removeProjectMember);

export default router;
