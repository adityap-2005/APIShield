import UpstreamApi from "../models/upstreamApi.model.js";
import Environment from "../models/environment.model.js";
import Integration from "../models/integration.model.js";
import ApiError from "../utils/ApiError.js";

import { encrypt } from "../utils/encryption.js";

import {
    _getOrganizationById
} from "../helpers/organization.helper.js";

import {
    _getActiveMembership,
    _getActiveProjectMembership
} from "../helpers/membership.helper.js";

import {
    _getProjectById
} from "../helpers/project.helper.js";

import {
    ORGANIZATION_ROLES
} from "../constants/organizationRoles.js";

import {
    PROJECT_ROLES
} from "../constants/projectRoles.js";


class UpstreamApiService {

    async createUpstreamApi(
        userId,
        organizationId,
        projectId,
        integrationId,
        environmentId,
        data
    ) {

        const {
            name,
            baseUrl,
            path,
            authentication,
            upstreamCredential
        } = data;

        await _getOrganizationById(
            organizationId
        );

        const membership =
            await _getActiveMembership(
                userId,
                organizationId
            );

        await _getProjectById(
            projectId,
            organizationId
        );

        const projectMembership =
            await _getActiveProjectMembership(
                projectId,
                membership._id
            );

        const isOrgAdmin =
            membership.role === ORGANIZATION_ROLES.OWNER ||
            membership.role === ORGANIZATION_ROLES.ADMIN;

        const isProjectAdmin =
            projectMembership.role === PROJECT_ROLES.PROJECT_ADMIN;

        if (!isOrgAdmin && !isProjectAdmin) {
            throw new ApiError(
                403,
                "You do not have permission to create an upstream API."
            );
        }

        const integration =
            await Integration.findOne({
                _id: integrationId,
                organizationId,
                projectId
            });

        if (!integration) {
            throw new ApiError(
                404,
                "Integration not found."
            );
        }

        const environment =
            await Environment.findOne({
                _id: environmentId,
                integrationId,
                organizationId,
                projectId
            });

        if (!environment) {
            throw new ApiError(
                404,
                "Environment not found."
            );
        }

        if (authentication.type !== "NONE" && !upstreamCredential) {
            throw new ApiError(
                400,
                "Upstream credential is required."
            );
        }

        if (
            authentication?.type === "API_KEY_QUERY" ||
            authentication?.type === "API_KEY_HEADER"
        ) {
            if (!authentication.keyName) {
                throw new ApiError(
                    400,
                    "Authentication key name is required."
                );
            }
        }

        const encryptedCredentialData =
            encrypt(upstreamCredential);

        let upstreamApi;

        try {

            upstreamApi =
                await UpstreamApi.create({
                    organizationId,
                    projectId,
                    integrationId,
                    environmentId,
                    name,
                    baseUrl,
                    path,
                    authentication,

                    encryptedCredential:
                        encryptedCredentialData.encryptedData,

                    encryptionIv:
                        encryptedCredentialData.iv,

                    encryptionAuthTag:
                        encryptedCredentialData.authTag,

                    createdBy: userId
                });

        } catch (error) {

            if (error.code === 11000) {
                throw new ApiError(
                    409,
                    `${name} upstream API already exists in this environment.`
                );
            }

            throw error;
        }

        upstreamApi.encryptedCredential = undefined;
        upstreamApi.encryptionIv = undefined;
        upstreamApi.encryptionAuthTag = undefined;

        return upstreamApi;
    }


    async getUpstreamApis(
        userId,
        organizationId,
        projectId,
        integrationId,
        environmentId
    ) {

        await _getOrganizationById(
            organizationId
        );

        const membership =
            await _getActiveMembership(
                userId,
                organizationId
            );

        await _getProjectById(
            projectId,
            organizationId
        );

        await _getActiveProjectMembership(
            projectId,
            membership._id
        );

        const integration =
            await Integration.findOne({
                _id: integrationId,
                organizationId,
                projectId
            });

        if (!integration) {
            throw new ApiError(
                404,
                "Integration not found."
            );
        }

        const environment =
            await Environment.findOne({
                _id: environmentId,
                integrationId,
                organizationId,
                projectId
            });

        if (!environment) {
            throw new ApiError(
                404,
                "Environment not found."
            );
        }

        const upstreamApis =
            await UpstreamApi.find({
                environmentId,
                integrationId,
                organizationId,
                projectId
            })
                .select(
                    "_id environmentId name baseUrl path status createdAt updatedAt"
                )
                .sort({
                    createdAt: -1
                });

        return upstreamApis;
    }


