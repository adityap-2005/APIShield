import UpstreamApi from "../models/upstreamApi.model.js";
import ApiError from "../utils/ApiError.js";


export const _getUpstreamApiWithCredential = async (
    upstreamApiId,
    organizationId,
    projectId,
    environmentId
) => {

    const upstreamApi =
        await UpstreamApi.findOne({
            _id: upstreamApiId,
            organizationId,
            projectId,
            environmentId
        }).select(
            "+encryptedCredential +encryptionIv +encryptionAuthTag"
        );

    if (!upstreamApi) {
        throw new ApiError(
            404,
            "Upstream API not found."
        );
    }

    return upstreamApi;
};