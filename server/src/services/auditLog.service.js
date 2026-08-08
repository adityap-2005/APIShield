import AuditLog from "../models/auditLog.model.js";
import Membership from "../models/membership.model.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";

import { MEMBERSHIP_STATUS } from "../constants/membershipStatus.js";

class AuditLogService {

    async getActor(userId) {

        const actor = await User.findById(userId)
            .select("_id name email");

        if (!actor) {
            throw new ApiError(
                404,
                "User not found."
            );
        }

        return {
            id: actor._id,
            name: actor.name,
            email: actor.email
        };
    }

    async log({
        organizationId,
        teamId = null,
        actor,
        action,
        entity,
        metadata = {}
    }) {

        return await AuditLog.create({
            organizationId,
            teamId,
            actor,
            action,
            entity,
            metadata
        });
    }

    async getOrganizationAuditLogs(
        organizationId,
        userId,
        page = 1,
        limit = 20
    ) {
        const membership =
            await Membership.findOne({
                userId,
                organizationId,
                status: MEMBERSHIP_STATUS.ACTIVE
            });

        if (!membership) {
            throw new ApiError(
                403,
                "You are not an active member of this organization."
            );
        }

        const skip = (page - 1) * limit;

        const logs =
            await AuditLog.find({
                organizationId
            })
                .sort({
                    createdAt: -1
                })
                .skip(skip)
                .limit(limit)
                .lean();

        const total =
            await AuditLog.countDocuments({
                organizationId
            });

        return {
            logs,

            pagination: {
                page,
                limit,
                total,
                totalPages:
                    Math.ceil(total / limit)
            }
        };
    }

    async getAuditLogById(
        organizationId,
        userId,
        auditLogId
    ) {
        const membership =
            await Membership.findOne({
                userId,
                organizationId,
                status: MEMBERSHIP_STATUS.ACTIVE
            });

        if (!membership) {
            throw new ApiError(
                403,
                "You are not an active member of this organization."
            );
        }

        const auditLog =
            await AuditLog.findOne({
                _id: auditLogId,
                organizationId
            }).lean();

        if (!auditLog) {
            throw new ApiError(
                404,
                "Audit log not found."
            );
        }

        return auditLog;
    }

    
}

export default new AuditLogService();