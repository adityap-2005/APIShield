import ApiKey from "../models/apiKey.model.js";
import Team from "../models/team.model.js";
import Organization from "../models/organization.model.js";
import Membership from "../models/membership.model.js";
import TeamMembership from "../models/teamMembership.model.js";
import AuditLog from "../models/auditLog.model.js";
import User from "../models/user.model.js";

import auditLogService from "./auditLog.service.js";

import ApiError from "../utils/ApiError.js";
import { generateApiKey } from "../utils/apiKey.util.js";

import { TEAM_ROLES } from "../constants/teamRoles.js";
import { MEMBERSHIP_STATUS } from "../constants/membershipStatus.js";
import { API_KEY_STATUS } from "../constants/apiKey.js";
import { AUDIT_ACTIONS } from "../constants/auditActions.js";
import { AUDIT_ENTITY_TYPES } from "../constants/auditEntityTypes.js";

class ApiKeyService {

    async createApiKey(
        organizationId,
        teamId,
        userId,
        apiKeyData
    ) {

        const {
            name,
            description,
            environment,
            scopes,
            expiresAt
        } = apiKeyData;

        // Check Active Organization Membership

        await this._getOrganizationById(
            organizationId
        );

        const organizationMembership =
            await this._getActiveMembership(
                userId,
                organizationId
            );

        // Check Team Exists
        const team = await Team.findOne({
            _id: teamId,
            organizationId,
        });

        if (!team) {
            throw new ApiError(
                404,
                "Team not found."
            );
        }

        // Check Active Team Membership
        const teamMembership =
            await this._getActiveTeamMembership(
                teamId,
                organizationMembership._id
            );

        // Authorization
        this._authorizeApiKeyManagement(
            teamMembership
        );

        // Expiration Validation
        if (
            expiresAt &&
            new Date(expiresAt) <= new Date()
        ) {
            throw new ApiError(
                400,
                "Expiration date must be in the future."
            );
        }

        // Generate API Key
        const {
            apiKey,
            publicKeyId,
            keyHash
        } = generateApiKey(environment);

        // Save API Key
        const createdApiKey =
            await ApiKey.create({

                organizationId,

                teamId,

                name,

                description,

                environment,

                scopes,

                expiresAt,

                publicKeyId,

                keyHash,

                createdBy: userId
            });

        const actor =
            await auditLogService.getActor(userId);

        await auditLogService.log({
            organizationId,
            teamId,

            actor,

            action: AUDIT_ACTIONS.API_KEY_CREATED,

            entity: {
                id: createdApiKey._id,
                type: AUDIT_ENTITY_TYPES.API_KEY,
                name: createdApiKey.name
            },

            metadata: {
                environment: createdApiKey.environment
            }
        });

        return {

            apiKey,

            apiKeyDetails: createdApiKey

        };
    }

    async getTeamApiKeys(
        organizationId,
        teamId,
        userId
    ) {
        const organizationMembership =
            await this._getActiveMembership(
                userId,
                organizationId
            );

        const teamMembership =
            await this._getActiveTeamMembership(
                teamId,
                organizationMembership._id
            );

        this._authorizeApiKeyManagement(
            teamMembership
        );

        const apiKeys = await ApiKey.find({
            organizationId,
            teamId
        })
            .sort({ createdAt: -1 });

        return apiKeys;
    }

    _authorizeApiKeyManagement(
        teamMembership
    ) {

        if (
            teamMembership.role !==
            TEAM_ROLES.TEAM_ADMIN
        ) {
            throw new ApiError(
                403,
                "Only Team Admin can manage API Keys."
            );
        }

    }

    async getApiKeyById(
        organizationId,
        teamId,
        apiKeyId,
        userId
    ) {
        const organizationMembership =
            await this._getActiveMembership(
                userId,
                organizationId
            );

        const teamMembership =
            await this._getActiveTeamMembership(
                teamId,
                organizationMembership._id
            );

        this._authorizeApiKeyManagement(
            teamMembership
        );

        const apiKey =
            await this._getApiKeyById(
                apiKeyId,
                teamId,
                organizationId
            );

        return apiKey;
    }

