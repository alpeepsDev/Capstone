import { io } from "socket.io-client";
import logger from "../utils/logger.js";

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentToken = null;
    this.currentProjectId = null;
    this.listeners = new Set();
    this.pendingNotificationCallback = null;
    this.adminUpdateCallbacks = new Set();
  }

  addConnectionListener(callback) {
    this.listeners.add(callback);
    // Immediately call with current status
    callback(this.isConnected);
    return () => this.listeners.delete(callback);
  }

  emitConnectionChange(isConnected) {
    this.isConnected = isConnected;
    this.listeners.forEach((listener) => listener(isConnected));
  }

  connect(token) {
    // If already connected with the same token, don't reconnect
    if (this.socket?.connected && this.currentToken === token) {
      logger.info("🔌 Already connected to WebSocket with same token");
      return this.socket;
    }

    // Disconnect existing connection if any
    if (this.socket) {
      logger.info("🔌 Disconnecting existing WebSocket connection");
      this.socket.disconnect();
    }

    logger.info(
      "🔌 Connecting to WebSocket with token:",
      token ? "Token provided" : "No token",
    );

    this.currentToken = token;

    try {
      this.socket = io(import.meta.env.VITE_API_BASE_URL || undefined, {
        auth: {
          token: token,
        },
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });

      this.socket.on("connect", () => {
        logger.info("✅ Connected to WebSocket server");
        this.emitConnectionChange(true);

        // Rejoin project room if one was selected
        if (this.currentProjectId) {
          logger.info(`🔄 Rejoining project room: ${this.currentProjectId}`);
          this.socket.emit("join-project", this.currentProjectId);
        }

        // Re-register notification listener on reconnect
        if (this.pendingNotificationCallback) {
          this.socket.off("notification", this.pendingNotificationCallback);
          this.socket.on("notification", this.pendingNotificationCallback);
          logger.info("🔔 Re-registered notification handler after reconnect");
        }

        this.adminUpdateCallbacks.forEach((callback) => {
          this.socket.off("admin-update", callback);
          this.socket.on("admin-update", callback);
        });
        if (this.adminUpdateCallbacks.size > 0) {
          logger.info("🛡️ Re-registered admin update handlers after reconnect");
        }
      });

      this.socket.on("disconnect", (reason) => {
        logger.info("❌ Disconnected from WebSocket server:", reason);
        this.emitConnectionChange(false);
      });

      this.socket.on("connect_error", (error) => {
        logger.error("❌ WebSocket connection error:", error.message);
        this.emitConnectionChange(false);

        // If authentication error, handle token refresh
        if (
          error.message.includes("Authentication error") ||
          error.message.includes("Invalid token") ||
          error.message.includes("jwt expired")
        ) {
          logger.info("🔄 WebSocket auth failed - tokens may be expired");

          // Clear expired tokens and redirect to login
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("user");
          sessionStorage.removeItem("accessToken");
          sessionStorage.removeItem("refreshToken");
          sessionStorage.removeItem("user");

          // Redirect to login if not already there
          if (!window.location.pathname.includes("/login")) {
            window.location.href = "/login";
          }
        }
      });

      // NOTE: Do NOT add a socket.on("notification") handler here!
      // Notification handling is done via onNotification() to allow proper
      // callback registration and cleanup. Adding one here would cause
      // duplicate notifications.

      return this.socket;
    } catch (error) {
      logger.error("Failed to connect to WebSocket server:", error);
      return null;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.emitConnectionChange(false);
      this.currentToken = null;
      // Don't clear currentProjectId here, so we can rejoin if reconnected
      logger.info("🔌 WebSocket disconnected");
    }
  }
  joinProject(projectId) {
    this.currentProjectId = projectId;

    if (this.socket?.connected) {
      this.socket.emit("join-project", projectId);
      logger.info(`🏠 Joined project room: ${projectId}`);
    } else {
      logger.info(
        `⏳ Socket not connected, queued join for project: ${projectId}`,
      );
    }
  }

  // Leave project room
  leaveProject(projectId) {
    if (this.currentProjectId === projectId) {
      this.currentProjectId = null;
    }

    if (this.socket?.connected) {
      this.socket.emit("leave-project", projectId);
      logger.info(`🚪 Left project room: ${projectId}`);
    }
  }

  // Subscribe to real-time notifications
  // IMPORTANT: We remove any existing listener first to prevent duplicate
  // registrations which can happen with React StrictMode double-mounting
  onNotification(callback) {
    // Store callback so it can be re-registered on reconnect
    this.pendingNotificationCallback = callback;

    if (this.socket) {
      // First remove any existing listener for this callback to prevent duplicates
      this.socket.off("notification", callback);
      this.socket.on("notification", callback);
      logger.info("🔔 Registered notification handler (duplicates prevented)");
    } else {
      logger.info(
        "🔔 Notification handler stored, will register when socket connects",
      );
    }
  }

  // Unsubscribe from notifications
  offNotification(callback) {
    if (this.socket) {
      this.socket.off("notification", callback);
    }
    // Clear stored callback if it matches
    if (this.pendingNotificationCallback === callback) {
      this.pendingNotificationCallback = null;
    }
  }

  // Admin events
  onAdminUpdate(callback) {
    this.adminUpdateCallbacks.add(callback);

    if (this.socket) {
      this.socket.off("admin-update", callback);
      this.socket.on("admin-update", callback);
      logger.info("🛡️ Registered admin update handler");
    } else {
      logger.info(
        "🛡️ Admin update handler stored, will register when socket connects",
      );
    }
  }

  offAdminUpdate(callback) {
    this.adminUpdateCallbacks.delete(callback);

    if (this.socket) {
      this.socket.off("admin-update", callback);
    }
  }

  // Task events
  onTaskCreated(callback) {
    if (this.socket) this.socket.on("task-created", callback);
  }

  onTaskUpdated(callback) {
    if (this.socket) this.socket.on("task-updated", callback);
  }

  onTaskMoved(callback) {
    if (this.socket) this.socket.on("task-moved", callback);
  }

  onTaskDeleted(callback) {
    if (this.socket) this.socket.on("task-deleted", callback);
  }

  onCommentAdded(callback) {
    if (this.socket) this.socket.on("comment-added", callback);
  }

  offTaskEvents() {
    if (this.socket) {
      this.socket.off("task-created");
      this.socket.off("task-updated");
      this.socket.off("task-moved");
      this.socket.off("task-deleted");
      this.socket.off("comment-added");
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      socketId: this.socket?.id,
    };
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;
