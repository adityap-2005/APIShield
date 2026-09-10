import Invitation from "../models/invitation.model.js";

import auditLogService from "./auditLog.service.js";

import { INVITATION_STATUS } from "../constants/invitationStatus.js";
import { AUDIT_ACTIONS } from "../constants/auditActions.js";
import { AUDIT_ENTITY_TYPES } from "../constants/auditEntityTypes.js";

import { _getOrganizationById } from "../helpers/organization.helper.js";
import {
    _validateInviter,
    _validateRole
} from "../helpers/membership.helper.js";
import {
    _validateInvitation,
    _validateInvitationOwner,
    _validateInvitationStatus,
    _validateInvitationExpiry,
    _checkPendingInvitation,
    _validateOrganizationInvitation,
    _checkExistingMember,
    _createInvitation,
    _checkExistingMembership,
    _acceptInvitation,
    _rejectInvitation,
    _cancelInvitation
} from "../helpers/invitation.helper.js";

class InvitationService {

    async inviteMember(
        organizationId,
        inviterId,
        invitationData
    ) {
        const { email, role } = invitationData;

        const normalizedEmail = email.trim().toLowerCase();

        await _getOrganizationById(
            organizationId
        );

        await _validateInviter(
            organizationId,
            inviterId
        );

        _validateRole(role);

        await _checkExistingMember(
            organizationId,
            normalizedEmail,
            inviterId
        );

        await _checkPendingInvitation(
            organizationId,
            normalizedEmail
        )

        const invitation =
            await _createInvitation(
                organizationId,
                inviterId,
                normalizedEmail,
                role
            );

        const actor =
            await auditLogService.getActor(inviterId);

        await auditLogService.log({
            organizationId,

            actor,

            action:
                AUDIT_ACTIONS.MEMBER_INVITED,

            entity: {
                id: invitation._id,
                type:
                    AUDIT_ENTITY_TYPES.MEMBER,
                name: normalizedEmail
            },

            metadata: {
                invitedEmail: normalizedEmail,
                role,
                invitationExpiresAt:
                    invitation.expiresAt
            }
        });

        return invitation;
    }

    async getOrganizationInvitations(
        organizationId,
        userId
    ) {
        await _getOrganizationById(
            organizationId
        );

        await _validateInviter(
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
            await _validateInvitation(
                invitationId
            );

        _validateInvitationOwner(
            invitation,
            user
        );

        _validateInvitationStatus(
            invitation
        );

        _validateInvitationExpiry(
            invitation
        );

        await _checkExistingMembership(
            invitation,
            user
        );

        return await _acceptInvitation(
            invitation,
            user
        );

    }

    async rejectInvitation(invitationId, user) {

        const invitation = await _validateInvitation(invitationId);

        _validateInvitationOwner(invitation, user);

        _validateInvitationStatus(invitation);

        _validateInvitationExpiry(invitation);

        return await _rejectInvitation(invitation);

    }

    async cancelInvitation(
        organizationId,
        invitationId,
        userId
    ) {
        await _getOrganizationById(
            organizationId
        );

        await _validateInviter(
            organizationId,
            userId
        );

        const invitation =
            await _validateOrganizationInvitation(
                invitationId,
                organizationId
            );

        return await _cancelInvitation(
            invitation
        );
    }

}

const invitationService = new InvitationService();

export default invitationService;