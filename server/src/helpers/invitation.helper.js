import mongoose from "mongoose";

import Invitation from "../models/invitation.model.js";
import User from "../models/user.model.js";
import Membership from "../models/membership.model.js";
import ApiError from "../utils/ApiError.js";
import { INVITATION_STATUS } from "../constants/invitationStatus.js";
import { MEMBERSHIP_STATUS } from "../constants/membershipStatus.js";
import auditLogService from "../services/auditLog.service.js";
import { AUDIT_ACTIONS } from "../constants/auditActions.js";
import { AUDIT_ENTITY_TYPES } from "../constants/auditEntityTypes.js";

export async function _validateInvitation(invitationId) {

        const invitation = await Invitation.findById(invitationId);

        if (!invitation) {
            throw new ApiError(
                404,
                "Invitation not found."
            );
        }

        return invitation;
    }

export function _validateInvitationOwner(
        invitation,
        user
    ) {

        if (invitation.email !== user.email) {
            throw new ApiError(
                403,
                "You are not authorized to access this invitation."
            );
        }

    }

export function _validateInvitationStatus(
        invitation
    ) {

        if (
            invitation.status !==
            INVITATION_STATUS.PENDING
        ) {
            throw new ApiError(
                409,
                "Invitation is no longer pending."
            );
        }

    }

export function _validateInvitationExpiry(
        invitation
    ) {

        if (
            invitation.expiresAt < new Date()
        ) {

            throw new ApiError(
                400,
                "Invitation has expired."
            );

        }

    }

export async function _checkPendingInvitation(organizationId, email) {

        const invitation = await Invitation.findOne({
            organizationId,
            email,
            status: INVITATION_STATUS.PENDING
        });

        if (invitation) {
            throw new ApiError(
                409,
                "A pending invitation already exists."
            );
        }
    }

export async function _validateOrganizationInvitation(
        invitationId,
        organizationId
    ) {

        const invitation = await Invitation.findOne({
            _id: invitationId,
            organizationId
        });

        if (!invitation) {
            throw new ApiError(
                404,
                "Invitation not found."
            );
        }

        return invitation;
    }

export async function _checkExistingMember(organizationId, email, inviterId) {


        const inviter = await User.findById(inviterId);

        if (!inviter) {
            throw new ApiError(
                404,
                "Inviter not found"
            );
        }

        if (inviter.email === email) {
            throw new ApiError(
                400,
                "You cannot invite yourself."
            );
        }

        const user = await User.findOne({ email });

        if (!user) {
            return;
        }

        const membership = await Membership.findOne({
            organizationId,
            userId: user._id,
            status: MEMBERSHIP_STATUS.ACTIVE
        });

        if (membership) {
            throw new ApiError(
                409,
                "User is already a member of this organization."
            );
        }
    }

    export async function _createInvitation(
        organizationId,
        inviterId,
        email,
        role
    ) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        return Invitation.create({
            organizationId,
            email,
            role,
            invitedBy: inviterId,
            expiresAt
        });
    }

    export async function _checkExistingMembership(invitation, user) {
        const membership = await Membership.findOne({
            organizationId: invitation.organizationId,
            userId: user._id,
            status: MEMBERSHIP_STATUS.ACTIVE
        });

        if (membership) {
            throw new ApiError(
                409,
                "You are already a member of this organization."
            );
        }
    }

    export async function _acceptInvitation(invitation, user) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            let membership = await Membership.findOne({
                userId: user._id,
                organizationId: invitation.organizationId
            }).session(session);

            if (membership) {
                if (membership.status === MEMBERSHIP_STATUS.ACTIVE) {
                    throw new ApiError(
                        409,
                        "You are already a member of this organization."
                    );
                }

                membership.status = MEMBERSHIP_STATUS.ACTIVE;
                membership.role = invitation.role;
                membership.invitedBy = invitation.invitedBy;
                membership.leftAt = null;
                membership.removedAt = null;
                membership.removedBy = null;
                await membership.save({ session });
            } else {
                const memberships = await Membership.create([
                    {
                        userId: user._id,
                        organizationId: invitation.organizationId,
                        role: invitation.role,
                        status: MEMBERSHIP_STATUS.ACTIVE,
                        invitedBy: invitation.invitedBy
                    }
                ], { session });
                membership = memberships[0];
            }

            invitation.status = INVITATION_STATUS.ACCEPTED;
            invitation.acceptedAt = new Date();
            await invitation.save({ session });

            const actor = await auditLogService.getActor(user._id);
            await auditLogService.log({
                organizationId: invitation.organizationId,
                actor,
                action: AUDIT_ACTIONS.INVITATION_ACCEPTED,
                entity: {
                    id: invitation._id,
                    type: AUDIT_ENTITY_TYPES.MEMBER,
                    name: user.email
                },
                metadata: {
                    membershipId: membership._id,
                    role: invitation.role,
                    invitedBy: invitation.invitedBy
                },
                session
            });

            await session.commitTransaction();

            return Invitation.findById(invitation._id)
                .populate("organizationId", "name slug")
                .populate("invitedBy", "name email");
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            await session.endSession();
        }
    }

    export async function _rejectInvitation(invitation) {
        invitation.status = INVITATION_STATUS.REJECTED;
        invitation.rejectedAt = new Date();
        await invitation.save();
        return invitation;
    }

    export async function _cancelInvitation(invitation) {
        invitation.status = INVITATION_STATUS.CANCELLED;
        invitation.cancelledAt = new Date();
        await invitation.save();
        return invitation;
    }