    async updateApiKey(
        organizationId,
        teamId,
        apiKeyId,
        userId,
        apiKeyData
    ) {
        const {
            name,
            description,
            scopes,
            expiresAt
        } = apiKeyData;

        const organizationMembership =
            await this._getActiveMembership(
                userId,
                organizationId
            );

        const teamMembership =
            await this._getActiveTeamMembership(
                teamId,
                organizationMembership._id
            );

        this._authorizeApiKeyManagement(
            teamMembership
        );

        const apiKey =
            await this._getApiKeyById(
                apiKeyId,
                teamId,
                organizationId
            );

        if (
            expiresAt &&
            new Date(expiresAt) <= new Date()
        ) {
            throw new ApiError(
                400,
                "Expiration date must be in the future."
            );
        }

        const previousValues = {
            name: apiKey.name,
            description: apiKey.description,
            scopes: [...apiKey.scopes],
            expiresAt: apiKey.expiresAt
        };

        if (name !== undefined) {
            apiKey.name = name;
        }

        if (description !== undefined) {
            apiKey.description = description;
        }

        if (scopes !== undefined) {
            apiKey.scopes = scopes;
        }

        if (expiresAt !== undefined) {
            apiKey.expiresAt = expiresAt;
        }

        await apiKey.save();

        const actor =
            await auditLogService.getActor(userId);

        await auditLogService.log({
            organizationId,
            teamId,

            actor,

            action: AUDIT_ACTIONS.API_KEY_UPDATED,

            entity: {
                id: apiKey._id,
                type: AUDIT_ENTITY_TYPES.API_KEY,
                name: apiKey.name
            },

            metadata: {
                previousValues,
                updatedValues: {
                    name: apiKey.name,
                    description: apiKey.description,
                    scopes: apiKey.scopes,
                    expiresAt: apiKey.expiresAt
                }
            }
        });

        return apiKey;
    }

    async rotateApiKey(
        organizationId,
        teamId,
        apiKeyId,
        userId
    ) {
        const organizationMembership =
            await this._getActiveMembership(
                userId,
                organizationId
            );

        const teamMembership =
            await this._getActiveTeamMembership(
                teamId,
                organizationMembership._id
            );

        this._authorizeApiKeyManagement(
            teamMembership
        );

        const apiKey =
            await this._getApiKeyById(
                apiKeyId,
                teamId,
                organizationId
            );

        if (apiKey.status === API_KEY_STATUS.REVOKED) {
            throw new ApiError(
                400,
                "Revoked API key cannot be rotated."
            );
        }

        if (
            apiKey.expiresAt &&
            apiKey.expiresAt <= new Date()
        ) {
            throw new ApiError(
                400,
                "Expired API key cannot be rotated."
            );
        }

        const {
            apiKey: newPlainApiKey,
            publicKeyId,
            keyHash
        } = generateApiKey(
            apiKey.environment
        );

        apiKey.publicKeyId = publicKeyId;
        apiKey.keyHash = keyHash;

        await apiKey.save();

        const actor =
            await auditLogService.getActor(userId);

        await auditLogService.log({
            organizationId,
            teamId,

            actor,

            action: AUDIT_ACTIONS.API_KEY_ROTATED,

            entity: {
                id: apiKey._id,
                type: AUDIT_ENTITY_TYPES.API_KEY,
                name: apiKey.name
            },

            metadata: {
                environment: apiKey.environment,
                publicKeyId: apiKey.publicKeyId
            }
        });

        return {
            apiKey: newPlainApiKey,
            apiKeyDetails: apiKey
        };
    }

