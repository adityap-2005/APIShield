/**
 * organizations.js
 *
 * API functions for organizations.
 * Backend routes: POST /organizations, GET /organizations
 */

import axiosInstance from "./axiosInstance";

const organizationsApi = {
  // POST /api/v1/organizations
  // Body: { name, description?, website? }
  // Returns: { success, message, data: organization }
  create: (name, description, website) =>
    axiosInstance.post("/organizations", { name, description, website }),

  // GET /api/v1/organizations
  // Returns: { success, data: [organization] }
  // NOTE: returns the organizations the current user is an active member of
  getAll: () =>
    axiosInstance.get("/organizations"),
};

export default organizationsApi;
