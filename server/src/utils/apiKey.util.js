import crypto from "crypto";
import { API_KEY_PREFIX, DEFAULT_API_KEY_PREFIX } from "../constants/apiKey.js";
import ApiError from "./ApiError.js";

const PUBLIC_KEY_SUFFIX_LENGTH = 4;

export const hashApiKey = (apiKey) => {
    return crypto
        .createHash("sha256")
        .update(apiKey)
        .digest("hex");
};

export const generateApiKey = (prefixOrEnv) => {
    let prefix = DEFAULT_API_KEY_PREFIX;
    if (prefixOrEnv) {
        if (API_KEY_PREFIX[prefixOrEnv]) {
            prefix = API_KEY_PREFIX[prefixOrEnv];
        } else if (typeof prefixOrEnv === "string" && prefixOrEnv.trim()) {
            prefix = prefixOrEnv.endsWith("_") ? prefixOrEnv : `${prefixOrEnv}_`;
        }
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