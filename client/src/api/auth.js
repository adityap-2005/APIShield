/**
 * auth.js
 *
 * API functions for authentication.
 * Backend routes: POST /auth/register, POST /auth/login, GET /auth/me
 */

import axiosInstance from "./axiosInstance";

const authApi = {
  // POST /api/v1/auth/register
  // Body: { name, email, password }
  // Returns: { success, message, data: user }
  register: (name, email, password) =>
    axiosInstance.post("/auth/register", { name, email, password }),

  // POST /api/v1/auth/login
  // Body: { email, password }
  // Returns: { success, message, token, data: user }
  // NOTE: token is at the TOP LEVEL, not inside data
  login: (email, password) =>
    axiosInstance.post("/auth/login", { email, password }),

  // GET /api/v1/auth/me
  // Returns: { success, message, data: user }
  getProfile: () =>
    axiosInstance.get("/auth/me"),
};

export default authApi;
