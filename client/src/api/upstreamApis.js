/**
 * upstreamApis.js
 *
 * API functions for Upstream API endpoints management within an Integration.
 * Routes: /organizations/:organizationId/projects/:projectId/integrations/:integrationId/upstream-apis/...
 */

import axiosInstance from "./axiosInstance";

const upstreamApisApi = {
  // POST /api/v1/organizations/:organizationId/projects/:projectId/integrations/:integrationId/upstream-apis
  // Body: { name, baseUrl, path, upstreamCredential, authentication? }
  // Returns: { success: true, data: upstreamApi }
  create: (organizationId, projectId, integrationId, dataOrEnvId, maybeData) => {
    const data = maybeData !== undefined ? maybeData : dataOrEnvId;
    return axiosInstance.post(
      `/organizations/${organizationId}/projects/${projectId}/integrations/${integrationId}/upstream-apis`,
      data
    );
  },

  // GET /api/v1/organizations/:organizationId/projects/:projectId/integrations/:integrationId/upstream-apis
  // Returns: { success: true, data: [upstreamApi] }
  getAll: (organizationId, projectId, integrationId) =>
    axiosInstance.get(
      `/organizations/${organizationId}/projects/${projectId}/integrations/${integrationId}/upstream-apis`
    ),

  // GET /api/v1/organizations/:organizationId/projects/:projectId/integrations/:integrationId/upstream-apis/:upstreamApiId
  // Returns: { success: true, data: upstreamApi }
  getById: (organizationId, projectId, integrationId, upstreamApiIdOrEnvId, maybeUpstreamApiId) => {
    const upstreamApiId = maybeUpstreamApiId !== undefined ? maybeUpstreamApiId : upstreamApiIdOrEnvId;
    return axiosInstance.get(
      `/organizations/${organizationId}/projects/${projectId}/integrations/${integrationId}/upstream-apis/${upstreamApiId}`
    );
  },

  // PATCH /api/v1/organizations/:organizationId/projects/:projectId/integrations/:integrationId/upstream-apis/:upstreamApiId
  // Body: { name?, baseUrl?, path?, status?, upstreamCredential? }
  // Returns: { success: true, data: upstreamApi }
  update: (organizationId, projectId, integrationId, upstreamApiIdOrEnvId, dataOrApiId, maybeData) => {
    let upstreamApiId = upstreamApiIdOrEnvId;
    let data = dataOrApiId;
    if (maybeData !== undefined) {
      upstreamApiId = dataOrApiId;
      data = maybeData;
    }
    return axiosInstance.patch(
      `/organizations/${organizationId}/projects/${projectId}/integrations/${integrationId}/upstream-apis/${upstreamApiId}`,
      data
    );
  },
};

export default upstreamApisApi;
