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
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();

  // Automatically sync unreadCount based on notifications list
  // This prevents React StrictMode double-invocation bugs from causing
  // duplicate increments during state updater side-effects.
  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.isRead).length);
  }, [notifications]);

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (params = {}) => {
      if (!user || authLoading) {
        console.log(
          "NotificationContext: No user found or auth still loading, skipping notification fetch",
        );
        return;
      }

      setLoading(true);
      try {
        const response = await getNotifications(params);

        // Deduplicate notifications - keep only the most recent one per task+type combination
        // This handles stale duplicates that may exist in the database from previous bugs
        let notifications = [];
        if (Array.isArray(response?.data?.notifications)) {
          notifications = response.data.notifications;
        } else if (Array.isArray(response?.notifications)) {
          notifications = response.notifications;
        } else if (Array.isArray(response?.data)) {
          notifications = response.data;
        } else if (Array.isArray(response)) {
          notifications = response;
        }

        const seen = new Map(); // key: taskId-type, value: notification
        const deduped = [];

        for (const notif of notifications) {
          const key = `${notif.task?.id || notif.taskId}-${notif.type}`;

          // If no taskId, keep it (general notifications)
          if (!key.startsWith("null") && !key.startsWith("undefined")) {
            if (!seen.has(key)) {
              seen.set(key, notif);
              deduped.push(notif);
            }
            // Skip duplicates - keep only the first (most recent since they're ordered by createdAt desc)
          } else {
            deduped.push(notif);
          }
        }

        // Recalculate unread count based on deduplicated list is handled by useEffect

        setNotifications(deduped);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        // If it's an authentication error, clear tokens and force re-login
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log(
            "Authentication error - tokens may be expired. Clearing tokens...",
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
    [user, authLoading],
  );

  // Handle real-time notifications - move before useEffect to fix dependency
  const handleRealtimeNotification = useCallback((notification) => {
    setNotifications((prev) => {
      // Check if notification already exists (exact duplicate)
      const existingNotification = prev.find((n) => n.id === notification.id);
      if (existingNotification) {
        return prev; // Return unchanged array if notification already exists
      }

      // Check for existing notifications of the same type for the same task
      // Remove ALL previous notifications for this task/type to ensure no duplicates remain
      const taskId = notification.task?.id || notification.taskId;
      const notificationType = notification.type;

      let updatedNotifications = [...prev];

      if (taskId && notificationType) {
        // Filter out any existing notifications for this task and type
        const filtered = updatedNotifications.filter((n) => {
          const existingTaskId = n.task?.id || n.taskId;
          const shouldRemove =
            existingTaskId === taskId && n.type === notificationType;
          return !shouldRemove;
        });

        updatedNotifications = filtered;
      }

      // Add new notification to the list
      // unreadCount is automatically synced in useEffect
      return [notification, ...updatedNotifications];
    });

    // Show browser notification if permission is granted
    if (Notification.permission === "granted") {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: "/favicon.ico",
        tag: notification.id, // Prevent duplicate notifications
      });

      browserNotification.onclick = function (event) {
        event.preventDefault(); // Prevent the browser from focusing the Notification's target URL instead

        // Bring the browser tab to the front
        window.focus();
        if (window.parent) {
          window.parent.focus();
        }

        const taskId = notification.taskId || notification.task?.id;
        const projectId = notification.projectId || notification.project?.id;

        if (taskId && projectId) {
          // Dispatch custom event for immediate response in open dashboards
          window.dispatchEvent(
            new CustomEvent("openTaskFromNotification", {
              detail: { taskId, projectId },
            }),
          );
        }

        // Close the notification after clicking
        browserNotification.close();
      };
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
          notification.id,
        );
        return prev; // Return unchanged array if notification already exists
      }

      // Check for existing notifications of the same type for the same task
      // Remove ALL previous notifications for this task/type to ensure no duplicates remain
      const taskId = notification.task?.id || notification.taskId;
      const notificationType = notification.type;

      let updatedNotifications = [...prev];

      if (taskId && notificationType) {
        // Filter out any existing notifications for this task and type
        const filtered = updatedNotifications.filter(
          (n) =>
            !(
              (n.task?.id || n.taskId) === taskId && n.type === notificationType
            ),
        );

        // If we removed something, it means we are replacing/updating
        if (filtered.length < updatedNotifications.length) {
          console.log(
            "🔄 Removed existing notification(s) for same task in addNotification to prevent duplicates:",
            taskId,
          );
        }

        updatedNotifications = filtered;
      }

      // Add new notification to the list
      // unreadCount is automatically synced in useEffect
      return [notification, ...updatedNotifications];
    });
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === notificationId ? { ...notif, isRead: true } : notif,
      ),
    );
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isRead: true })),
    );
  }, []);

  // Remove notification
  const removeNotification = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.filter((notif) => notif.id !== notificationId),
    );
  }, []);

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
