/**
 * analytics.js
 *
 * API functions for Analytics.
 * Backend route: GET /organizations/:organizationId/analytics
 * Requires OWNER or ADMIN role in the organization.
 */

import axiosInstance from "./axiosInstance";

const analyticsApi = {
  // GET /api/v1/organizations/:organizationId/analytics
  // Returns: {
  //   success: true,
  //   data: {
  //     overview: { totalRequests, successfulRequests, failedRequests, averageResponseTime },
  //     requestsOverTime: [{ date, requests }],
  //     requestsByApiKey: [{ apiKeyId, requests, name, environment }],
  //     requestsByTeam: [{ teamId, requests, name }],
  //     requestsByMethod: [{ method, requests }],
  //     requestsByEnvironment: [{ environment, requests }],
  //     requestsByStatusCode: [{ statusCode, requests }],
  //     topEndpoints: [{ method, endpoint, requests }]
  //   }
  // }
  getAnalytics: (organizationId) =>
    axiosInstance.get(`/organizations/${organizationId}/analytics`),
};

export default analyticsApi;
