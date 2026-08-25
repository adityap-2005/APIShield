import axiosInstance from "./axiosInstance";

const authApi = {
  // POST /api/v1/auth/register
  register: (name, email, password) =>
    axiosInstance.post("/auth/register", { name, email, password }),

  // POST /api/v1/auth/login
  login: (email, password) =>
    axiosInstance.post("/auth/login", { email, password }),

  // GET /api/v1/auth/me
  getProfile: () =>
    axiosInstance.get("/auth/me"),

  // GET /api/v1/auth/verify-email?token=...
  verifyEmail: (token) =>
    axiosInstance.get("/auth/verify-email", { params: { token } }),
};

export default authApi;
