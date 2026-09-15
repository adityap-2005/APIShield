import axios from "axios";

import Integration from "../models/integration.model.js";
import Environment from "../models/environment.model.js";

import {
    _getUpstreamApiWithCredential
} from "../helpers/upstreamApi.helper.js";

import { decrypt } from "../utils/encryption.js";
import ApiError from "../utils/ApiError.js";


class GatewayService {

    async getUpstreamApiCredential(
        upstreamApiId,
        organizationId,
        teamId,
        environmentId
    ) {

        const upstreamApi =
            await _getUpstreamApiWithCredential(
                upstreamApiId,
                organizationId,
                teamId,
                environmentId
            );

        const environment =
            await Environment.findOne({
                _id: environmentId,
                organizationId,
                teamId
            });

        if (!environment) {
            throw new ApiError(
                404,
                "Environment not found."
            );
        }

        if (environment.status !== "ACTIVE") {
            throw new ApiError(
                400,
                "Environment is disabled."
            );
        }

        const integration =
            await Integration.findOne({
                _id: upstreamApi.integrationId,
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

        if (upstreamApi.status !== "ACTIVE") {
            throw new ApiError(
                400,
                "Upstream API is disabled."
            );
        }

        const credential =
            decrypt(
                upstreamApi.encryptedCredential,
                upstreamApi.encryptionIv,
                upstreamApi.encryptionAuthTag
            );

        return {
            upstreamApi,
            environment,
            integration,
            credential
        };
    }


    async callOpenWeather(
        organizationId,
        teamId,
        upstreamApiId,
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
            upstreamApi,
            credential
        } = await this.getUpstreamApiCredential(
            upstreamApiId,
            organizationId,
            teamId,
            apiKeyContext.environmentId
        );

        if (
            upstreamApi.environmentId.toString() !==
            apiKeyContext.environmentId.toString()
        ) {
            throw new ApiError(
                403,
                "Upstream API does not belong to the API key environment."
            );
        }

        let response;

        try {

            response =
                await axios.get(
                    `${upstreamApi.baseUrl}${upstreamApi.path}`,
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