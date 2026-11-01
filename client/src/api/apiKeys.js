import axiosInstance from "./axiosInstance";

const apiKeysApi = {
  // POST /api/v1/organizations/:organizationId/projects/:projectId/api-keys
  // Body: { name, description?, environmentId, scopes?, expiresAt? }
  // environmentId: MongoDB ObjectId string of an Environment belonging to this project
  // scopes: array of scope strings e.g. ["users:read", "projects:read"]
  // Returns: { success, message, data: { apiKey (full secret — show once!), apiKeyDetails } }
  create: (organizationId, projectId, data) =>
    axiosInstance.post(`/organizations/${organizationId}/projects/${projectId}/api-keys`, data),

  // GET /api/v1/organizations/:organizationId/projects/:projectId/api-keys
  // Returns: { success, message, data: [apiKey] }
  // keyHash is excluded from the response
  getAll: (organizationId, projectId) =>
    axiosInstance.get(`/organizations/${organizationId}/projects/${projectId}/api-keys`),

  // GET /api/v1/organizations/:organizationId/projects/:projectId/api-keys/:apiKeyId
  // Returns: { success, message, data: apiKey }
  getById: (organizationId, projectId, apiKeyId) =>
    axiosInstance.get(`/organizations/${organizationId}/projects/${projectId}/api-keys/${apiKeyId}`),

  // PATCH /api/v1/organizations/:organizationId/projects/:projectId/api-keys/:apiKeyId
  // Body: { name?, description?, scopes?, expiresAt? }
  // Note: environment cannot be changed
  // Returns: { success, message, data: apiKey }
  update: (organizationId, projectId, apiKeyId, data) =>
    axiosInstance.patch(`/organizations/${organizationId}/projects/${projectId}/api-keys/${apiKeyId}`, data),

  // POST /api/v1/organizations/:organizationId/projects/:projectId/api-keys/:apiKeyId/rotate
  // Body: none
  // Returns: { success, message, data: { apiKey (new full secret), apiKeyDetails } }
  rotate: (organizationId, projectId, apiKeyId) =>
    axiosInstance.post(`/organizations/${organizationId}/projects/${projectId}/api-keys/${apiKeyId}/rotate`),

  // POST /api/v1/organizations/:organizationId/projects/:projectId/api-keys/:apiKeyId/revoke
  // Body: none
  // Returns: { success, message, data: { apiKeyId, publicKeyId, status: "REVOKED", revokedAt } }
  revoke: (organizationId, projectId, apiKeyId) =>
    axiosInstance.post(`/organizations/${organizationId}/projects/${projectId}/api-keys/${apiKeyId}/revoke`),

  // POST /api/v1/organizations/:organizationId/projects/:projectId/api-keys/:apiKeyId/archive
  // Body: none
  // Key must be REVOKED status first
  // Returns: { success, message, data: { apiKeyId, publicKeyId, status: "ARCHIVED", archivedAt } }
  archive: (organizationId, projectId, apiKeyId) =>
    axiosInstance.post(`/organizations/${organizationId}/projects/${projectId}/api-keys/${apiKeyId}/archive`),
};

export default apiKeysApi;
