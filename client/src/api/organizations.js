import axiosInstance from "./axiosInstance";

const organizationsApi = {
  // POST /api/v1/organizations
  // Body: { name, description?, website? }
  create: (name, description, website) =>
    axiosInstance.post("/organizations", { name, description, website }),

  // GET /api/v1/organizations
  getAll: () =>
    axiosInstance.get("/organizations"),

  // PATCH /api/v1/organizations/:organizationId
  // Body: { name?, description?, website? }
  update: (organizationId, data) =>
    axiosInstance.patch(`/organizations/${organizationId}`, data),

  // DELETE /api/v1/organizations/:organizationId
  delete: (organizationId) =>
    axiosInstance.delete(`/organizations/${organizationId}`),
};

export default organizationsApi;