    async revokeApiKey(
        organizationId,
        teamId,
        apiKeyId,
        userId
    ) {
        const organizationMembership =
            await this._getActiveMembership(
                userId,
                organizationId
            );

        const teamMembership =
            await this._getActiveTeamMembership(
                teamId,
                organizationMembership._id
            );

        this._authorizeApiKeyManagement(
            teamMembership
        );

        const apiKey =
            await this._getApiKeyById(
                apiKeyId,
                teamId,
                organizationId
            );

        if (
            apiKey.status === API_KEY_STATUS.REVOKED
        ) {
            throw new ApiError(
                400,
                "API key is already revoked."
            );
        }

        apiKey.status = API_KEY_STATUS.REVOKED;
        apiKey.revokedAt = new Date();
        apiKey.revokedBy = userId;

        await apiKey.save();

        const actor =
            await auditLogService.getActor(userId);

        await auditLogService.log({
            organizationId,
            teamId,

            actor,

            action: AUDIT_ACTIONS.API_KEY_REVOKED,

            entity: {
                id: apiKey._id,
                type: AUDIT_ENTITY_TYPES.API_KEY,
                name: apiKey.name
            },

            metadata: {
                environment: apiKey.environment,
                publicKeyId: apiKey.publicKeyId
            }
        });

        return {
            apiKeyId: apiKey._id,
            publicKeyId: apiKey.publicKeyId,
            status: apiKey.status,
            revokedAt: apiKey.revokedAt
        };
    }

    async archiveApiKey(
        organizationId,
        teamId,
        apiKeyId,
        userId
    ) {
        const organizationMembership =
            await this._getActiveMembership(
                userId,
                organizationId
            );

        const teamMembership =
            await this._getActiveTeamMembership(
                teamId,
                organizationMembership._id
            );

        this._authorizeApiKeyManagement(
            teamMembership
        );

        const apiKey =
            await this._getApiKeyById(
                apiKeyId,
                teamId,
                organizationId
            );

        if (
            apiKey.status === API_KEY_STATUS.ARCHIVED
        ) {
            throw new ApiError(
                400,
                "API key is already archived."
            );
        }

        if (
            apiKey.status !== API_KEY_STATUS.REVOKED
        ) {
            throw new ApiError(
                400,
                "API key must be revoked before it can be archived."
            );
        }

        apiKey.status = API_KEY_STATUS.ARCHIVED;
        apiKey.archivedAt = new Date();
        apiKey.archivedBy = userId;

        await apiKey.save();

        const actor =
            await auditLogService.getActor(userId);

        await auditLogService.log({
            organizationId,
            teamId,

            actor,

            action: AUDIT_ACTIONS.API_KEY_ARCHIVED,

            entity: {
                id: apiKey._id,
                type: AUDIT_ENTITY_TYPES.API_KEY,
                name: apiKey.name
            },

            metadata: {
                environment: apiKey.environment,
                publicKeyId: apiKey.publicKeyId
            }
        });

        return {
            apiKeyId: apiKey._id,
            publicKeyId: apiKey.publicKeyId,
            status: apiKey.status,
            archivedAt: apiKey.archivedAt
        };
    }

    async _getActiveMembership(userId, organizationId) {

        await this._validateOrganization(
            organizationId
        );

        const membership = await Membership.findOne({
            userId,
            organizationId,
            status: MEMBERSHIP_STATUS.ACTIVE
        });

        if (!membership) {
            throw new ApiError(
                403,
                "You are not an active member of this organization."
            );
        }

        return membership;
    }

    async _getTeamMembership(teamId, membershipId) {
        const teamMembership = await TeamMembership.findOne({
            teamId,
            membershipId,
        });

        if (!teamMembership) {
            throw new ApiError(404, "Team membership not found.");
        }

        return teamMembership;
    }

    async _getApiKeyById(
        apiKeyId,
        teamId,
        organizationId
    ) {
        const apiKey = await ApiKey.findOne({
            _id: apiKeyId,
            teamId,
            organizationId
        });

        if (!apiKey) {
            throw new ApiError(
                404,
                "API key not found."
            );
        }

        return apiKey;
    }

    async _validateOrganization(organizationId) {

        const organization = await Organization.findById(
            organizationId
        );

        if (!organization) {
            throw new ApiError(
                404,
                "Organization not found.");
        }

        return organization;
    }

    async _getOrganizationById(organizationId) {
        const organization =
            await Organization.findById(organizationId);

        if (!organization) {
            throw new ApiError(
                404,
                "Organization not found."
            );
        }

        return organization;
    }

    async _getActiveTeamMembership(
        teamId,
        membershipId
    ) {
        const teamMembership =
            await TeamMembership.findOne({
                teamId,
                membershipId
            });

        if (!teamMembership) {
            throw new ApiError(
                403,
                "You are not a member of this team."
            );
        }

        return teamMembership;
    }
}

export default new ApiKeyService();