import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { getNotifications } from "../api/notifications.js";
import { useAuth } from "./AuthContext.jsx";
import webSocketService from "../services/websocket.service.js";

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (params = {}) => {
      if (!user || authLoading) {
        console.log(
          "NotificationContext: No user found or auth still loading, skipping notification fetch"
        );
        return;
      }

      setLoading(true);
      try {
        const response = await getNotifications(params);
        setNotifications(response.data.notifications);
        setUnreadCount(response.data.unreadCount);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        // If it's an authentication error, clear tokens and force re-login
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log(
            "Authentication error - tokens may be expired. Clearing tokens..."
          );

          // Clear expired tokens
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          sessionStorage.removeItem("accessToken");
          sessionStorage.removeItem("refreshToken");
          sessionStorage.removeItem("user");

          // Disconnect WebSocket
          webSocketService.disconnect();

          // Redirect to login page
          window.location.href = "/login";
          return;
        }
      } finally {
        setLoading(false);
      }
    },
    [user, authLoading]
  );

  // Handle real-time notifications - move before useEffect to fix dependency
  const handleRealtimeNotification = useCallback((notification) => {
    console.log("📢 Real-time notification received:", notification);

    setNotifications((prev) => {
      // Check if notification already exists (exact duplicate)
      const existingNotification = prev.find((n) => n.id === notification.id);
      if (existingNotification) {
        console.log(
          "🔄 Notification already exists, skipping duplicate:",
          notification.id
        );
        return prev; // Return unchanged array if notification already exists
      }

      // Check for existing notifications of the same type for the same task
      // Replace the previous notification instead of adding a new one
      const taskId = notification.task?.id || notification.taskId;
      const notificationType = notification.type;

      if (taskId && notificationType) {
        const existingTaskNotificationIndex = prev.findIndex(
          (n) =>
            (n.task?.id || n.taskId) === taskId && n.type === notificationType
        );

        if (existingTaskNotificationIndex !== -1) {
          console.log(
            "🔄 Replacing existing notification for same task:",
            taskId,
            "type:",
            notificationType
          );

          const existingTaskNotification = prev[existingTaskNotificationIndex];
          const updatedNotifications = [...prev];

          // Replace the existing notification with the new one
          updatedNotifications[existingTaskNotificationIndex] = notification;

          // Update unread count only if the previous notification was read but new one is unread
          if (existingTaskNotification.isRead && !notification.isRead) {
            setUnreadCount((prevCount) => prevCount + 1);
          }
          // If previous was unread and new is also unread, count stays the same
          // If previous was unread and new is read, decrease count
          else if (!existingTaskNotification.isRead && notification.isRead) {
            setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
          }

          return updatedNotifications;
        }
      }

      // If no existing notification for this task/type, add as new
      // Update unread count if it's a new unread notification
      if (!notification.isRead) {
        setUnreadCount((prevCount) => prevCount + 1);
      }

      // Add new notification to the list
      return [notification, ...prev];
    });

    // Show browser notification if permission is granted
    if (Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
        tag: notification.id, // Prevent duplicate notifications
      });
    }
  }, []); // No dependencies needed since we use function updates

  // Initialize WebSocket connection and fetch initial notifications
  useEffect(() => {
    if (user && !authLoading) {
      // Get access token for WebSocket authentication
      const accessToken =
        localStorage.getItem("accessToken") ||
        sessionStorage.getItem("accessToken");

      if (accessToken) {
        console.log("🔌 Initializing WebSocket connection for user:", user.id);

        // Connect to WebSocket
        webSocketService.connect(accessToken);

        // Listen for real-time notifications
        webSocketService.onNotification(handleRealtimeNotification);

        // Request notification permission if not already granted
        if (Notification.permission === "default") {
          Notification.requestPermission().then((permission) => {
            console.log("Notification permission:", permission);
          });
        }

        // Fetch initial notifications
        fetchNotifications();

        return () => {
          console.log("🔌 Cleaning up WebSocket listeners for user:", user.id);
          // Cleanup WebSocket listeners
          webSocketService.offNotification(handleRealtimeNotification);
        };
      }
    } else if (!user) {
      // Disconnect WebSocket when user logs out
      console.log("🔌 Disconnecting WebSocket - user logged out");
      webSocketService.disconnect();
    }
  }, [user, authLoading]); // Removed the callback dependencies to prevent reconnection loops

  // Cleanup WebSocket on unmount
  useEffect(() => {
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  // Add new notification (for real-time updates)
  const addNotification = useCallback((notification) => {
    setNotifications((prev) => {
      // Check if notification already exists (exact duplicate)
      const existingNotification = prev.find((n) => n.id === notification.id);
      if (existingNotification) {
        console.log(
          "🔄 Notification already exists in addNotification, skipping duplicate:",
          notification.id
        );
        return prev; // Return unchanged array if notification already exists
      }

      // Check for existing notifications of the same type for the same task
      // Replace the previous notification instead of adding a new one
      const taskId = notification.task?.id || notification.taskId;
      const notificationType = notification.type;

      if (taskId && notificationType) {
        const existingTaskNotificationIndex = prev.findIndex(
          (n) =>
            (n.task?.id || n.taskId) === taskId && n.type === notificationType
        );

        if (existingTaskNotificationIndex !== -1) {
          console.log(
            "🔄 Replacing existing notification for same task in addNotification:",
            taskId,
            "type:",
            notificationType
          );

          const existingTaskNotification = prev[existingTaskNotificationIndex];
          const updatedNotifications = [...prev];

          // Replace the existing notification with the new one
          updatedNotifications[existingTaskNotificationIndex] = notification;

          // Update unread count only if the previous notification was read but new one is unread
          if (existingTaskNotification.isRead && !notification.isRead) {
            setUnreadCount((prevCount) => prevCount + 1);
          }
          // If previous was unread and new is also unread, count stays the same
          // If previous was unread and new is read, decrease count
          else if (!existingTaskNotification.isRead && notification.isRead) {
            setUnreadCount((prevCount) => Math.max(0, prevCount - 1));
          }

          return updatedNotifications;
        }
      }

      // If no existing notification for this task/type, add as new
      // Update unread count if it's a new unread notification
      if (!notification.isRead) {
        setUnreadCount((prevCount) => prevCount + 1);
      }

      return [notification, ...prev];
    });
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isRead: true }))
    );
    setUnreadCount(0);
  }, []);

  // Remove notification
  const removeNotification = useCallback(
    (notificationId) => {
      const notification = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) =>
        prev.filter((notif) => notif.id !== notificationId)
      );
      if (notification && !notification.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    },
    [notifications]
  );

  // Join project room (for managers)
  const joinProject = useCallback((projectId) => {
    webSocketService.joinProject(projectId);
  }, []);

  // Leave project room
  const leaveProject = useCallback((projectId) => {
    webSocketService.leaveProject(projectId);
  }, []);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    joinProject,
    leaveProject,
    connectionStatus: webSocketService.getConnectionStatus(),
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
