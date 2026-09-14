import mongoose from "mongoose";

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

integrationSchema.index(
    {
        teamId: 1,
        name: 1
    },
    {
        unique: true
    }
);

const Integration = mongoose.model(
    "Integration",
    integrationSchema
);

export default Integration;