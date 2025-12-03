import { io } from "socket.io-client";

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentToken = null;
    this.currentProjectId = null;
    this.listeners = new Set();
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
      console.log("🔌 Already connected to WebSocket with same token");
      return this.socket;
    }

    // Disconnect existing connection if any
    if (this.socket) {
      console.log("🔌 Disconnecting existing WebSocket connection");
      this.socket.disconnect();
    }

    console.log(
      "🔌 Connecting to WebSocket with token:",
      token ? "Token provided" : "No token"
    );

    this.currentToken = token;

    try {
      this.socket = io(
        import.meta.env.VITE_API_BASE_URL || "http://localhost:3001",
        {
          auth: {
            token: token,
          },
          autoConnect: true,
          reconnectionAttempts: 5,
        }
      );

      this.socket.on("connect", () => {
        console.log("✅ Connected to WebSocket server");
        this.emitConnectionChange(true);

        // Rejoin project room if one was selected
        if (this.currentProjectId) {
          console.log(`🔄 Rejoining project room: ${this.currentProjectId}`);
          this.socket.emit("join-project", this.currentProjectId);
        }
      });

      this.socket.on("disconnect", (reason) => {
        console.log("❌ Disconnected from WebSocket server:", reason);
        this.emitConnectionChange(false);
      });

      this.socket.on("connect_error", (error) => {
        console.error("❌ WebSocket connection error:", error.message);
        this.emitConnectionChange(false);

        // If authentication error, handle token refresh
        if (
          error.message.includes("Authentication error") ||
          error.message.includes("Invalid token") ||
          error.message.includes("jwt expired")
        ) {
          console.log("🔄 WebSocket auth failed - tokens may be expired");

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

      this.socket.on("notification", (notification) => {
        console.log("📢 Real-time notification received:", notification);
        // Emit custom event for notification components to listen to
        const event = new CustomEvent("realtimeNotification", {
          detail: notification,
        });
        window.dispatchEvent(event);
        console.log("📢 Dispatched realtimeNotification event");
      });

      return this.socket;
    } catch (error) {
      console.error("Failed to connect to WebSocket server:", error);
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
      console.log("🔌 WebSocket disconnected");
    }
  }
  joinProject(projectId) {
    this.currentProjectId = projectId;

    if (this.socket?.connected) {
      this.socket.emit("join-project", projectId);
      console.log(`🏠 Joined project room: ${projectId}`);
    } else {
      console.log(
        `⏳ Socket not connected, queued join for project: ${projectId}`
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
      console.log(`🚪 Left project room: ${projectId}`);
    }
  }

  // Subscribe to real-time notifications
  onNotification(callback) {
    if (this.socket) {
      this.socket.on("notification", callback);
    }
  }

  // Unsubscribe from notifications
  offNotification(callback) {
    if (this.socket) {
      this.socket.off("notification", callback);
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
