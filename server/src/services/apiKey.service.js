import ApiKey from "../models/apiKey.model.js";
import Team from "../models/team.model.js";
import TeamMembership from "../models/teamMembership.model.js";

import auditLogService from "./auditLog.service.js";

import ApiError from "../utils/ApiError.js";
import { generateApiKey } from "../utils/apiKey.util.js";

import { API_KEY_STATUS } from "../constants/apiKey.js";
import { AUDIT_ACTIONS } from "../constants/auditActions.js";
import { AUDIT_ENTITY_TYPES } from "../constants/auditEntityTypes.js";

import { _getOrganizationById } from "../helpers/organization.helper.js";
import {
    _getActiveMembership,
    _getActiveTeamMembership
} from "../helpers/membership.helper.js";
import {
    _getApiKeyById,
    _authorizeApiKeyManagement
} from "../helpers/apiKey.helper.js";

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

        await _getOrganizationById(
            organizationId
        );

        const organizationMembership =
            await _getActiveMembership(
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
            await _getActiveTeamMembership(
                teamId,
                organizationMembership._id
            );

        // Authorization
        _authorizeApiKeyManagement(
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
            await _getActiveMembership(
                userId,
                organizationId
            );

        const teamMembership =
            await _getActiveTeamMembership(
                teamId,
                organizationMembership._id
            );

        _authorizeApiKeyManagement(
            teamMembership
        );

        const apiKeys = await ApiKey.find({
            organizationId,
            teamId
        })
            .sort({ createdAt: -1 });

        return apiKeys;
    }

    async getApiKeyById(
        organizationId,
        teamId,
        apiKeyId,
        userId
    ) {
        const organizationMembership =
            await _getActiveMembership(
                userId,
                organizationId
            );

        const teamMembership =
            await _getActiveTeamMembership(
                teamId,
                organizationMembership._id
            );

        _authorizeApiKeyManagement(
            teamMembership
        );

        const apiKey =
            await _getApiKeyById(
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
            await _getActiveMembership(
                userId,
                organizationId
            );

        const teamMembership =
            await _getActiveTeamMembership(
                teamId,
                organizationMembership._id
            );

        _authorizeApiKeyManagement(
            teamMembership
        );

        const apiKey =
            await _getApiKeyById(
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
            await _getActiveMembership(
                userId,
                organizationId
            );

        const teamMembership =
            await _getActiveTeamMembership(
                teamId,
                organizationMembership._id
            );

        _authorizeApiKeyManagement(
            teamMembership
        );

        const apiKey =
            await _getApiKeyById(
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
            await _getActiveMembership(
                userId,
                organizationId
            );

        const teamMembership =
            await _getActiveTeamMembership(
                teamId,
                organizationMembership._id
            );

        _authorizeApiKeyManagement(
            teamMembership
        );

        const apiKey =
            await _getApiKeyById(
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
            await _getActiveMembership(
                userId,
                organizationId
            );

        const teamMembership =
            await _getActiveTeamMembership(
                teamId,
                organizationMembership._id
            );

        _authorizeApiKeyManagement(
            teamMembership
        );

        const apiKey =
            await _getApiKeyById(
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
}

export default new ApiKeyService();