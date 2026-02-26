import express from "express";
import { userController } from "../../controllers/admin/user.controller.js";
import {
  registerSchema,
  loginSchema,
  updateRoleSchema,
  userIdSchema,
} from "../../validations/user.validation.js";
import { validateRequest } from "../../middleware/validation.middleware.js";
import { auth, requireAdmin } from "../../middleware/auth.js";

import { upload } from "../../middleware/upload.js";

const router = express.Router();

// Public routes
router.post(
  "/register",
  validateRequest(registerSchema),
  userController.register,
);
router.post("/login", validateRequest(loginSchema), userController.login);
router.post("/refresh", userController.refreshToken);

// Protected routes
router.get("/profile", auth, userController.getProfile);
router.get("/", auth, userController.getAllUsers);
router.post(
  "/avatar",
  auth,
  upload.single("avatar"),
  userController.uploadAvatar,
);

// Admin only routes
router.put(
  "/:userId/role",
  auth,
  requireAdmin,
  validateRequest(userIdSchema, "params"),
  validateRequest(updateRoleSchema, "body"),
  userController.updateRole,
);

export default router;
