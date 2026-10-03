import mongoose from "mongoose";

import { PROJECT_ROLES } from "../constants/projectRoles.js";

const projectMembershipSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: [true, "Organization is required"],
        },

        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: [true, "Project is required"],
        },

        membershipId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Membership",
            required: [true, "Membership is required"],
        },

        role: {
            type: String,
            enum: Object.values(PROJECT_ROLES),
            default: PROJECT_ROLES.MEMBER
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

// Prevent duplicate members in the same project
projectMembershipSchema.index(
    {
        projectId: 1,
        membershipId: 1,
    },
    {
        unique: true,
    }
);

// Speed up organization cleanup
projectMembershipSchema.index({
    organizationId: 1,
    membershipId: 1,
});

const ProjectMembership = mongoose.model(
    "ProjectMembership",
    projectMembershipSchema
);

export default ProjectMembership;