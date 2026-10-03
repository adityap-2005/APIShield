/**
 * gateway.js
 *
 * API functions for APIShield Gateway testing and execution.
 */

import axios from "axios";

const gatewayApi = {
  // Any HTTP method is forwarded through the configured Upstream API.
  call: (organizationId, projectId, upstreamApiId, apiKey, {
    method = "GET",
    queryParams = {},
    body,
    headers = {},
  } = {}) => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || "/api/v1";
    return axios({
      method,
      url: `${baseURL}/organizations/${organizationId}/projects/${projectId}/gateway/upstream/${upstreamApiId}`,
      params: queryParams,
      data: body,
      headers: {
        "x-api-key": apiKey,
        ...headers,
      },
    });
  },
};

export default gatewayApi;
