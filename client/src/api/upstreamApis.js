/**
 * upstreamApis.js
 *
 * API functions for Upstream API endpoints management within an Environment.
 * Routes: /organizations/:organizationId/projects/:projectId/integrations/:integrationId/environments/:environmentId/upstream-apis/...
 */

import axiosInstance from "./axiosInstance";

const upstreamApisApi = {
  // POST /api/v1/organizations/:organizationId/projects/:projectId/integrations/:integrationId/environments/:environmentId/upstream-apis
  // Body: { name, baseUrl, path, upstreamCredential }
  // Returns: { success: true, data: upstreamApi }
  create: (organizationId, projectId, integrationId, environmentId, data) =>
    axiosInstance.post(
      `/organizations/${organizationId}/projects/${projectId}/integrations/${integrationId}/environments/${environmentId}/upstream-apis`,
      data
    ),

  // GET /api/v1/organizations/:organizationId/projects/:projectId/integrations/:integrationId/environments/:environmentId/upstream-apis
  // Returns: { success: true, data: [upstreamApi] }
  getAll: (organizationId, projectId, integrationId, environmentId) =>
    axiosInstance.get(
      `/organizations/${organizationId}/projects/${projectId}/integrations/${integrationId}/environments/${environmentId}/upstream-apis`
    ),

  // GET /api/v1/organizations/:organizationId/projects/:projectId/integrations/:integrationId/environments/:environmentId/upstream-apis/:upstreamApiId
  // Returns: { success: true, data: upstreamApi }
  getById: (organizationId, projectId, integrationId, environmentId, upstreamApiId) =>
    axiosInstance.get(
      `/organizations/${organizationId}/projects/${projectId}/integrations/${integrationId}/environments/${environmentId}/upstream-apis/${upstreamApiId}`
    ),

  // PATCH /api/v1/organizations/:organizationId/projects/:projectId/integrations/:integrationId/environments/:environmentId/upstream-apis/:upstreamApiId
  // Body: { name?, baseUrl?, path?, status?, upstreamCredential? }
  // Returns: { success: true, data: upstreamApi }
  update: (organizationId, projectId, integrationId, environmentId, upstreamApiId, data) =>
    axiosInstance.patch(
      `/organizations/${organizationId}/projects/${projectId}/integrations/${integrationId}/environments/${environmentId}/upstream-apis/${upstreamApiId}`,
      data
    ),
};

export default upstreamApisApi;
