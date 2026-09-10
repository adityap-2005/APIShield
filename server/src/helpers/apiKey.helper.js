import ApiKey from "../models/apiKey.model.js";
import ApiError from "../utils/ApiError.js";
import { TEAM_ROLES } from "../constants/teamRoles.js";

export async function _getApiKeyById(
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

export function _authorizeApiKeyManagement(
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
