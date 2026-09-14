import axios from "axios";

import Integration from "../models/integration.model.js";

import {
    _getEnvironmentWithCredential
} from "../helpers/environment.helper.js";

import { decrypt } from "../utils/encryption.js";
import ApiError from "../utils/ApiError.js";

class GatewayService {

    async getEnvironmentCredential(
        environmentId,
        organizationId,
        teamId
    ) {
        const environment =
            await _getEnvironmentWithCredential(
                environmentId,
                organizationId,
                teamId
            );

        if (environment.status !== "ACTIVE") {
            throw new ApiError(
                400,
                "Environment is disabled."
            );
        }

        const integration =
            await Integration.findOne({
                _id: environment.integrationId,
                organizationId,
                teamId
            });

        if (!integration) {
            throw new ApiError(
                404,
                "Integration not found."
            );
        }

        if (integration.status !== "ACTIVE") {
            throw new ApiError(
                400,
                "Integration is disabled."
            );
        }

        const credential =
            decrypt(
                environment.encryptedCredential,
                environment.encryptionIv,
                environment.encryptionAuthTag
            );

        return {
            environment,
            integration,
            credential
        };
    }

    async callOpenWeather(
        organizationId,
        teamId,
        city,
        apiKeyContext
    ) {
        if (!city || !city.trim()) {
            throw new ApiError(
                400,
                "City is required."
            );
        }

        if (!apiKeyContext.environmentId) {
            throw new ApiError(
                400,
                "API key is not associated with an environment."
            );
        }

        if (
            apiKeyContext.organizationId.toString() !==
            organizationId.toString()
        ) {
            throw new ApiError(
                403,
                "API key does not belong to this organization."
            );
        }

        if (
            apiKeyContext.teamId.toString() !==
            teamId.toString()
        ) {
            throw new ApiError(
                403,
                "API key does not belong to this team."
            );
        }

        const {
            environment,
            credential
        } = await this.getEnvironmentCredential(
            apiKeyContext.environmentId,
            organizationId,
            teamId
        );

        let response;

        try {
            response = await axios.get(
                `${environment.baseUrl}/data/2.5/weather`,
                {
                    params: {
                        q: city.trim(),
                        appid: credential
                    },
                    timeout: 5000
                }
            );
        } catch (error) {
            if (
                error.code === "ECONNABORTED" ||
                error.code === "ETIMEDOUT"
            ) {
                throw new ApiError(
                    504,
                    "Upstream API request timed out."
                );
            }

            if (error.response) {
                throw new ApiError(
                    502,
                    "Upstream API request failed."
                );
            }

            throw new ApiError(
                502,
                "Unable to reach upstream API."
            );
        }

        return response.data;
    }
}

const gatewayService = new GatewayService();

export default gatewayService;