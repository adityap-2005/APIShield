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
    _getActiveTeamMembership
} from "../helpers/membership.helper.js";

import {
    _getTeamById
} from "../helpers/team.helper.js";

import {
    ORGANIZATION_ROLES
} from "../constants/organizationRoles.js";

import {
    TEAM_ROLES
} from "../constants/teamRoles.js";


class UpstreamApiService {

    async createUpstreamApi(
        userId,
        organizationId,
        teamId,
        integrationId,
        environmentId,
        data
    ) {

        const {
            name,
            baseUrl,
            path,
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

        await _getTeamById(
            teamId,
            organizationId
        );

        const teamMembership =
            await _getActiveTeamMembership(
                teamId,
                membership._id
            );

        const isOrgAdmin =
            membership.role === ORGANIZATION_ROLES.OWNER ||
            membership.role === ORGANIZATION_ROLES.ADMIN;

        const isTeamAdmin =
            teamMembership.role === TEAM_ROLES.TEAM_ADMIN;

        if (!isOrgAdmin && !isTeamAdmin) {
            throw new ApiError(
                403,
                "You do not have permission to create an upstream API."
            );
        }

        const integration =
            await Integration.findOne({
                _id: integrationId,
                organizationId,
                teamId
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
                teamId
            });

        if (!environment) {
            throw new ApiError(
                404,
                "Environment not found."
            );
        }

        if (!upstreamCredential) {
            throw new ApiError(
                400,
                "Upstream credential is required."
            );
        }

        const encryptedCredentialData =
            encrypt(upstreamCredential);

        let upstreamApi;

        try {

            upstreamApi =
                await UpstreamApi.create({
                    organizationId,
                    teamId,
                    integrationId,
                    environmentId,
                    name,
                    baseUrl,
                    path,

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
        teamId,
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

        await _getTeamById(
            teamId,
            organizationId
        );

        await _getActiveTeamMembership(
            teamId,
            membership._id
        );

        const integration =
            await Integration.findOne({
                _id: integrationId,
                organizationId,
                teamId
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
                teamId
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
                teamId
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
        teamId,
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

        await _getTeamById(
            teamId,
            organizationId
        );

        await _getActiveTeamMembership(
            teamId,
            membership._id
        );

        const integration =
            await Integration.findOne({
                _id: integrationId,
                organizationId,
                teamId
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
                teamId
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
                teamId
            })
                .select(
                    "_id environmentId name baseUrl path status createdAt updatedAt"
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
        teamId,
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

        await _getTeamById(
            teamId,
            organizationId
        );

        const teamMembership =
            await _getActiveTeamMembership(
                teamId,
                membership._id
            );

        const isOrgAdmin =
            membership.role === ORGANIZATION_ROLES.OWNER ||
            membership.role === ORGANIZATION_ROLES.ADMIN;

        const isTeamAdmin =
            teamMembership.role === TEAM_ROLES.TEAM_ADMIN;

        if (!isOrgAdmin && !isTeamAdmin) {
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
                teamId
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
                teamId
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
}


const upstreamApiService =
    new UpstreamApiService();

export default upstreamApiService;