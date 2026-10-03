import ApiKey from "../models/apiKey.model.js";
import ApiError from "../utils/ApiError.js";
import { PROJECT_ROLES } from "../constants/projectRoles.js";

export async function _getApiKeyById(
        apiKeyId,
        projectId,
        organizationId
    ) {
        const apiKey = await ApiKey.findOne({
            _id: apiKeyId,
            projectId,
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

export function _authorizeApiKeyManagement(
        projectMembership
    ) {

        if (
            projectMembership.role !==
            PROJECT_ROLES.PROJECT_ADMIN
        ) {
            throw new ApiError(
                403,
                "Only Project Admin can manage API Keys."
            );
        }

    }
