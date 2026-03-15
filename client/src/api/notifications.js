import api from "./index.js";
import logger from "../utils/logger.js";

// Get notifications for current user
export const getNotifications = async (params = {}) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = params;
    const response = await api.get("/notifications", {
      params: { page, limit, unreadOnly },
    });
    return response.data;
  } catch (error) {
    logger.error("Failed to fetch notifications:", error);
    throw error;
  }
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    logger.error("Failed to mark notification as read:", error);
    throw error;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  try {
    const response = await api.patch("/notifications/read-all");
    return response.data;
  } catch (error) {
    logger.error("Failed to mark all notifications as read:", error);
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (notificationId) => {
  try {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  } catch (error) {
    logger.error("Failed to delete notification:", error);
    throw error;
  }
};
