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


class EnvironmentService {

    async createEnvironment(
        userId,
        organizationId,
        teamId,
        integrationId,
        data
    ) {

        const {
            name,
            baseUrl,
            upstreamCredential
        } = data;

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
                "You do not have permission to create an environment."
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

        const encryptedCredentialData =
            encrypt(upstreamCredential);

        let environment;

        try {
            const createdEnvironment =
                await Environment.create({
                    organizationId,
                    teamId,
                    integrationId,
                    name,
                    baseUrl,

                    encryptedCredential:
                        encryptedCredentialData.encryptedData,

                    encryptionIv:
                        encryptedCredentialData.iv,

                    encryptionAuthTag:
                        encryptedCredentialData.authTag,

                    createdBy: userId
                });

            environment = createdEnvironment;

        } catch (error) {

            if (error.code === 11000) {
                throw new ApiError(
                    409,
                    `${name} environment already exists for this integration.`
                );
            }

            throw error;
        }

        environment.encryptedCredential = undefined;
        environment.encryptionIv = undefined;
        environment.encryptionAuthTag = undefined;

        return environment;
    }

    async getEnvironments(
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
                integrationId,
                organizationId,
                teamId
            })
                .select(
                    "_id integrationId name baseUrl status createdAt updatedAt"
                )
                .sort({
                    createdAt: -1
                });

        return environments;
    }

    async getEnvironment(
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
            }).select(
                "_id integrationId name baseUrl status createdAt updatedAt"
            );

        if (!environment) {
            throw new ApiError(
                404,
                "Environment not found."
            );
        }

        return environment;
    }

    async updateEnvironment(
        userId,
        organizationId,
        teamId,
        integrationId,
        environmentId,
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
                "You do not have permission to update this environment."
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

        const allowedFields = [
            "name",
            "baseUrl",
            "status"
        ];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                environment[field] = data[field];
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
                encrypt(data.upstreamCredential);

            environment.encryptedCredential =
                encryptedCredentialData.encryptedData;

            environment.encryptionIv =
                encryptedCredentialData.iv;

            environment.encryptionAuthTag =
                encryptedCredentialData.authTag;
        }

        try {
            await environment.save();
        } catch (error) {
        
            if (error.code === 11000) {
                throw new ApiError(
                    409,
                    `${environment.name} environment already exists for this integration.`
                );
            }
        
            throw error;
        }
        
        environment.encryptedCredential = undefined;
        environment.encryptionIv = undefined;
        environment.encryptionAuthTag = undefined;
        
        return environment;
    }

    async disableEnvironment(
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
                "You do not have permission to disable this environment."
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

        environment.status = "DISABLED";

        await environment.save();

        return environment;
    }
}

const environmentService = new EnvironmentService();

export default environmentService;