/**
 * apiKeys.js
 *
 * API functions for API key management.
 * All routes are under /organizations/:organizationId/teams/:teamId/api-keys
 *
 * Authorization: TEAM_ADMIN role required for all operations.
 */

import axiosInstance from "./axiosInstance";

const apiKeysApi = {
  // POST /api/v1/organizations/:organizationId/teams/:teamId/api-keys
  // Body: { name, description?, environmentId, scopes?, expiresAt? }
  // environmentId: MongoDB ObjectId string of an Environment belonging to this team
  // scopes: array of scope strings e.g. ["users:read", "teams:read"]
  // Returns: { success, message, data: { apiKey (full secret — show once!), apiKeyDetails } }
  create: (organizationId, teamId, data) =>
    axiosInstance.post(`/organizations/${organizationId}/teams/${teamId}/api-keys`, data),

  // GET /api/v1/organizations/:organizationId/teams/:teamId/api-keys
  // Returns: { success, message, data: [apiKey] }
  // keyHash is excluded from the response
  getAll: (organizationId, teamId) =>
    axiosInstance.get(`/organizations/${organizationId}/teams/${teamId}/api-keys`),

  // GET /api/v1/organizations/:organizationId/teams/:teamId/api-keys/:apiKeyId
  // Returns: { success, message, data: apiKey }
  getById: (organizationId, teamId, apiKeyId) =>
    axiosInstance.get(`/organizations/${organizationId}/teams/${teamId}/api-keys/${apiKeyId}`),

  // PATCH /api/v1/organizations/:organizationId/teams/:teamId/api-keys/:apiKeyId
  // Body: { name?, description?, scopes?, expiresAt? }
  // Note: environment cannot be changed
  // Returns: { success, message, data: apiKey }
  update: (organizationId, teamId, apiKeyId, data) =>
    axiosInstance.patch(`/organizations/${organizationId}/teams/${teamId}/api-keys/${apiKeyId}`, data),

  // POST /api/v1/organizations/:organizationId/teams/:teamId/api-keys/:apiKeyId/rotate
  // Body: none
  // Returns: { success, message, data: { apiKey (new full secret), apiKeyDetails } }
  rotate: (organizationId, teamId, apiKeyId) =>
    axiosInstance.post(`/organizations/${organizationId}/teams/${teamId}/api-keys/${apiKeyId}/rotate`),

  // POST /api/v1/organizations/:organizationId/teams/:teamId/api-keys/:apiKeyId/revoke
  // Body: none
  // Returns: { success, message, data: { apiKeyId, publicKeyId, status: "REVOKED", revokedAt } }
  revoke: (organizationId, teamId, apiKeyId) =>
    axiosInstance.post(`/organizations/${organizationId}/teams/${teamId}/api-keys/${apiKeyId}/revoke`),

  // POST /api/v1/organizations/:organizationId/teams/:teamId/api-keys/:apiKeyId/archive
  // Body: none
  // Key must be REVOKED status first
  // Returns: { success, message, data: { apiKeyId, publicKeyId, status: "ARCHIVED", archivedAt } }
  archive: (organizationId, teamId, apiKeyId) =>
    axiosInstance.post(`/organizations/${organizationId}/teams/${teamId}/api-keys/${apiKeyId}/archive`),
};

export default apiKeysApi;
