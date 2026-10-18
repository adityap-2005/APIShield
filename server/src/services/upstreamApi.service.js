import UpstreamApi from "../models/upstreamApi.model.js";
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
        data,
        environmentId = null
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
            upstreamCredential ? encrypt(upstreamCredential) : null;

        let upstreamApi;

        try {

            upstreamApi =
                await UpstreamApi.create({
                    organizationId,
                    projectId,
                    integrationId,
                    ...(environmentId ? { environmentId } : {}),
                    name,
                    baseUrl,
                    path,
                    authentication,

                    encryptedCredential:
                        encryptedCredentialData?.encryptedData,

                    encryptionIv:
                        encryptedCredentialData?.iv,

                    encryptionAuthTag:
                        encryptedCredentialData?.authTag,

                    createdBy: userId
                });

        } catch (error) {

            if (error.code === 11000) {
                throw new ApiError(
                    409,
                    `${name} upstream API already exists in this integration.`
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
        integrationId
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

        const upstreamApis =
            await UpstreamApi.find({
                integrationId,
                organizationId,
                projectId
            })
                .select(
                    "_id integrationId name baseUrl path status lastUsed createdAt updatedAt"
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

        const upstreamApi =
            await UpstreamApi.findOne({
                _id: upstreamApiId,
                integrationId,
                organizationId,
                projectId
            })
                .select(
                    "_id integrationId name baseUrl path authentication status lastUsed createdAt updatedAt"
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

        const upstreamApi =
            await UpstreamApi.findOne({
                _id: upstreamApiId,
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
                    `${upstreamApi.name} upstream API already exists in this integration.`
                );
            }

            throw error;
        }

        upstreamApi.encryptedCredential = undefined;
        upstreamApi.encryptionIv = undefined;
        upstreamApi.encryptionAuthTag = undefined;

        return upstreamApi;
    }

    async deleteUpstreamApi(
        userId,
        organizationId,
        projectId,
        integrationId,
        upstreamApiId
    ) {
        await _getOrganizationById(organizationId);

        const membership = await _getActiveMembership(
            userId,
            organizationId
        );

        await _getProjectById(projectId, organizationId);

        const projectMembership = await _getActiveProjectMembership(
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
                "You do not have permission to delete this upstream API."
            );
        }

        const integration = await Integration.findOne({
            _id: integrationId,
            organizationId,
            projectId
        });

        if (!integration) {
            throw new ApiError(404, "Integration not found.");
        }

        const upstreamApi = await UpstreamApi.findOne({
            _id: upstreamApiId,
            organizationId,
            projectId,
            integrationId
        });

        if (!upstreamApi) {
            throw new ApiError(404, "Upstream API not found.");
        }

        await UpstreamApi.deleteOne({
            _id: upstreamApi._id,
            organizationId,
            projectId,
            integrationId
        });

        return {
            id: upstreamApi._id,
            name: upstreamApi.name,
            deleted: true
        };
    }

}

const upstreamApiService =
    new UpstreamApiService();

export default upstreamApiService;