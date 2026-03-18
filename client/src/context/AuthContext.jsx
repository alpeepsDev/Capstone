import React, { createContext, useState, useEffect, useContext } from "react";
import { authService } from "../api/auth.js";
import logger from "../utils/logger.js";

const AuthContext = createContext();

export { AuthContext };

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => authService.getCurrentUser());
  const [loading, setLoading] = useState(() => !authService.getAccessToken());
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = authService.getAccessToken();

        if (accessToken) {
          // If we already have a user from sync state, we can skip showing a full-screen spinner
          // while we verify in the background, making it feel "instant".
          const response = await authService.getProfile();
          if (response && response.success && response.data) {
            setUser(response.data);
            // Sync verified data back to storage
            const persistent = authService.isPersistent();
            authService.setCurrentUser(response.data, persistent);
          } else {
            // Invalid data or structure, clear session
            authService.logout();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        logger.error("Auth initialization failed:", error);
        // If it's an auth error (401/403), log out. Otherwise, keep current state (might be network error)
        const status = error?.status || error?.response?.status;
        if (status === 401 || status === 403) {
          authService.logout();
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };
    initializeAuth();
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    if (!response?.data?.mfaRequired) {
      setUser(response?.data?.user || null);
    }
    return response;
  };

  const verifyMfa = async (email, otp, rememberMe) => {
    const response = await authService.verifyMfa(email, otp, rememberMe);
    setUser(response?.data?.user || null);
    return response;
  };

  const toggleMfa = async (enable) => {
    try {
      const response = await authService.toggleMfa(enable);
      if (response?.success && response?.data) {
        setUser((prev) => {
          const updatedUser = { ...prev, mfaEnabled: response.data.mfaEnabled };
          authService.setCurrentUser(updatedUser);
          logger.info(`MFA toggled to: ${response.data.mfaEnabled}`);
          return updatedUser;
        });
      }
      return response;
    } catch (error) {
      logger.error("Failed to toggle MFA:", error);
      throw error;
    }
  };

  const register = async (userData) => {
    const response = await authService.register(userData);
    return response;
  };

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Listen for storage changes across tabs (e.g., logout/login in another tab)
  useEffect(() => {
    const handleStorageChange = (event) => {
      // If accessToken is removed, it means user logged out in another tab
      if (event.key === "accessToken" && !event.newValue) {
        setUser(null);
        return;
      }
      
      // If accessToken changes (login in another tab), re-verify to stay in sync
      // We ONLY sync tokens, not the 'user' object, to prevent local tampering propagation
      if (event.key === "accessToken" && event.newValue) {
        // Re-run initialization to get fresh, verified data from server
        // This is safe even if called multiple times
        const syncAuth = async () => {
          try {
            const response = await authService.getProfile();
            if (response && response.success && response.data) {
              setUser(response.data);
              authService.setCurrentUser(response.data);
            }
          } catch (err) {
            logger.error("Failed to sync auth in new tab:", err);
            setUser(null);
          }
        };
        syncAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const value = {
    user,
    login,
    verifyMfa,
    toggleMfa,
    register,
    logout,
    loading,
    isLoggingOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthProvider;
