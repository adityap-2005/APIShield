/**
 * axiosInstance.js
 *
 * Creates a single axios instance used by ALL frontend API calls.
 *
 * - Sets the base URL from the environment variable (VITE_API_BASE_URL).
 * - withCredentials: true enabled so HTTP-only refresh token cookies are sent.
 * - Automatically attaches the access token to every request.
 * - Handles 401 responses with automatic token refresh queue/retry logic.
 */

import axios from "axios";

// Base URL comes from .env (e.g. VITE_API_BASE_URL=https://apishield-backend-kgh1.onrender.com/api/v1 or http://localhost:5000/api/v1)
const baseURL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// In-memory token reference synced with storage/context
let currentAccessToken = localStorage.getItem("apiShield_token");

export const setStoredAccessToken = (token) => {
  currentAccessToken = token;
  if (token) {
    localStorage.setItem("apiShield_token", token);
  } else {
    localStorage.removeItem("apiShield_token");
  }
};

export const getStoredAccessToken = () => {
  return currentAccessToken || localStorage.getItem("apiShield_token");
};

// ── Refresh management to prevent race conditions & multiple calls ──────────
let refreshPromise = null;

// Auth endpoints where 401 should NOT trigger a refresh loop
const AUTH_BYPASS_URLS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
  "/auth/google",
  "/auth/google/callback",
];

const isAuthBypassUrl = (url = "") => {
  return AUTH_BYPASS_URLS.some((bypassPath) => url.includes(bypassPath));
};

// ── Request interceptor ──────────────────────────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = getStoredAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ─────────────────────────────────────────────────────
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If there is no response or not a 401, reject immediately
    if (!error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // Do not attempt refresh on auth endpoints (login, register, refresh itself)
    if (!originalRequest || isAuthBypassUrl(originalRequest.url)) {
      return Promise.reject(error);
    }

    // Prevent infinite loops on requests that have already been retried
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      // Use existing refresh promise if already in flight, or create a new one
      if (!refreshPromise) {
        refreshPromise = axios
          .post(
            `${baseURL}/auth/refresh`,
            {},
            {
              withCredentials: true,
              headers: { "Content-Type": "application/json" },
            }
          )
          .then((res) => {
            const newAccessToken =
              res.data?.accessToken || res.data?.token || res.data?.data?.accessToken;
            if (!newAccessToken) {
              throw new Error("No access token in refresh response");
            }
            setStoredAccessToken(newAccessToken);
            return newAccessToken;
          })
          .catch((refreshErr) => {
            setStoredAccessToken(null);
            throw refreshErr;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newToken = await refreshPromise;

      // Update authorization header for the retried request
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newToken}`;

      return axiosInstance(originalRequest);
    } catch (refreshError) {
      // Refresh failed: clear credentials and notify
      setStoredAccessToken(null);

      // Only redirect if currently in a protected path to avoid redirect loops on login/register/landing
      const currentPath = window.location.pathname;
      const isPublicPath = ["/", "/login", "/register", "/oauth/callback", "/verify-email"].includes(
        currentPath
      );

      if (!isPublicPath) {
        window.location.href = "/login";
      }

      return Promise.reject(refreshError);
    }
  }
);

export default axiosInstance;
