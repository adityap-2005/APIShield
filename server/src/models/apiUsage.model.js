import mongoose from "mongoose";

import { API_KEY_ENVIRONMENT } from "../constants/apiKey.js";
import { HTTP_METHODS } from "../constants/http.js";

const apiUsageSchema = new mongoose.Schema(
    {
        apiKeyId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ApiKey",
            required: true,
        },

        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },

        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            required: true,
        },

        environment: {
            type: String,
            enum: Object.values(API_KEY_ENVIRONMENT),
            required: true,
        },

        method: {
            type: String,
            enum: Object.values(HTTP_METHODS),
            required: true,
        },

        endpoint: {
            type: String,
            required: true,
        },

        statusCode: {
            type: Number,
            required: true,
        },

        responseTime: {
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

apiUsageSchema.index({
    organizationId: 1,
    createdAt: -1
});

apiUsageSchema.index({
    teamId: 1,
    createdAt: -1
});

apiUsageSchema.index({
    apiKeyId: 1,
    createdAt: -1
});

const ApiUsage = mongoose.model("ApiUsage", apiUsageSchema);
export default ApiUsage;