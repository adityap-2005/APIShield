/**
 * gateway.js
 *
 * API functions for APIShield Gateway testing and execution.
 */

import axios from "axios";

const gatewayApi = {
  // GET /api/v1/organizations/:organizationId/teams/:teamId/gateway/upstream/:upstreamApiId/weather?city=:city
  // Executes proxy request through APIShield gateway to upstream provider (e.g. OpenWeather).
  // Authenticates with x-api-key header.
  callWeather: (organizationId, teamId, upstreamApiId, apiKey, city = "London") => {
    const baseURL = import.meta.env.VITE_API_BASE_URL;
    return axios.get(
      `${baseURL}/organizations/${organizationId}/teams/${teamId}/gateway/upstream/${upstreamApiId}/weather`,
      {
        params: { city },
        headers: {
          "x-api-key": apiKey,
        },
      }
    );
  },
};

export default gatewayApi;
