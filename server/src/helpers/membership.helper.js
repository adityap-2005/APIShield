import Membership from "../models/membership.model.js";
import TeamMembership from "../models/teamMembership.model.js";
import ApiError from "../utils/ApiError.js";
import { MEMBERSHIP_ROLES } from "../constants/membershipRoles.js";
import { MEMBERSHIP_STATUS } from "../constants/membershipStatus.js";
import { ORGANIZATION_ROLES } from "../constants/organizationRoles.js";
import { _getOrganizationById } from "./organization.helper.js";

export async function _getActiveMembership(
        userId, organizationId) {

        await _getOrganizationById(organizationId);

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

export async function _getMembershipById(
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

export async function _getTeamMembership(teamId, membershipId) {
        const teamMembership = await TeamMembership.findOne({
            teamId,
            membershipId,
        });

        if (!teamMembership) {
            throw new ApiError(404, "Team membership not found.");
        }

        return teamMembership;
    }

export async function _getActiveTeamMembership(
        teamId,
        membershipId
    ) {
        const teamMembership =
            await TeamMembership.findOne({
                teamId,
                membershipId
            });

        if (!teamMembership) {
            throw new ApiError(
                403,
                "You are not a member of this team."
            );
        }

        return teamMembership;
    }

export async function _validateOrganizationRole(
        membership,
        allowedRoles
    ) {
        if (!allowedRoles.includes(membership.role)) {
            throw new ApiError(
                403,
                "You are not authorized to perform this action."
            );
        }
    }

export function _validateRole(role) {

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

export async function _validateInviter(organizationId, inviterId) {
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

export function _validateManagementPermission(
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

export async function _validateLastOwner(membership) {
    if (membership.role !== ORGANIZATION_ROLES.OWNER) {
        return;
    }

    const ownerCount = await Membership.countDocuments({
        organizationId: membership.organizationId,
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