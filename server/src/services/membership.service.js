import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";

import Membership from "../models/membership.model.js";

import auditLogService from "./auditLog.service.js";

import { MEMBERSHIP_STATUS } from "../constants/membershipStatus.js";
import { AUDIT_ACTIONS } from "../constants/auditActions.js";
import { AUDIT_ENTITY_TYPES } from "../constants/auditEntityTypes.js";

import {
    _getOrganizationById
} from "../helpers/organization.helper.js"

import {
    _getActiveMembership,
    _getMembershipById,
    _validateManagementPermission,
    _validateRole,
    _validateLastOwner
} from "../helpers/membership.helper.js"

class MembershipService {

    async leaveOrganization(userId, organizationId) {
        const membership =
            await _getActiveMembership(
                userId,
                organizationId
            );

        await _validateLastOwner(membership);

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
        await _getOrganizationById(organizationId);
        
        await _getActiveMembership(
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
        await _getOrganizationById(organizationId);
        
        const requesterMembership =
            await _getActiveMembership(
                userId,
                organizationId
            );
            
            const targetMembership =
            await _getMembershipById(
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
        
        _validateManagementPermission(
            requesterMembership,
            targetMembership
        );
        
        _validateRole(role);
        
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
        await _getOrganizationById(
            organizationId
        );
        
        const requesterMembership =
        await _getActiveMembership(
                userId,
                organizationId
            );
            
            const targetMembership =
            await _getMembershipById(
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

        _validateManagementPermission(
            requesterMembership,
            targetMembership
        );
        
        await _validateLastOwner(
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

}

const membershipService = new MembershipService();

export default membershipService;