import api from "./index.js";
import logger from "../utils/logger.js";

const toServiceError = (
  error,
  fallbackMessage,
  networkMessage = "Network error. Please check your connection and ensure the server is running.",
) => {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    "status" in error &&
    !error.response &&
    !error.request
  ) {
    return error;
  }

  if (error?.response) {
    const data = error.response.data;
    const base = data && typeof data === "object" ? data : {};
    const message =
      base?.message ||
      (typeof data === "string" ? data : undefined) ||
      fallbackMessage;

    return {
      ...base,
      message,
      status: error.response.status,
    };
  }

  if (error?.request) {
    return { message: networkMessage };
  }

  return { message: error?.message || fallbackMessage };
};

export const authService = {
  // Storage helper methods
  getStorage(persistent = true) {
    return persistent ? localStorage : sessionStorage;
  },

  setTokens(accessToken, refreshToken, persistent = true) {
    // Always use localStorage for tokens to ensure multi-tab synchronization
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("persistent", persistent.toString());

    // Clean up sessionStorage to avoid conflicts/stale data
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("persistent");
  },

  setCurrentUser(user, persistent = true) {
    // Always use localStorage for user data for multi-tab sync
    localStorage.setItem("user", JSON.stringify(user));
  },

  isPersistent() {
    const persistentFlag =
      localStorage.getItem("persistent") ||
      sessionStorage.getItem("persistent");
    return persistentFlag === "true";
  },

  async login(credentials) {
    try {
      // Extract rememberMe from credentials
      const { rememberMe = false, ...loginData } = credentials;

      // Real API authentication
      const response = await api.post("/users/login", loginData);

      // Check if response has the expected structure
      if (!response.data || !response.data.data) {
        throw new Error("Invalid server response structure");
      }

      const { accessToken, refreshToken, user } = response.data.data;

      if (!accessToken || !refreshToken || !user) {
        throw new Error("Invalid login response: missing token or user data");
      }

      // Store tokens based on rememberMe preference
      this.setTokens(accessToken, refreshToken, rememberMe);
      this.setCurrentUser(user, rememberMe);

      return response.data;
    } catch (error) {
      throw toServiceError(error, "Login failed");
    }
  },

  async refreshToken() {
    try {
      const refreshToken = this.getRefreshToken();

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await api.post("/users/refresh", { refreshToken });

      if (!response.data || !response.data.data) {
        throw new Error("Invalid refresh response structure");
      }

      const { accessToken, user } = response.data.data;

      if (!accessToken || !user) {
        throw new Error(
          "Invalid refresh response: missing access token or user data",
        );
      }

      // Update stored access token and user (maintain same storage preference)
      const persistent = this.isPersistent();
      const storage = this.getStorage(persistent);

      storage.setItem("accessToken", accessToken);
      storage.setItem("user", JSON.stringify(user));

      return { accessToken, user };
    } catch (error) {
      // If refresh fails, clear all tokens
      this.logout();
      throw error;
    }
  },

  async register(userData) {
    try {
      // Real API registration
      const response = await api.post("/users/register", userData);
      return response.data;
    } catch (error) {
      if (error.response) {
        throw error.response.data || { message: "Registration failed" };
      } else if (error.request) {
        throw { message: "Network error. Please check your connection." };
      } else {
        throw { message: error.message || "Registration failed" };
      }
    }
  },

  async getProfile() {
    try {
      const response = await api.get("/users/profile");
      return response.data;
    } catch (error) {
      throw toServiceError(error, "Failed to fetch profile", "Failed to fetch profile");
    }
  },

  async forgotPassword(email) {
    try {
      const response = await api.post("/users/forgot-password", { email });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw error.response.data || { message: "Failed to send reset email" };
      } else {
        throw { message: "Network error. Please check your connection." };
      }
    }
  },

  async resetPassword(email, otp, newPassword) {
    try {
      const response = await api.post("/users/reset-password", {
        email,
        otp,
        newPassword,
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw error.response.data || { message: "Failed to reset password" };
      } else {
        throw { message: "Network error. Please check your connection." };
      }
    }
  },

  async uploadAvatar(formData) {
    try {
      // Add token to form data to satisfy the new backend requirement
      const token = this.getAccessToken();
      if (token) {
        formData.append("token", token);
      }

      const response = await api.post("/users/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Update local storage with new user data including avatar
      if (response.data && response.data.data) {
        const currentUser = this.getCurrentUser();
        const updatedUser = { ...currentUser, ...response.data.data };
        const persistent = this.isPersistent();
        this.setCurrentUser(updatedUser, persistent);
      }

      return response.data;
    } catch (error) {
      if (error.response) {
        throw error.response.data || { message: "Failed to upload avatar" };
      } else {
        throw { message: "Failed to upload avatar" };
      }
    }
  },

  async logout() {
    try {
      // Notify the backend to invalidate the session/token
      await api.post("/users/logout");
    } catch (error) {
      logger.warn("Backend logout failed, continuing with client-side cleanup", error);
    } finally {
      // Clear tokens from both storage types
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("persistent");
      sessionStorage.removeItem("accessToken");
      sessionStorage.removeItem("refreshToken");
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("persistent");
    }
  },

  getCurrentUser() {
    const userStr =
      localStorage.getItem("user") || sessionStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  getAccessToken() {
    return (
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken")
    );
  },

  getRefreshToken() {
    return (
      localStorage.getItem("refreshToken") ||
      sessionStorage.getItem("refreshToken")
    );
  },

  getToken() {
    // For backward compatibility
    return this.getAccessToken();
  },

  isAuthenticated() {
    return !!this.getAccessToken();
  },
};
