import mongoose from "mongoose";

import { MEMBERSHIP_ROLES } from "../constants/membershipRoles.js";
import { MEMBERSHIP_STATUS } from "../constants/membershipStatus.js";

const membershipSchema = new mongoose.Schema(
    {
        // ======================
        // References
        // ======================

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true
        },

        // ======================
        // Access Control
        // ======================

        role: {
            type: String,
            enum: Object.values(MEMBERSHIP_ROLES),
            default: MEMBERSHIP_ROLES.DEVELOPER
        },

        // ======================
        // Membership Status
        // ======================

        status: {
            type: String,
            enum: Object.values(MEMBERSHIP_STATUS),
            default: MEMBERSHIP_STATUS.ACTIVE
        },

        // ======================
        // Invitation
        // ======================

        invitedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        // ======================
        // Audits
        // ======================

        leftAt: Date,

        removedAt: Date,

        removedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }

    },
    {
        timestamps: true
    });

membershipSchema.index(
    {
        userId: 1,
        organizationId: 1
    },
    {
        unique: true
    }
);

const Membership = mongoose.model(
    "Membership",
    membershipSchema
);

export default Membership;