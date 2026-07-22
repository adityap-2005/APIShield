import mongoose from "mongoose";

import { TEAM_ROLES } from "../constants/teamRoles.js";

const teamMembershipSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: [true, "Organization is required"],
        },

        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            required: [true, "Team is required"],
        },

        membershipId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Membership",
            required: [true, "Membership is required"],
        },

        role: {
            type: String,
            enum: Object.values(TEAM_ROLES),
            default: TEAM_ROLES.MEMBER
        },

        addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Added by is required"],
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate members in the same team
teamMembershipSchema.index(
    {
        teamId: 1,
        membershipId: 1,
    },
    {
        unique: true,
    }
);

// Speed up organization cleanup
teamMembershipSchema.index({
    organizationId: 1,
    membershipId: 1,
});

const TeamMembership = mongoose.model(
    "TeamMembership",
    teamMembershipSchema
);

export default TeamMembership;