import crypto from "crypto";
import { API_KEY_PREFIX } from "../constants/apiKey.js";
import ApiError from "./ApiError.js";

const PUBLIC_KEY_SUFFIX_LENGTH = 4;

export const hashApiKey = (apiKey) => {
    return crypto
        .createHash("sha256")
        .update(apiKey)
        .digest("hex");
};

export const generateApiKey = (environment) => {
    const prefix = API_KEY_PREFIX[environment];

    if (!prefix) {
        throw new ApiError(
            400,
            "Invalid API key environment"
        );
    }

    const secret = 
        crypto
        .randomBytes(32)
        .toString("hex");

    const apiKey = prefix + secret;

    const publicKeyId = 
        `${prefix}${secret.slice(0,PUBLIC_KEY_SUFFIX_LENGTH)}`;

    const keyHash = hashApiKey(apiKey);

    return {
        apiKey,
        keyHash,
        publicKeyId
    }
}