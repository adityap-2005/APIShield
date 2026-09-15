import mongoose from "mongoose";
import { API_KEY_ENVIRONMENT } from "../constants/apiKey.js";

const environmentSchema = new mongoose.Schema({
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

    name: {
        type: String,
        required: true,
        enum: Object.values(API_KEY_ENVIRONMENT)
    },

    status: {
        type: String,
        enum: ["ACTIVE", "DISABLED"],
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

environmentSchema.index(
    {
        integrationId: 1,
        name: 1
    },
    {
        unique: true
    }
);

const Environment = mongoose.model(
    "Environment",
    environmentSchema
);

export default Environment;