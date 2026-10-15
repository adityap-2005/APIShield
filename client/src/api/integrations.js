/**
 * integrations.js
 *
 * API functions for Integration management.
 * All routes are under:
 * /organizations/:organizationId/projects/:projectId/integrations/...
 */

import axiosInstance from "./axiosInstance";

const integrationsApi = {
  // ── Integrations ───────────────────────────────────────────────────────────

  // POST /api/v1/organizations/:organizationId/projects/:projectId/integrations
  // Body: { name, upstreamApiName, baseUrl, path, upstreamCredential, authentication? }
  // Creates Integration + initial UpstreamApi atomically.
  // Returns: { success: true, message, data: { integration, upstreamApi } }
  create: (organizationId, projectId, data) =>
    axiosInstance.post(`/organizations/${organizationId}/projects/${projectId}/integrations`, data),

  // GET /api/v1/organizations/:organizationId/projects/:projectId/integrations
  // Returns: { success: true, data: [integrationWithUpstreamApis] }
  getAll: (organizationId, projectId) =>
    axiosInstance.get(`/organizations/${organizationId}/projects/${projectId}/integrations`),

  // GET /api/v1/organizations/:organizationId/projects/:projectId/integrations/:integrationId
  // Returns: { success: true, data: { integration, upstreamApis } }
  getById: (organizationId, projectId, integrationId) =>
    axiosInstance.get(`/organizations/${organizationId}/projects/${projectId}/integrations/${integrationId}`),

  // PATCH /api/v1/organizations/:organizationId/projects/:projectId/integrations/:integrationId
  // Body: { name?, status? }
  // Returns: { success: true, message, data: integration }
  update: (organizationId, projectId, integrationId, data) =>
    axiosInstance.patch(`/organizations/${organizationId}/projects/${projectId}/integrations/${integrationId}`, data),

  // PATCH /api/v1/organizations/:organizationId/projects/:projectId/integrations/:integrationId/disable
  // Disables the integration (sets status to DISABLED)
  // Returns: { success: true, message, data: integration }
  disable: (organizationId, projectId, integrationId) =>
    axiosInstance.patch(`/organizations/${organizationId}/projects/${projectId}/integrations/${integrationId}/disable`),

  // Deprecated environment stubs for backward safety
  createEnvironment: () => Promise.resolve({ data: { success: true, data: null } }),
  getEnvironments: () => Promise.resolve({ data: { success: true, data: [] } }),
  getEnvironment: () => Promise.resolve({ data: { success: true, data: null } }),
  updateEnvironment: () => Promise.resolve({ data: { success: true, data: null } }),
  disableEnvironment: () => Promise.resolve({ data: { success: true, data: null } }),
};

export default integrationsApi;
