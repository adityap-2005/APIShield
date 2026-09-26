/**
 * gateway.js
 *
 * API functions for APIShield Gateway testing and execution.
 */

import axios from "axios";

const gatewayApi = {
  // Any HTTP method is forwarded through the configured Upstream API.
  call: (organizationId, teamId, upstreamApiId, apiKey, {
    method = "GET",
    queryParams = {},
    body,
  } = {}) => {
    const baseURL = import.meta.env.VITE_API_BASE_URL;
    return axios({
      method,
      url: `${baseURL}/organizations/${organizationId}/teams/${teamId}/gateway/upstream/${upstreamApiId}`,
      params: queryParams,
      data: body,
      headers: {
        "x-api-key": apiKey,
      },
    });
  },
};

export default gatewayApi;
