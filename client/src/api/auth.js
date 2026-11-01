import axiosInstance from "./axiosInstance";

const authApi = {
  // POST /api/v1/auth/register
  register: (name, email, password) =>
    axiosInstance.post("/auth/register", { name, email, password }),

  // POST /api/v1/auth/login
  login: (email, password) =>
    axiosInstance.post("/auth/login", { email, password }),

  // POST /api/v1/auth/refresh
  // Exchanges HTTP-only refreshToken cookie for a new accessToken
  refreshToken: () =>
    axiosInstance.post("/auth/refresh"),

  // POST /api/v1/auth/logout
  // Revokes refreshToken and clears HTTP-only cookie
  logout: () =>
    axiosInstance.post("/auth/logout"),

  // POST /api/v1/auth/logout-all
  // Revokes all refreshTokens for the user
  logoutAll: () =>
    axiosInstance.post("/auth/logout-all"),

  // GET /api/v1/auth/me
  getProfile: () =>
    axiosInstance.get("/auth/me"),

  // GET /api/v1/auth/verify-email?token=...
  verifyEmail: (token) =>
    axiosInstance.get("/auth/verify-email", { params: { token } }),

  // PATCH /api/v1/auth/profile
  updateProfile: (name) =>
    axiosInstance.patch("/auth/profile", { name }),
};

export default authApi;
