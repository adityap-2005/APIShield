import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
    {
        organizationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true
        },

        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Team",
            default: null,
            index: true
        },

        actor: {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
                required: true
            },

            name: {
                type: String,
                required: true,
                trim: true
            },

            email: {
                type: String,
                required: true,
                lowercase: true,
                trim: true
            }
        },

        action: {
            type: String,
            required: true,
            index: true
        },

        entity: {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },

            type: {
                type: String,
                required: true
            },

            name: {
                type: String,
                required: true,
                trim: true
            }
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

auditLogSchema.index({
    organizationId: 1,
    createdAt: -1
});

auditLogSchema.index({
    action: 1,
    createdAt: -1
});

auditLogSchema.index({
    "actor.id": 1,
    createdAt: -1
});

auditLogSchema.index({
    "entity.id": 1,
    createdAt: -1
});

const AuditLog =  mongoose.model("AuditLog",auditLogSchema);
export default AuditLog;