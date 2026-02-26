import express from "express";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../../controllers/notifications/notification.controller.js";
import { authenticateToken } from "../../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get notifications for current user
router.get("/", getNotifications);

// Mark notification as read
router.patch("/:id/read", markAsRead);

// Mark all notifications as read
router.patch("/read-all", markAllAsRead);

// Delete notification
router.delete("/:id", deleteNotification);

export default router;
