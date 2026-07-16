import mongoose from "mongoose";

import { ORGANIZATION_STATUS } from "../constants/organizationStatus.js";

const organizationSchema = new mongoose.Schema(
    {
        // ======================
        // Identity
        // ======================

        name: {
            type: String,
            required: [true, "Organization name is required"],
            trim: true,
            minlength: [3, "Organization name must be at least 3 characters"],
            maxlength: [100, "Organization name cannot exceed 100 characters"]
        },


        slug: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        // ======================
        // Information
        // ======================

        description: {
            type: String,
            default: "",
            maxlength: [500, "Description cannot exceed 500 characters"]
        },

        logo: {
            type: String,
            default: null
        },

        website: {
            type: String,
            default: ""
        },

        // ======================
        // Ownership
        // ======================

        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        // ======================
        // Account
        // ======================

        status: {
            type: String,
            enum: Object.values(ORGANIZATION_STATUS),
            default: ORGANIZATION_STATUS.ACTIVE
        }

    },
    {
        timestamps: true
    });

organizationSchema.index(
    {slug : 1},
    {unique : true}
);
organizationSchema.index({ownerId : 1});

const Organization = new mongoose.model(
    "Organization",
    organizationSchema
);

export default Organization;