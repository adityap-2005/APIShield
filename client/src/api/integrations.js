/**
 * integrations.js
 *
 * API functions for Integration & Environment management.
 * All routes are under:
 * /organizations/:organizationId/teams/:teamId/integrations/...
 * /organizations/:organizationId/teams/:teamId/integrations/:integrationId/environments/...
 */

import axiosInstance from "./axiosInstance";

const integrationsApi = {
  // ── Integrations ───────────────────────────────────────────────────────────

  // POST /api/v1/organizations/:organizationId/teams/:teamId/integrations
  // Body: { name, environment, upstreamApiName, baseUrl, path, upstreamCredential }
  // Creates Integration + Environment + initial UpstreamApi atomically.
  // Returns: { success: true, message, data: { integration, environment, upstreamApi } }
  create: (organizationId, teamId, data) =>
    axiosInstance.post(`/organizations/${organizationId}/teams/${teamId}/integrations`, data),

  // GET /api/v1/organizations/:organizationId/teams/:teamId/integrations
  // Returns: { success: true, data: [integrationWithEnvironmentsAndUpstreamApis] }
  getAll: (organizationId, teamId) =>
    axiosInstance.get(`/organizations/${organizationId}/teams/${teamId}/integrations`),

  // GET /api/v1/organizations/:organizationId/teams/:teamId/integrations/:integrationId
  // Returns: { success: true, data: { integration, environments } }
  getById: (organizationId, teamId, integrationId) =>
    axiosInstance.get(`/organizations/${organizationId}/teams/${teamId}/integrations/${integrationId}`),

  // PATCH /api/v1/organizations/:organizationId/teams/:teamId/integrations/:integrationId
  // Body: { name?, status? }
  // Returns: { success: true, message, data: integration }
  update: (organizationId, teamId, integrationId, data) =>
    axiosInstance.patch(`/organizations/${organizationId}/teams/${teamId}/integrations/${integrationId}`, data),

  // PATCH /api/v1/organizations/:organizationId/teams/:teamId/integrations/:integrationId/disable
  // Disables the integration (sets status to DISABLED)
  // Returns: { success: true, message, data: integration }
  disable: (organizationId, teamId, integrationId) =>
    axiosInstance.patch(`/organizations/${organizationId}/teams/${teamId}/integrations/${integrationId}/disable`),

  // ── Environments ───────────────────────────────────────────────────────────

  // POST /api/v1/organizations/:organizationId/teams/:teamId/integrations/:integrationId/environments
  // Body: { name }
  // Returns: { success: true, data: environment }
  createEnvironment: (organizationId, teamId, integrationId, data) =>
    axiosInstance.post(
      `/organizations/${organizationId}/teams/${teamId}/integrations/${integrationId}/environments`,
      data
    ),

  // GET /api/v1/organizations/:organizationId/teams/:teamId/integrations/:integrationId/environments
  // Returns: { success: true, data: [environment] }
  getEnvironments: (organizationId, teamId, integrationId) =>
    axiosInstance.get(
      `/organizations/${organizationId}/teams/${teamId}/integrations/${integrationId}/environments`
    ),

  // GET /api/v1/organizations/:organizationId/teams/:teamId/integrations/:integrationId/environments/:environmentId
  // Returns: { success: true, data: environment }
  getEnvironment: (organizationId, teamId, integrationId, environmentId) =>
    axiosInstance.get(
      `/organizations/${organizationId}/teams/${teamId}/integrations/${integrationId}/environments/${environmentId}`
    ),

  // PATCH /api/v1/organizations/:organizationId/teams/:teamId/integrations/:integrationId/environments/:environmentId
  // Body: { name?, status? }
  // Returns: { success: true, data: environment }
  updateEnvironment: (organizationId, teamId, integrationId, environmentId, data) =>
    axiosInstance.patch(
      `/organizations/${organizationId}/teams/${teamId}/integrations/${integrationId}/environments/${environmentId}`,
      data
    ),

  // PATCH /api/v1/organizations/:organizationId/teams/:teamId/integrations/:integrationId/environments/:environmentId/disable
  // Disables the environment (sets status to DISABLED)
  // Returns: { success: true, data: environment }
  disableEnvironment: (organizationId, teamId, integrationId, environmentId) =>
    axiosInstance.patch(
      `/organizations/${organizationId}/teams/${teamId}/integrations/${integrationId}/environments/${environmentId}/disable`
    ),
};

export default integrationsApi;
