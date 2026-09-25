import mongoose from "mongoose";
import Integration from "../models/integration.model.js";
import Environment from "../models/environment.model.js";
import ApiError from "../utils/ApiError.js";
import UpstreamApi from "../models/upstreamApi.model.js";
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


class IntegrationService {

    async createIntegration(
        userId,
        organizationId,
        teamId,
        data
    ) {
        const {
            name,
            environment: environmentName,
            upstreamApiName,
            baseUrl,
            path,
            upstreamCredential
        } = data;

        if (!upstreamApiName) {
            throw new ApiError(
                400,
                "Upstream API name is required."
            );
        }

        if (!baseUrl) {
            throw new ApiError(
                400,
                "Upstream API base URL is required."
            );
        }

        if (!path) {
            throw new ApiError(
                400,
                "Upstream API path is required."
            );
        }

        if (!upstreamCredential) {
            throw new ApiError(
                400,
                "Upstream credential is required."
            );
        }

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
                "You do not have permission to create an integration."
            );
        }

        const session = await mongoose.startSession();

        try {
            session.startTransaction();

            let createdIntegration;

            try {
                const integration =
                    await Integration.create(
                        [{
                            organizationId,
                            teamId,
                            name,
                            createdBy: userId
                        }],
                        { session }
                    );

                createdIntegration = integration[0];

            } catch (error) {

                if (error.code === 11000) {
                    throw new ApiError(
                        409,
                        "An integration with this name already exists in this team."
                    );
                }

                throw error;
            }

            const environment =
                await Environment.create(
                    [{
                        organizationId,
                        teamId,
                        integrationId:
                            createdIntegration._id,
                        name: environmentName,
                        createdBy: userId
                    }],
                    { session }
                );

            const createdEnvironment =
                environment[0];

            const encryptedCredentialData =
                encrypt(upstreamCredential);

            let createdUpstreamApi;

            try {

                const upstreamApi =
                    await UpstreamApi.create(
                        [{
                            organizationId,
                            teamId,
                            integrationId:
                                createdIntegration._id,
                            environmentId:
                                createdEnvironment._id,
                            name: upstreamApiName,
                            baseUrl,
                            path,

                            encryptedCredential:
                                encryptedCredentialData.encryptedData,

                            encryptionIv:
                                encryptedCredentialData.iv,

                            encryptionAuthTag:
                                encryptedCredentialData.authTag,

                            createdBy: userId
                        }],
                        { session }
                    );

                createdUpstreamApi =
                    upstreamApi[0];

            } catch (error) {

                if (error.code === 11000) {
                    throw new ApiError(
                        409,
                        `${upstreamApiName} upstream API already exists in this environment.`
                    );
                }

                throw error;
            }

            await session.commitTransaction();

            createdUpstreamApi.encryptedCredential = undefined;
            createdUpstreamApi.encryptionIv = undefined;
            createdUpstreamApi.encryptionAuthTag = undefined;

            return {
                integration: createdIntegration,
                environment: createdEnvironment,
                upstreamApi: createdUpstreamApi
            };

        } catch (error) {

            await session.abortTransaction();

            throw error;

        } finally {

            await session.endSession();
        }
    }

    async getIntegrations(
        userId,
        organizationId,
        teamId
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

        const integrations =
            await Integration.find({
                organizationId,
                teamId
            }).sort({
                createdAt: -1
            });

        const integrationIds =
            integrations.map(
                (integration) => integration._id
            );

        const environments =
            await Environment.find({
                integrationId: {
                    $in: integrationIds
                },
                organizationId,
                teamId
            }).select(
                "_id integrationId name status"
            );

        const environmentIds =
            environments.map(
                (environment) => environment._id
            );

        const upstreamApis =
            await UpstreamApi.find({
                environmentId: {
                    $in: environmentIds
                },
                organizationId,
                teamId
            }).select(
                "_id environmentId name baseUrl path status createdAt updatedAt"
            );

        return integrations.map(
            (integration) => ({
                ...integration.toObject(),

                environments:
                    environments
                        .filter(
                            (environment) =>
                                environment.integrationId.toString() ===
                                integration._id.toString()
                        )
                        .map(
                            (environment) => ({
                                ...environment.toObject(),

                                upstreamApis:
                                    upstreamApis.filter(
                                        (upstreamApi) =>
                                            upstreamApi.environmentId.toString() ===
                                            environment._id.toString()
                                    )
                            })
                        )
            })
        );
    }

    async getIntegration(
        userId,
        organizationId,
        teamId,
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

        const environments =
            await Environment.find({
                integrationId: integration._id,
                organizationId,
                teamId
            }).select(
                "_id integrationId name status"
            );

        const environmentIds =
            environments.map(
                (environment) => environment._id
            );

        const upstreamApis =
            await UpstreamApi.find({
                environmentId: {
                    $in: environmentIds
                },
                organizationId,
                teamId
            }).select(
                "_id environmentId name baseUrl path status createdAt updatedAt"
            );

        return {
            ...integration.toObject(),

            environments:
                environments.map(
                    (environment) => ({
                        ...environment.toObject(),

                        upstreamApis:
                            upstreamApis.filter(
                                (upstreamApi) =>
                                    upstreamApi.environmentId.toString() ===
                                    environment._id.toString()
                            )
                    })
                )
        };
    }

    async updateIntegration(
        userId,
        organizationId,
        teamId,
        integrationId,
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
                "You do not have permission to update this integration."
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

        const allowedFields = [
            "name",
            "status"
        ];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                integration[field] = data[field];
            }
        }

        await integration.save();

        return integration;
    }

    async disableIntegration(
        userId,
        organizationId,
        teamId,
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
                "You do not have permission to disable this integration."
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

        integration.status = "DISABLED";

        await integration.save();

        return integration;
    }
}


const integrationService = new IntegrationService();

export default integrationService;