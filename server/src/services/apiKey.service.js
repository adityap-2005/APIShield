import ApiKey from "../models/apiKey.model.js";
import Project from "../models/project.model.js";

import auditLogService from "./auditLog.service.js";

import ApiError from "../utils/ApiError.js";
import { generateApiKey } from "../utils/apiKey.util.js";

import { API_KEY_STATUS } from "../constants/apiKey.js";
import { AUDIT_ACTIONS } from "../constants/auditActions.js";
import { AUDIT_ENTITY_TYPES } from "../constants/auditEntityTypes.js";

import { _getOrganizationById } from "../helpers/organization.helper.js";
import { _getProjectById } from "../helpers/project.helper.js";
import {
    _getActiveMembership,
    _getActiveProjectMembership
} from "../helpers/membership.helper.js";
import {
    _getApiKeyById,
    _authorizeApiKeyManagement
} from "../helpers/apiKey.helper.js";

class ApiKeyService {

    async createApiKey(
        organizationId,
        projectId,
        userId,
        apiKeyData
    ) {
        const {
            name,
            description,
            expiresAt,
            environmentId
        } = apiKeyData;

        // Check Active Organization Membership
        await _getOrganizationById(organizationId);

        const organizationMembership =
            await _getActiveMembership(
                userId,
                organizationId
            );

        // Check Project Exists & Belongs to Organization
        await _getProjectById(projectId, organizationId);

        // Check Active Project Membership
        const projectMembership =
            await _getActiveProjectMembership(
                projectId,
                organizationMembership._id
            );

        // Authorization
        _authorizeApiKeyManagement(
            projectMembership
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
        } = generateApiKey();

        // Save API Key
        const createdApiKey =
            await ApiKey.create({
                organizationId,
                projectId,
                ...(environmentId ? { environmentId } : {}),
                name,
                description,
                expiresAt,
                publicKeyId,
                keyHash,
                createdBy: userId
            });

        const actor =
            await auditLogService.getActor(userId);

        await auditLogService.log({
            organizationId,
            projectId,
            actor,
            action: AUDIT_ACTIONS.API_KEY_CREATED,
            entity: {
                id: createdApiKey._id,
                type: AUDIT_ENTITY_TYPES.API_KEY,
                name: createdApiKey.name
            },
            metadata: {}
        });

        return {
            apiKey,
            apiKeyDetails: createdApiKey
        };
    }

    async getProjectApiKeys(
        organizationId,
        projectId,
        userId
    ) {
        await _getOrganizationById(organizationId);

        const organizationMembership =
            await _getActiveMembership(
                userId,
                organizationId
            );

        await _getProjectById(projectId, organizationId);

        await _getActiveProjectMembership(
            projectId,
            organizationMembership._id
        );

        const apiKeys = await ApiKey.find({
            organizationId,
            projectId
        }).sort({ createdAt: -1 });

        return apiKeys;
    }

    async getApiKeyById(
        organizationId,
        projectId,
        apiKeyId,
        userId
    ) {
        await _getOrganizationById(organizationId);

        const organizationMembership =
            await _getActiveMembership(
                userId,
                organizationId
            );

        await _getProjectById(projectId, organizationId);

        await _getActiveProjectMembership(
            projectId,
            organizationMembership._id
        );

        const apiKey =
            await _getApiKeyById(
                apiKeyId,
                projectId,
                organizationId
            );

        return apiKey;
    }

    async updateApiKey(
        organizationId,
        projectId,
        apiKeyId,
        userId,
        apiKeyData
    ) {
        const {
            name,
            description,
            expiresAt
        } = apiKeyData;

        await _getOrganizationById(organizationId);

        const organizationMembership =
            await _getActiveMembership(
                userId,
                organizationId
            );

        await _getProjectById(projectId, organizationId);

        const projectMembership =
            await _getActiveProjectMembership(
                projectId,
                organizationMembership._id
            );

        _authorizeApiKeyManagement(
            projectMembership
        );

        const apiKey =
            await _getApiKeyById(
                apiKeyId,
                projectId,
                organizationId
            );

        if (apiKey.status === API_KEY_STATUS.ARCHIVED) {
            throw new ApiError(
                400,
                "Archived API key cannot be modified."
            );
        }

        if (apiKey.status === API_KEY_STATUS.REVOKED) {
            throw new ApiError(
                400,
                "Revoked API key cannot be modified."
            );
        }

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
            expiresAt: apiKey.expiresAt
        };

        if (name !== undefined) {
            apiKey.name = name;
        }

        if (description !== undefined) {
            apiKey.description = description;
        }

        if (expiresAt !== undefined) {
            apiKey.expiresAt = expiresAt;
        }

        await apiKey.save();

        const actor =
            await auditLogService.getActor(userId);

