import mongoose from "mongoose";
import { API_KEY_STATUS } from "../constants/apiKey.js";

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

    publicKeyId: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },

    environmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Environment",
        required: true,
        index: true
    },

    keyHash: {
        type: String,
        required: true,
        unique: true,
        select: false,
    },

    status: {
        type: String,
        enum: Object.values(API_KEY_STATUS),
        default: API_KEY_STATUS.ACTIVE,
    },

    revokedAt: {
        type: Date,
        default: null,
    },
    
    revokedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
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