import mongoose from "mongoose";
import { API_KEY_STATUS, API_KEY_ENVIRONMENT } from "../constants/apiKey.js";

const apiKeySchema = new mongoose.Schema({
    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
    },

    description: {
        type: String,
        trim: true,
        maxlength: 500,
        default: "",
    },

    environment: {
        type: String,
        enum: Object.values(API_KEY_ENVIRONMENT),
        default: API_KEY_ENVIRONMENT.DEVELOPMENT,
    },

    publicKeyId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },

    keyHash: {
        type: String,
        required: true,
        unique: true,
        select: false,
    },

    scopes: {
        type: [String],
        default: [],
    },

    status: {
        type: String,
        enum: Object.values(API_KEY_STATUS),
        default: API_KEY_STATUS.ACTIVE,
    },

    expiresAt: {
        type: Date,
        default: null,
    },

    lastUsedAt: {
        type: Date,
        default: null,
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    archivedAt: {
        type: Date,
        default: null,
    },

    archivedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
}, {
    timestamps: true
});

const ApiKey = mongoose.model("ApiKey", apiKeySchema);
export default ApiKey;