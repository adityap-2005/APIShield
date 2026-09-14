import ApiKey from "../models/apiKey.model.js";
import ApiError from "../utils/ApiError.js";
import { hashApiKey } from "../utils/apiKey.util.js";
import { API_KEY_STATUS } from "../constants/apiKey.js";

export const authenticateApiKey = async (
    req,
    res,
    next
) => {
    try {

        const apiKey = req.header("x-api-key");

        if (!apiKey) {
            throw new ApiError(
                401,
                "API key is required."
            );
        }

        const keyHash = hashApiKey(apiKey);

        const apiKeyDocument =
            await ApiKey.findOne({
                keyHash
            });

        if (!apiKeyDocument) {
            throw new ApiError(
                401,
                "Invalid API key."
            );
        }

        if (
            apiKeyDocument.status !==
            API_KEY_STATUS.ACTIVE
        ) {
            throw new ApiError(
                401,
                "API key is not active."
            );
        }

        if (
            apiKeyDocument.expiresAt &&
            apiKeyDocument.expiresAt <= new Date()
        ) {
            throw new ApiError(
                401,
                "API key has expired."
            );
        }

        req.apiKeyContext = {

            apiKeyId:
                apiKeyDocument._id,
        
            organizationId:
                apiKeyDocument.organizationId,
        
            teamId:
                apiKeyDocument.teamId,
        
            scopes:
                apiKeyDocument.scopes,
        
            environmentId:
                apiKeyDocument.environmentId
        };

        next();

    } catch (error) {
        next(error);
    }
};