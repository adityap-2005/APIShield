/**
 * axiosInstance.js
 *
 * Creates a single axios instance used by ALL frontend API calls.
 *
 * - Sets the base URL from the environment variable.
 * - Automatically attaches the JWT token to every request.
 * - Handles 401 responses by clearing the token and redirecting to login.
 */

import axios from "axios";

// Base URL comes from .env (VITE_API_BASE_URL=http://localhost:5000/api/v1)
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor ──────────────────────────────────────────────────────
// Before every request is sent, read the token from localStorage and attach it.
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("apiShield_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor ─────────────────────────────────────────────────────
// If the backend returns 401, the token is invalid/expired.
// Clear it and redirect to login so the user can log in again.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("apiShield_token");
      // Redirect to login page
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
