import axios from "axios";
import logger from "../utils/logger.js";

const API_BASE_URL = "/api/v1";

const AUTH_ENDPOINT_PATHS = [
  "/users/login",
  "/users/register",
  "/users/forgot-password",
  "/users/reset-password",
  "/users/refresh",
  "/users/logout",
];

const toPathname = (url) => {
  if (!url) return "";
  try {
    return new URL(url, "http://local").pathname;
  } catch {
    return String(url).split("?")[0];
  }
};

const isAuthEndpoint = (requestUrl) => {
  const pathname = toPathname(requestUrl);
  const withoutBase = pathname.startsWith(API_BASE_URL)
    ? pathname.slice(API_BASE_URL.length) || "/"
    : pathname;

  const normalized =
    withoutBase.length > 1 ? withoutBase.replace(/\/+$/, "") : withoutBase;
  return AUTH_ENDPOINT_PATHS.some((p) => normalized === p);
};

const getHeaderValue = (headers, name) => {
  if (!headers) return undefined;
  if (typeof headers.get === "function") return headers.get(name);

  const headerKey = Object.keys(headers).find(
    (k) => k.toLowerCase() === name.toLowerCase(),
  );
  return headerKey ? headers[headerKey] : undefined;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle token expiration and refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle both 401 (unauthorized) and 403 (forbidden/expired token)
    const isAuthError =
      error.response?.status === 401 || error.response?.status === 403;

    const requestUrl = originalRequest?.url || "";
    const hasAuthHeader = !!getHeaderValue(
      originalRequest?.headers,
      "Authorization",
    );

    // Never attempt token refresh for auth endpoints (e.g., invalid credentials on /users/login)
    // and only attempt refresh for requests that actually used an access token.
    const shouldAttemptRefresh =
      isAuthError &&
      !!originalRequest &&
      !originalRequest._retry &&
      hasAuthHeader &&
      !isAuthEndpoint(requestUrl);

    if (shouldAttemptRefresh) {
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken =
          localStorage.getItem("refreshToken") ||
          sessionStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        logger.info("🔄 Access token expired, refreshing automatically...");
        const response = await api.post("/users/refresh", { refreshToken });
        const { accessToken } = response.data.data;

        // Update stored access token (keep same storage type)
        const isInLocalStorage = localStorage.getItem("refreshToken");
        if (isInLocalStorage) {
          localStorage.setItem("accessToken", accessToken);
        } else {
          sessionStorage.setItem("accessToken", accessToken);
        }

        logger.info("✅ Token refreshed successfully!");
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        logger.error("❌ Token refresh failed:", refreshError.message);
        processQueue(refreshError, null);

        // Clear all tokens and redirect to login
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("refreshToken");
        sessionStorage.removeItem("user");

        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