    async getUpstreamApi(
        userId,
        organizationId,
        projectId,
        integrationId,
        environmentId,
        upstreamApiId
    ) {

        await _getOrganizationById(
            organizationId
        );

        const membership =
            await _getActiveMembership(
                userId,
                organizationId
            );

        await _getProjectById(
            projectId,
            organizationId
        );

        await _getActiveProjectMembership(
            projectId,
            membership._id
        );

        const integration =
            await Integration.findOne({
                _id: integrationId,
                organizationId,
                projectId
            });

        if (!integration) {
            throw new ApiError(
                404,
                "Integration not found."
            );
        }

        const environment =
            await Environment.findOne({
                _id: environmentId,
                integrationId,
                organizationId,
                projectId
            });

        if (!environment) {
            throw new ApiError(
                404,
                "Environment not found."
            );
        }

        const upstreamApi =
            await UpstreamApi.findOne({
                _id: upstreamApiId,
                environmentId,
                integrationId,
                organizationId,
                projectId
            })
                .select(
                    "_id environmentId name baseUrl path authentication status createdAt updatedAt"
                );

        if (!upstreamApi) {
            throw new ApiError(
                404,
                "Upstream API not found."
            );
        }

        return upstreamApi;
    }


    async updateUpstreamApi(
        userId,
        organizationId,
        projectId,
        integrationId,
        environmentId,
        upstreamApiId,
        data
    ) {

        await _getOrganizationById(
            organizationId
        );

        const membership =
            await _getActiveMembership(
                userId,
                organizationId
            );

        await _getProjectById(
            projectId,
            organizationId
        );

        const projectMembership =
            await _getActiveProjectMembership(
                projectId,
                membership._id
            );

        const isOrgAdmin =
            membership.role === ORGANIZATION_ROLES.OWNER ||
            membership.role === ORGANIZATION_ROLES.ADMIN;

        const isProjectAdmin =
            projectMembership.role === PROJECT_ROLES.PROJECT_ADMIN;

        if (!isOrgAdmin && !isProjectAdmin) {
            throw new ApiError(
                403,
                "You do not have permission to update this upstream API."
            );
        }

        const environment =
            await Environment.findOne({
                _id: environmentId,
                integrationId,
                organizationId,
                projectId
            });

        if (!environment) {
            throw new ApiError(
                404,
                "Environment not found."
            );
        }

        const upstreamApi =
            await UpstreamApi.findOne({
                _id: upstreamApiId,
                environmentId,
                integrationId,
                organizationId,
                projectId
            });

        if (!upstreamApi) {
            throw new ApiError(
                404,
                "Upstream API not found."
            );
        }

        const allowedFields = [
            "name",
            "baseUrl",
            "path",
            "authentication",
            "status"
        ];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                upstreamApi[field] = data[field];
            }
        }

        if (data.upstreamCredential !== undefined) {

            if (!data.upstreamCredential) {
                throw new ApiError(
                    400,
                    "Upstream credential cannot be empty."
                );
            }

            const encryptedCredentialData =
                encrypt(
                    data.upstreamCredential
                );

            upstreamApi.encryptedCredential =
                encryptedCredentialData.encryptedData;

            upstreamApi.encryptionIv =
                encryptedCredentialData.iv;

            upstreamApi.encryptionAuthTag =
                encryptedCredentialData.authTag;
        }

        try {

            await upstreamApi.save();

        } catch (error) {

            if (error.code === 11000) {
                throw new ApiError(
                    409,
                    `${upstreamApi.name} upstream API already exists in this environment.`
                );
            }

            throw error;
        }

        upstreamApi.encryptedCredential = undefined;
        upstreamApi.encryptionIv = undefined;
        upstreamApi.encryptionAuthTag = undefined;

        return upstreamApi;
    }

    async callGateway(
        organizationId,
        projectId,
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
            apiKeyContext.projectId.toString() !==
            projectId.toString()
        ) {
            throw new ApiError(
                403,
                "API key does not belong to this project."
            );
        }

        const upstreamApi =
            await UpstreamApi.findOne({
                _id: upstreamApiId,
                organizationId,
                projectId,
                environmentId: apiKeyContext.environmentId
            })
                .select(
                    "+encryptedCredential +encryptionIv +encryptionAuthTag"
                );

        if (!upstreamApi) {
            throw new ApiError(
                404,
                "Upstream API not found."
            );
        }

        if (
            upstreamApi.environmentId.toString() !==
            apiKeyContext.environmentId.toString()
        ) {
            throw new ApiError(
                403,
                "Upstream API does not belong to the API key environment."
            );
        }

        const environment =
            await Environment.findOne({
                _id: apiKeyContext.environmentId,
                organizationId,
                projectId
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
                projectId
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

        const startedAt = Date.now();

        const endpoint =
            requestContext?.endpoint ||
            `${upstreamApi.baseUrl}${upstreamApi.path}`;

        const recordUsage = async (statusCode) => {
            try {
                await usageService.recordUsage({
                    apiKeyId: apiKeyContext.apiKeyId,
                    organizationId,
                    projectId,
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

}

const upstreamApiService =
    new UpstreamApiService();

export default upstreamApiService;