import mongoose from "mongoose";

import { INVITATION_STATUS } from "../constants/invitationStatus.js";
import { MEMBERSHIP_ROLES } from "../constants/membershipRoles.js";

const invitationSchema = new mongoose.Schema({

    // ======================
    // Organization
    // ======================

    organizationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true
    },

    // ======================
    // Invitee
    // ======================

    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            "Please enter a valid email address"
        ]
    },

    // ======================
    // Role
    // ======================

    role: {
        type: String,
        enum: Object.values(MEMBERSHIP_ROLES),
        default: MEMBERSHIP_ROLES.DEVELOPER
    },

    // ======================
    // Invitation
    // ======================

    invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    status: {
        type: String,
        enum: Object.values(INVITATION_STATUS),
        default: INVITATION_STATUS.PENDING
    },

    expiresAt: {
        type: Date,
        required: true
    },

    // ======================
    // Audits
    // ======================

    acceptedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    rejectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
},
    {
        timestamps: true
    });

invitationSchema.index({
    organizationId: 1,
    email: 1,
    status: 1
})

const Invitation = mongoose.model(
    "Invitation",
    invitationSchema
);

export default Invitation;