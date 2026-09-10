import mongoose from "mongoose";

import { API_KEY_ENVIRONMENT } from "../constants/apiKey";

const integrationSchema = new mongoose.Schema({
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
        maxlength: 100
    },

    baseUrl: {
        type: String,
        required: true,
        trim: true
    },

    environment: {
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

const Integration = mongoose.model("Integration", integrationSchema);

export default Integration;