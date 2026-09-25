import mongoose from "mongoose";

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

        environmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Environment",
            required: true,
        },

        upstreamApiId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "UpstreamApi",
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

apiUsageSchema.index({
    environmentId: 1,
    createdAt: -1
});

apiUsageSchema.index({
    upstreamApiId: 1,
    createdAt: -1
});

const ApiUsage = mongoose.model("ApiUsage", apiUsageSchema);
export default ApiUsage;