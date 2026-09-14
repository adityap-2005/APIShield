import Environment from "../models/environment.model.js";
import ApiError from "../utils/ApiError.js";

export const _getEnvironmentWithCredential = async (
    environmentId,
    organizationId,
    teamId
) => {
    const environment =
        await Environment.findOne({
            _id: environmentId,
            organizationId,
            teamId
        }).select(
            "+encryptedCredential +encryptionIv +encryptionAuthTag"
        );

    if (!environment) {
        throw new ApiError(
            404,
            "Environment not found."
        );
    }

    return environment;
};