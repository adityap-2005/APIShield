import axios from "axios";

import Integration from "../models/integration.model.js";
import Environment from "../models/environment.model.js";

import {
    _getUpstreamApiWithCredential
} from "../helpers/upstreamApi.helper.js";

import { decrypt } from "../utils/encryption.js";
import ApiError from "../utils/ApiError.js";
import usageService from "./usage.service.js";


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

    async callGateway(
        organizationId,
        teamId,
        upstreamApiId,
        apiKeyContext,
        requestContext
    ) {
        if (!apiKeyContext?.environmentId) {
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
    
        const startedAt = Date.now();
    
        const endpoint =
            requestContext?.endpoint ||
            `${upstreamApi.baseUrl}${upstreamApi.path}`;
    
        const recordUsage = async (statusCode) => {
            try {
                await usageService.recordUsage({
                    apiKeyId: apiKeyContext.apiKeyId,
                    organizationId,
                    teamId,
                    environmentId: apiKeyContext.environmentId,
                    upstreamApiId: upstreamApi._id,
                    method: requestContext?.method || "GET",
                    endpoint,
                    statusCode,
                    responseTime: Date.now() - startedAt
                });
            } catch (usageError) {
                console.error(
                    "Failed to record gateway API usage."
                );
            }
        };
    
        try {
            const response =
                await this.callUpstreamApi({
                    upstreamApi,
                    credential,
                    method: requestContext?.method || "GET",
                    queryParams:
                        requestContext?.queryParams || {},
                    body:
                        requestContext?.body
                });
    
            await recordUsage(response.status);
    
            return {
                data: response.data,
                statusCode: response.status
            };
    
        } catch (error) {

            if (axios.isAxiosError(error)) {
                console.error("Gateway upstream error:", {
                    code: error.code,
                    status: error.response?.status,
                    data: error.response?.data,
                    message: error.message
                });
            }
    
            const statusCode =
                error.response?.status ||
                (
                    error.code === "ECONNABORTED" ||
                    error.code === "ETIMEDOUT"
                        ? 504
                        : 502
                );
    
            await recordUsage(statusCode);
    
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
    }

    async callUpstreamApi({
        upstreamApi,
        credential,
        method = "GET",
        queryParams = {},
        body
    }) {
        const config = {
            method,
            url: `${upstreamApi.baseUrl}${upstreamApi.path}`,
            timeout: 5000,
            params: {
                ...queryParams
            }
        };
    
        const authentication =
            upstreamApi.authentication || {};
    
        if (authentication.type === "API_KEY_QUERY") {
            config.params[authentication.keyName] = credential;
        }
    
        if (authentication.type === "API_KEY_HEADER") {
            config.headers = {
                [authentication.keyName]: credential
            };
        }
    
        if (authentication.type === "BEARER_TOKEN") {
            config.headers = {
                Authorization: `Bearer ${credential}`
            };
        }
    
        if (body !== undefined) {
            config.data = body;
        }
    
        return axios(config);
    }
}

const gatewayService = new GatewayService();

export default gatewayService;