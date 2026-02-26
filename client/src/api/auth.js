import api from "./index.js";

export const authService = {
  // Storage helper methods
  getStorage(persistent = true) {
    return persistent ? localStorage : sessionStorage;
  },

  setTokens(accessToken, refreshToken, persistent = true) {
    const storage = this.getStorage(persistent);
    const otherStorage = this.getStorage(!persistent);

    // Clear tokens from the other storage type
    otherStorage.removeItem("accessToken");
    otherStorage.removeItem("refreshToken");
    otherStorage.removeItem("user");
    otherStorage.removeItem("persistent");

    // Set tokens in the chosen storage
    storage.setItem("accessToken", accessToken);
    storage.setItem("refreshToken", refreshToken);
    storage.setItem("persistent", persistent.toString());
  },

  setCurrentUser(user, persistent = true) {
    const storage = this.getStorage(persistent);
    storage.setItem("user", JSON.stringify(user));
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
      // Improved error handling
      if (error.response) {
        // Server responded with error status
        const errorData = error.response.data;
        throw errorData || { message: "Login failed" };
      } else if (error.request) {
        // Request was made but no response received
        throw {
          message:
            "Network error. Please check your connection and ensure the server is running.",
        };
      } else {
        // Something else happened
        throw { message: error.message || "Login failed" };
      }
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
          "Invalid refresh response: missing access token or user data"
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
      if (error.response) {
        throw error.response.data || { message: "Failed to fetch profile" };
      } else {
        throw { message: "Failed to fetch profile" };
      }
    }
  },

  async uploadAvatar(formData) {
    try {
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

  logout() {
    // Clear tokens from both storage types
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("persistent");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("persistent");
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
