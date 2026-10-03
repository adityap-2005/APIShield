import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },

        slug: {
            type: String,
            required: true,
            lowercase: true,
            trim: true
        },

        description: {
            type: String,
            trim: true,
            maxlength: 500,
            default: "",
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

projectSchema.index(
    {
        organizationId: 1,
        slug: 1,
    },
    {
        unique: true,
    }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;