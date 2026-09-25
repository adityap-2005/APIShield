import mongoose from "mongoose";

const upstreamApiSchema = new mongoose.Schema({
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

    integrationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Integration",
        required: true,
        index: true
    },

    environmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Environment",
        required: true,
        index: true
    },

    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },

    baseUrl: {
        type: String,
        required: true,
        trim: true
    },

    path: {
        type: String,
        required: true,
        trim: true
    },

    encryptedCredential: {
        type: String,
        required: true,
        select: false
    },

    encryptionIv: {
        type: String,
        required: true,
        select: false
    },

    encryptionAuthTag: {
        type: String,
        required: true,
        select: false
    },

    status: {
        type: String,
        enum: ["ACTIVE", "REVOKED"],
        default: "ACTIVE"
    },

    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true
});

upstreamApiSchema.index(
    {
        environmentId: 1,
        name: 1
    },
    {
        unique: true
    }
);

const UpstreamApi = mongoose.model(
    "UpstreamApi",
    upstreamApiSchema
);

export default UpstreamApi;