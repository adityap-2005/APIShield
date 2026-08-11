import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";

import Membership from "../models/membership.model.js";
import Organization from "../models/organization.model.js";
import User from "../models/user.model.js";

import auditLogService from "./auditLog.service.js";

import { MEMBERSHIP_STATUS } from "../constants/membershipStatus.js";
import { MEMBERSHIP_ROLES } from "../constants/membershipRoles.js";
import { ORGANIZATION_ROLES } from "../constants/organizationRoles.js";
import { AUDIT_ACTIONS } from "../constants/auditActions.js";
import { AUDIT_ENTITY_TYPES } from "../constants/auditEntityTypes.js";

class MembershipService {

    async leaveOrganization(userId, organizationId) {

        const membership =
            await this._getActiveMembership(
                userId,
                organizationId
            );

        await this._validateLastOwner(membership);

        const session = await mongoose.startSession();

        session.startTransaction();

        try {

            membership.status = MEMBERSHIP_STATUS.LEFT;
            membership.leftAt = new Date();

            await membership.save({ session });

            await session.commitTransaction();

            return membership;

        } catch (error) {

            await session.abortTransaction();

            throw error;

        } finally {

            await session.endSession();

        }

    }

    async getOrganizationMembers(
        userId,
        organizationId
    ) {
        await this._validateOrganization(organizationId);

        await this._getActiveMembership(
            userId,
            organizationId
        );

        const memberships = await Membership.find({
            organizationId,
            status: MEMBERSHIP_STATUS.ACTIVE
        })
            .populate(
                "userId",
                "name email avatar"
            )
            .sort({
                createdAt: 1
            });

        return memberships.map((membership) => ({
            membershipId: membership._id,
            user: membership.userId,
            role: membership.role,
            status: membership.status,
            joinedAt: membership.createdAt
        }));

    }

    async updateMemberRole(
        userId,
        organizationId,
        memberId,
        role
    ) {
        await this._validateOrganization(organizationId);

        const requesterMembership =
            await this._getActiveMembership(
                userId,
                organizationId
            );

        const targetMembership =
            await this._getMembershipById(
                memberId,
                organizationId
            );

        if (
            requesterMembership._id.equals(targetMembership._id)
        ) {
            throw new ApiError(
                400,
                "You cannot change your own role."
            );
        }

        this._validateManagementPermission(
            requesterMembership,
            targetMembership
        );

        this._validateRole(role);

        if (targetMembership.role === role) {
            throw new ApiError(
                400,
                "Member already has this role."
            );
        }

        const previousRole =
            targetMembership.role;

        targetMembership.role = role;

        await targetMembership.save();

        const actor =
            await auditLogService.getActor(userId);

        await auditLogService.log({
            organizationId,

            actor,

            action:
                AUDIT_ACTIONS.MEMBER_ROLE_CHANGED,

            entity: {
                id: targetMembership._id,
                type:
                    AUDIT_ENTITY_TYPES.MEMBER,
                name:
                    targetMembership._id.toString()
            },

            metadata: {
                membershipId:
                    targetMembership._id,

                previousRole,

                newRole:
                    targetMembership.role
            }
        });

        return {
            membershipId: targetMembership._id,
            user: targetMembership.userId,
            role: targetMembership.role,
            status: targetMembership.status
        };
    }

    async removeMember(
        userId,
        organizationId,
        memberId
    ) {
        await this._validateOrganization(
            organizationId
        );

        const requesterMembership =
            await this._getActiveMembership(
                userId,
                organizationId
            );

        const targetMembership =
            await this._getMembershipById(
                memberId,
                organizationId
            );

        if (
            requesterMembership._id.equals(
                targetMembership._id
            )
        ) {
            throw new ApiError(
                400,
                "Use the leave organization endpoint to leave the organization."
            );
        }

        this._validateManagementPermission(
            requesterMembership,
            targetMembership
        );

        await this._validateLastOwner(
            targetMembership
        );

        const previousRole =
            targetMembership.role;

        targetMembership.status =
            MEMBERSHIP_STATUS.REMOVED;

        targetMembership.removedAt =
            new Date();

        targetMembership.removedBy =
            userId;

        await targetMembership.save();

        const actor =
            await auditLogService.getActor(userId);

        await auditLogService.log({
            organizationId,

            actor,

            action:
                AUDIT_ACTIONS.MEMBER_REMOVED,

            entity: {
                id: targetMembership._id,
                type:
                    AUDIT_ENTITY_TYPES.MEMBER,
                name:
                    targetMembership._id.toString()
            },

            metadata: {
                membershipId:
                    targetMembership._id,

                previousRole
            }
        });
    }

    // ======================
    // Helper Methods
    // ======================

    async _validateOrganization(organizationId) {

        const organization = await Organization.findById(
            organizationId
        );

        if (!organization) {
            throw new ApiError(
                404,
                "Organization not found."
            );
        }

        return organization;
    }

    async _getActiveMembership(userId, organizationId) {

        await this._validateOrganization(
            organizationId
        );

        const membership = await Membership.findOne({
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

        return membership;
    }

    _validateManagementPermission(
        requesterMembership,
        targetMembership
    ) {
        if (
            requesterMembership.role === ORGANIZATION_ROLES.OWNER
        ) {
            return;
        }

        if (
            requesterMembership.role === ORGANIZATION_ROLES.ADMIN &&
            targetMembership.role === ORGANIZATION_ROLES.DEVELOPER
        ) {
            return;
        }

        throw new ApiError(
            403,
            "You do not have permission to perform this action."
        );
    }

    async _getMembershipById(
        memberId,
        organizationId
    ) {

        const membership = await Membership.findOne({
            _id: memberId,
            organizationId,
            status: MEMBERSHIP_STATUS.ACTIVE
        }).populate(
            "userId",
            "name email avatar"
        );

        if (!membership) {
            throw new ApiError(
                404,
                "Member not found."
            );
        }

        return membership;
    }

    async _validateLastOwner(targetMembership) {

        if (
            targetMembership.role !== ORGANIZATION_ROLES.OWNER
        ) {
            return;
        }

        const ownerCount = await Membership.countDocuments({
            organizationId: targetMembership.organizationId,
            role: ORGANIZATION_ROLES.OWNER,
            status: MEMBERSHIP_STATUS.ACTIVE
        });

        if (ownerCount <= 1) {
            throw new ApiError(
                409,
                "Cannot remove the last owner of the organization."
            );
        }
    }

    _validateRole(role) {

        if (
            !Object.values(ORGANIZATION_ROLES).includes(role)
        ) {
            throw new ApiError(
                400,
                "Invalid role."
            );
        }
    }
}

const membershipService = new MembershipService();

export default membershipService;