        await auditLogService.log({
            organizationId,
            projectId,
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
                    expiresAt: apiKey.expiresAt
                }
            }
        });

        return apiKey;
    }

    async rotateApiKey(
        organizationId,
        projectId,
        apiKeyId,
        userId
    ) {
        await _getOrganizationById(organizationId);

        const organizationMembership =
            await _getActiveMembership(
                userId,
                organizationId
            );

        await _getProjectById(projectId, organizationId);

        const projectMembership =
            await _getActiveProjectMembership(
                projectId,
                organizationMembership._id
            );

        _authorizeApiKeyManagement(
            projectMembership
        );

        const apiKey =
            await _getApiKeyById(
                apiKeyId,
                projectId,
                organizationId
            );

        if (apiKey.status === API_KEY_STATUS.ARCHIVED) {
            throw new ApiError(
                400,
                "Archived API key cannot be rotated."
            );
        }

        if (apiKey.status === API_KEY_STATUS.REVOKED) {
            throw new ApiError(
                400,
                "Revoked API key cannot be rotated."
            );
        }

        if (apiKey.status !== API_KEY_STATUS.ACTIVE) {
            throw new ApiError(
                400,
                "Only active API keys can be rotated."
            );
        }

        if (
            apiKey.expiresAt &&
            new Date(apiKey.expiresAt) <= new Date()
        ) {
            throw new ApiError(
                400,
                "Expired API key cannot be rotated."
            );
        }

        // Generate new credential
        const {
            apiKey: newPlainApiKey,
            publicKeyId,
            keyHash
        } = generateApiKey();

        const previousPublicKeyId = apiKey.publicKeyId;

        // Securely update existing key record (preserve identity, org, project, environment, createdBy)
        apiKey.publicKeyId = publicKeyId;
        apiKey.keyHash = keyHash;
        apiKey.lastRotatedAt = new Date();
        apiKey.rotatedBy = userId;

        await apiKey.save();

        const actor =
            await auditLogService.getActor(userId);

        await auditLogService.log({
            organizationId,
            projectId,
            actor,
            action: AUDIT_ACTIONS.API_KEY_ROTATED,
            entity: {
                id: apiKey._id,
                type: AUDIT_ENTITY_TYPES.API_KEY,
                name: apiKey.name
            },
            metadata: {
                previousPublicKeyId,
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
        projectId,
        apiKeyId,
        userId
    ) {
        await _getOrganizationById(organizationId);

        const organizationMembership =
            await _getActiveMembership(
                userId,
                organizationId
            );

        await _getProjectById(projectId, organizationId);

        const projectMembership =
            await _getActiveProjectMembership(
                projectId,
                organizationMembership._id
            );

        _authorizeApiKeyManagement(
            projectMembership
        );

        const apiKey =
            await _getApiKeyById(
                apiKeyId,
                projectId,
                organizationId
            );

        if (apiKey.status === API_KEY_STATUS.ARCHIVED) {
            throw new ApiError(
                400,
                "Archived API key cannot be revoked."
            );
        }

        if (apiKey.status === API_KEY_STATUS.REVOKED) {
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
            projectId,
            actor,
            action: AUDIT_ACTIONS.API_KEY_REVOKED,
            entity: {
                id: apiKey._id,
                type: AUDIT_ENTITY_TYPES.API_KEY,
                name: apiKey.name
            },
            metadata: {
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
        projectId,
        apiKeyId,
        userId
    ) {
        await _getOrganizationById(organizationId);

        const organizationMembership =
            await _getActiveMembership(
                userId,
                organizationId
            );

        await _getProjectById(projectId, organizationId);

        const projectMembership =
            await _getActiveProjectMembership(
                projectId,
                organizationMembership._id
            );

        _authorizeApiKeyManagement(
            projectMembership
        );

        const apiKey =
            await _getApiKeyById(
                apiKeyId,
                projectId,
                organizationId
            );

        // Safe idempotent handling for repeated archive requests
        if (apiKey.status === API_KEY_STATUS.ARCHIVED) {
            return {
                apiKeyId: apiKey._id,
                publicKeyId: apiKey.publicKeyId,
                status: apiKey.status,
                archivedAt: apiKey.archivedAt
            };
        }

        apiKey.status = API_KEY_STATUS.ARCHIVED;
        apiKey.archivedAt = new Date();
        apiKey.archivedBy = userId;

        await apiKey.save();

        const actor =
            await auditLogService.getActor(userId);

        await auditLogService.log({
            organizationId,
            projectId,
            actor,
            action: AUDIT_ACTIONS.API_KEY_ARCHIVED,
            entity: {
                id: apiKey._id,
                type: AUDIT_ENTITY_TYPES.API_KEY,
                name: apiKey.name
            },
            metadata: {
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

    async deleteApiKey(
        organizationId,
        projectId,
        apiKeyId,
        userId
    ) {
        await _getOrganizationById(organizationId);

        const organizationMembership =
            await _getActiveMembership(
                userId,
                organizationId
            );

        await _getProjectById(projectId, organizationId);

        const projectMembership =
            await _getActiveProjectMembership(
                projectId,
                organizationMembership._id
            );

        _authorizeApiKeyManagement(
            projectMembership
        );

        const apiKey =
            await _getApiKeyById(
                apiKeyId,
                projectId,
                organizationId
            );

        await ApiKey.deleteOne({
            _id: apiKey._id,
            projectId,
            organizationId
        });

        const actor =
            await auditLogService.getActor(userId);

        await auditLogService.log({
            organizationId,
            projectId,
            actor,
            action: AUDIT_ACTIONS.API_KEY_DELETED,
            entity: {
                id: apiKey._id,
                type: AUDIT_ENTITY_TYPES.API_KEY,
                name: apiKey.name
            },
            metadata: {
                publicKeyId: apiKey.publicKeyId
            }
        });

        return {
            apiKeyId: apiKey._id,
            publicKeyId: apiKey.publicKeyId,
            deleted: true
        };
    }
}

export default new ApiKeyService();
