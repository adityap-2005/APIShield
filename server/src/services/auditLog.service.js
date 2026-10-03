import AuditLog from "../models/auditLog.model.js";
import Membership from "../models/membership.model.js";
import ProjectMembership from "../models/projectMembership.model.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";

import { MEMBERSHIP_STATUS } from "../constants/membershipStatus.js";
import { ORGANIZATION_ROLES } from "../constants/organizationRoles.js";

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
        projectId = null,
        actor,
        action,
        entity,
        metadata = {}
    }) {

        return await AuditLog.create({
            organizationId,
            projectId,
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
        const isOrganizationAdmin = [
            ORGANIZATION_ROLES.OWNER,
            ORGANIZATION_ROLES.ADMIN,
        ].includes(membership.role);
        const projectMemberships = isOrganizationAdmin
            ? null
            : await ProjectMembership.find({
                organizationId,
                membershipId: membership._id,
            }).select("projectId");
        const projectIds = projectMemberships?.map(({ projectId }) => projectId);
        const query = {
            organizationId,
            ...(projectIds ? {
                $or: [
                    { projectId: { $in: projectIds } },
                    { projectId: null },
                ],
            } : {}),
        };

        const logs =
            await AuditLog.find(query)
                .sort({
                    createdAt: -1
                })
                .skip(skip)
                .limit(limit)
                .lean();

        const total =
            await AuditLog.countDocuments(query);

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
                organizationId,
                ...(membership.role === ORGANIZATION_ROLES.OWNER ||
                    membership.role === ORGANIZATION_ROLES.ADMIN
                    ? {}
                    : {
                        $or: [
                            { projectId: null },
                            {
                                projectId: {
                                    $in: await ProjectMembership.find({
                                        organizationId,
                                        membershipId: membership._id,
                                    }).distinct("projectId"),
                                },
                            },
                        ],
                    }),
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