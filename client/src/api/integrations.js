/**
 * integrations.js
 *
 * API functions for Integration & Environment management.
 * All routes are under:
 * /organizations/:organizationId/projects/:projectId/integrations/...
 * /organizations/:organizationId/projects/:projectId/integrations/:integrationId/environments/...
 */

import axiosInstance from "./axiosInstance";

const integrationsApi = {
  // ── Integrations ───────────────────────────────────────────────────────────

  // POST /api/v1/organizations/:organizationId/projects/:projectId/integrations
  // Body: { name, environment, upstreamApiName, baseUrl, path, upstreamCredential }
  // Creates Integration + Environment + initial UpstreamApi atomically.
  // Returns: { success: true, message, data: { integration, environment, upstreamApi } }
  create: (organizationId, projectId, data) =>
    axiosInstance.post(`/organizations/${organizationId}/projects/${projectId}/integrations`, data),

  // GET /api/v1/organizations/:organizationId/projects/:projectId/integrations
  // Returns: { success: true, data: [integrationWithEnvironmentsAndUpstreamApis] }
  getAll: (organizationId, projectId) =>
    axiosInstance.get(`/organizations/${organizationId}/projects/${projectId}/integrations`),

  // GET /api/v1/organizations/:organizationId/projects/:projectId/integrations/:integrationId
  // Returns: { success: true, data: { integration, environments } }
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

  // ── Environments ───────────────────────────────────────────────────────────

  // POST /api/v1/organizations/:organizationId/projects/:projectId/integrations/:integrationId/environments
  // Body: { name }
  // Returns: { success: true, data: environment }
  createEnvironment: (organizationId, projectId, integrationId, data) =>
    axiosInstance.post(
      `/organizations/${organizationId}/projects/${projectId}/integrations/${integrationId}/environments`,
      data
    ),

  // GET /api/v1/organizations/:organizationId/projects/:projectId/integrations/:integrationId/environments
  // Returns: { success: true, data: [environment] }
  getEnvironments: (organizationId, projectId, integrationId) =>
    axiosInstance.get(
      `/organizations/${organizationId}/projects/${projectId}/integrations/${integrationId}/environments`
    ),

  // GET /api/v1/organizations/:organizationId/projects/:projectId/integrations/:integrationId/environments/:environmentId
  // Returns: { success: true, data: environment }
  getEnvironment: (organizationId, projectId, integrationId, environmentId) =>
    axiosInstance.get(
      `/organizations/${organizationId}/projects/${projectId}/integrations/${integrationId}/environments/${environmentId}`
    ),

  // PATCH /api/v1/organizations/:organizationId/projects/:projectId/integrations/:integrationId/environments/:environmentId
  // Body: { name?, status? }
  // Returns: { success: true, data: environment }
  updateEnvironment: (organizationId, projectId, integrationId, environmentId, data) =>
    axiosInstance.patch(
      `/organizations/${organizationId}/projects/${projectId}/integrations/${integrationId}/environments/${environmentId}`,
      data
    ),

  // PATCH /api/v1/organizations/:organizationId/projects/:projectId/integrations/:integrationId/environments/:environmentId/disable
  // Disables the environment (sets status to DISABLED)
  // Returns: { success: true, data: environment }
  disableEnvironment: (organizationId, projectId, integrationId, environmentId) =>
    axiosInstance.patch(
      `/organizations/${organizationId}/projects/${projectId}/integrations/${integrationId}/environments/${environmentId}/disable`
    ),
};

export default integrationsApi;
