import mongoose from "mongoose";

import Invitation from "../models/invitation.model.js";
import Membership from "../models/membership.model.js";
import Organization from "../models/organization.model.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";

import { MEMBERSHIP_ROLES } from "../constants/membershipRoles.js";
import { MEMBERSHIP_STATUS } from "../constants/membershipStatus.js";
import { INVITATION_STATUS } from "../constants/invitationStatus.js";

class InvitationService {

    async inviteMember(
        organizationId,
        inviterId,
        invitationData
    ) {
        const { email, role } = invitationData;

        const normalizedEmail = email.trim().toLowerCase();

        await this._validateOrganization(
            organizationId
        );

        await this._validateInviter(
            organizationId,
            inviterId
        );

        this._validateRole(role);

        await this._checkExistingMember(
            organizationId,
            normalizedEmail,
            inviterId
        );

        await this._checkPendingInvitation(
            organizationId,
            normalizedEmail
        )

        return await this._createInvitation(
            organizationId,
            inviterId,
            normalizedEmail,
            role
        );
    }

    async getOrganizationInvitations(
        organizationId,
        userId
    ) {
        await this._validateOrganization(
            organizationId
        );

        await this._validateInviter(
            organizationId,
            userId
        );

        const invitations = await Invitation.find({
            organizationId
        })
            .populate(
                "invitedBy",
                "name email avatar"
            )
            .sort({
                createdAt: -1
            });

        return invitations;
    }

    async getMyInvitations(email) {

        const invitations = await Invitation.find({
            email,
            status: INVITATION_STATUS.PENDING
        })
            .populate(
                "organizationId",
                "name slug"
            )
            .populate(
                "invitedBy",
                "name email"
            )
            .sort({
                createdAt: -1
            });

        return invitations;
    }

    async acceptInvitation(
        invitationId,
        user
    ) {

        const invitation =
            await this._validateInvitation(
                invitationId
            );

        this._validateInvitationOwner(
            invitation,
            user
        );

        this._validateInvitationStatus(
            invitation
        );

        this._validateInvitationExpiry(
            invitation
        );

        await this._checkExistingMembership(
            invitation,
            user
        );

        return await this._acceptInvitation(
            invitation,
            user
        );

    }

    async rejectInvitation(invitationId, user) {

        const invitation = await this._validateInvitation(invitationId);

        this._validateInvitationOwner(invitation, user);

        this._validateInvitationStatus(invitation);

        this._validateInvitationExpiry(invitation);

        return await this._rejectInvitation(invitation);

    }

    async cancelInvitation(
        organizationId,
        invitationId,
        userId
    ) {
        await this._validateOrganization(
            organizationId
        );

        await this._validateInviter(
            organizationId,
            userId
        );

        const invitation =
            await this._validateOrganizationInvitation(
                invitationId,
                organizationId
            );

        return await this._cancelInvitation(
            invitation
        );
    }

    async _validateOrganization(organizationId) {

        const organization = await Organization.findById(
            organizationId
        );

        if (!organization) {
            throw new ApiError(
                404,
                "Organization not found.");
        }

        return organization;
    }

    async _validateInviter(organizationId, inviterId) {
        const membership = await Membership.findOne({
            organizationId,
            userId: inviterId,
            status: MEMBERSHIP_STATUS.ACTIVE
        });

        if (!membership) {
            throw new ApiError(
                403,
                "You are not a member of this organization.");
        }

        if (
            membership.role !== MEMBERSHIP_ROLES.OWNER &&
            membership.role !== MEMBERSHIP_ROLES.ADMIN
        ) {
            throw new ApiError(
                403,
                "You don't have permission to invite members.");
        }

        return membership;
    }

    _validateRole(role) {

        if (
            !Object.values(MEMBERSHIP_ROLES)
                .includes(role)
        ) {
            throw new ApiError(
                400,
                "Invalid role.");
        }

        if (role === MEMBERSHIP_ROLES.OWNER) {
            throw new ApiError(
                400,
                "Owner role cannot be assigned."
            );
        }

    }

    async _checkExistingMember(organizationId, email, inviterId) {


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

    async _checkPendingInvitation(organizationId, email) {

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

    async _createInvitation(
        organizationId,
        inviterId,
        email,
        role
    ) {

        const expiresAt = new Date();

        expiresAt.setDate(
            expiresAt.getDate() + 7
        );

        return await Invitation.create({

            organizationId,

            email,

            role,

            invitedBy: inviterId,

            expiresAt

        });
    }

    async _validateInvitation(invitationId) {

        const invitation = await Invitation.findById(invitationId);

        if (!invitation) {
            throw new ApiError(
                404,
                "Invitation not found."
            );
        }

        return invitation;
    }

    _validateInvitationOwner(
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

    _validateInvitationStatus(
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

    _validateInvitationExpiry(
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

    async _checkExistingMembership(
        invitation,
        user
    ) {

        const membership = await Membership.findOne({
            organizationId:
                invitation.organizationId,
            userId: user._id,
            status:
                MEMBERSHIP_STATUS.ACTIVE
        });

        if (membership) {

            throw new ApiError(
                409,
                "You are already a member of this organization."
            );

        }

    }

    async _acceptInvitation(
        invitation,
        user
    ) {

        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            let membership = await Membership.findOne({
                userId: user._id,
                organizationId: invitation.organizationId
            }).session(session);

            if (membership) {

                if (
                    membership.status === MEMBERSHIP_STATUS.ACTIVE
                ) {
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

                const memberships = await Membership.create(
                    [
                        {
                            userId: user._id,
                            organizationId: invitation.organizationId,
                            role: invitation.role,
                            status: MEMBERSHIP_STATUS.ACTIVE,
                            invitedBy: invitation.invitedBy
                        }
                    ],
                    {
                        session
                    }
                );

                membership = memberships[0];
            }

            invitation.status = INVITATION_STATUS.ACCEPTED;
            invitation.acceptedAt = new Date();

            await invitation.save({ session });

            await session.commitTransaction();

            const updatedInvitation =
                await Invitation.findById(invitation._id)
                    .populate("organizationId", "name slug")
                    .populate("invitedBy", "name email");

            return updatedInvitation;

        } catch (error) {

            await session.abortTransaction();
            throw error;

        } finally {

            await session.endSession();

        }
    }

    async _rejectInvitation(invitation) {

        invitation.status = INVITATION_STATUS.REJECTED;

        invitation.rejectedAt = new Date();

        await invitation.save();

        return invitation;

    }

    async _validateOrganizationInvitation(
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

    async _cancelInvitation(invitation) {

        invitation.status = INVITATION_STATUS.CANCELLED;
        invitation.cancelledAt = new Date();

        await invitation.save();

        return invitation;
    }
}

const invitationService = new InvitationService();

export default invitationService;