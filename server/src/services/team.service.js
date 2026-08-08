import Team from "../models/team.model.js";
import TeamMembership from "../models/teamMembership.model.js"
import Organization from "../models/organization.model.js";
import Membership from "../models/membership.model.js";

import auditLogService from "./auditLog.service.js";

import ApiError from "../utils/ApiError.js";

import { MEMBERSHIP_STATUS } from "../constants/membershipStatus.js";
import { ORGANIZATION_ROLES } from "../constants/organizationRoles.js";
import { TEAM_ROLES } from "../constants/teamRoles.js";
import { AUDIT_ACTIONS } from "../constants/auditActions.js";
import { AUDIT_ENTITY_TYPES } from "../constants/auditEntityTypes.js";

class TeamService {

    async createTeam(
        organizationId,
        userId,
        teamData
    ) {
        const { name, description } = teamData;

        await this._getOrganizationById(
            organizationId
        );

        const requesterMembership = await this._getActiveMembership(
            userId,
            organizationId
        )

        const slug = name
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");

        const existingTeam =
            await this._getTeamBySlug(
                slug,
                organizationId
            );

        if (existingTeam) {
            throw new ApiError(
                409,
                "Team with this name already exists."
            );
        }

        const team = await Team.create({
            organizationId,
            name,
            slug,
            description,
            createdBy: userId,
            updatedBy: userId,
        });

        await TeamMembership.create({
            organizationId,
            teamId: team._id,
            membershipId: requesterMembership._id,
            role: TEAM_ROLES.TEAM_ADMIN,
            addedBy: userId
        });

        const actor =
            await auditLogService.getActor(userId);

        await auditLogService.log({
            organizationId,

            teamId: team._id,

            actor,

            action:
                AUDIT_ACTIONS.TEAM_CREATED,

            entity: {
                id: team._id,
                type:
                    AUDIT_ENTITY_TYPES.TEAM,
                name: team.name
            },

            metadata: {}
        });

        return team;
    }

    async getOrganizationTeams(
        organizationId,
        userId
    ) {
        await this._getOrganizationById(
            organizationId
        );

        await this._getActiveMembership(
            userId,
            organizationId
        );

        const teams = await Team.find({
            organizationId,
        })
            .sort({ createdAt: -1 });

        return teams;
    }

    async getTeamById(
        organizationId,
        teamId,
        userId
    ) {
        await this._getOrganizationById(
            organizationId
        );

        await this._getActiveMembership(
            userId,
            organizationId
        );

        const team = await this._getTeamById(
            teamId,
            organizationId
        );

        return team;
    }

    async updateTeam(
        organizationId,
        teamId,
        userId,
        teamData
    ) {
        const { name, description } = teamData;

        await this._getOrganizationById(
            organizationId
        );

        const organizationMembership =
            await this._getActiveMembership(
                userId,
                organizationId
            );

        const teamMembership =
            await this._getActiveTeamMembership(
                teamId,
                organizationMembership._id
            );

        this._validateTeamRole(
            teamMembership,
            [
                TEAM_ROLES.TEAM_ADMIN
            ]
        );

        const team = await this._getTeamById(
            teamId,
            organizationId
        );

        if (name && name !== team.name) {

            const slug = name
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "");

            const existingTeam =
                await this._getTeamBySlug(
                    slug,
                    organizationId
                );

            if (
                existingTeam &&
                existingTeam._id.toString() !==
                team._id.toString()
            ) {
                throw new ApiError(
                    409,
                    "Team with this name already exists."
                );
            }

            team.name = name;
            team.slug = slug;
        }

        if (description !== undefined) {
            team.description = description;
        }

        team.updatedBy = userId;

        await team.save();

        return team;
    }


    async deleteTeam(
        organizationId,
        teamId,
        userId
    ) {
        await this._getOrganizationById(
            organizationId
        );

        const organizationMembership =
            await this._getActiveMembership(
                userId,
                organizationId
            );

        const isOrganizationAdmin =
            [
                ORGANIZATION_ROLES.OWNER,
                ORGANIZATION_ROLES.ADMIN,
            ].includes(organizationMembership.role);

        if (!isOrganizationAdmin) {

            const teamMembership =
                await this._getActiveTeamMembership(
                    teamId,
                    organizationMembership._id
                );

            this._validateTeamRole(
                teamMembership,
                [
                    TEAM_ROLES.TEAM_ADMIN
                ]
            );
        }

        const team = await this._getTeamById(
            teamId,
            organizationId
        );

        await TeamMembership.deleteMany({
            teamId: team._id
        });

        await team.deleteOne();

        const actor =
            await auditLogService.getActor(userId);

        await auditLogService.log({
            organizationId,

            teamId: team._id,

            actor,

            action:
                AUDIT_ACTIONS.TEAM_DELETED,

            entity: {
                id: team._id,
                type:
                    AUDIT_ENTITY_TYPES.TEAM,
                name: team.name
            },

            metadata: {}
        });

        return;
    }

    async addTeamMember(
        organizationId,
        teamId,
        membershipId,
        userId
    ) {
        await this._getOrganizationById(
            organizationId
        );

        const organizationMembership =
            await this._getActiveMembership(
                userId,
                organizationId
            );

        const requesterTeamMembership =
            await this._getActiveTeamMembership(
                teamId,
                organizationMembership._id
            );

        this._validateTeamRole(
            requesterTeamMembership,
            [
                TEAM_ROLES.TEAM_ADMIN
            ]
        );

        const team = await this._getTeamById(
            teamId,
            organizationId
        );

        const membership = await this._getMembershipById(
            membershipId,
            organizationId
        );

        const existingTeamMember =
            await TeamMembership.findOne({
                teamId,
                membershipId,
            });

        if (existingTeamMember) {
            throw new ApiError(
                409,
                "Member is already part of this team."
            );
        }

        const teamMembership =
            await TeamMembership.create({
                organizationId,
                teamId,
                membershipId,
                role: TEAM_ROLES.MEMBER,
                addedBy: userId,
            });

        const actor =
            await auditLogService.getActor(userId);

        await auditLogService.log({
            organizationId,

            teamId,

            actor,

            action:
                AUDIT_ACTIONS.TEAM_MEMBER_ADDED,

            entity: {
                id: team._id,
                type:
                    AUDIT_ENTITY_TYPES.TEAM,
                name: team.name
            },

            metadata: {
                memberId: membership._id,
                role: teamMembership.role
            }
        });

        return teamMembership;
    }

    async getTeamMembers(
        organizationId,
        teamId,
        userId
    ) {
        await this._getOrganizationById(
            organizationId
        );

        const organizationMembership =
            await this._getActiveMembership(
                userId,
                organizationId
            );

        const isOrganizationAdmin =
            [
                ORGANIZATION_ROLES.OWNER,
                ORGANIZATION_ROLES.ADMIN,
            ].includes(organizationMembership.role);

        if (!isOrganizationAdmin) {
            await this._getActiveTeamMembership(
                teamId,
                organizationMembership._id
            );
        }

        await this._getTeamById(
            teamId,
            organizationId
        );

        const teamMembers = await TeamMembership.find({
            organizationId,
            teamId,
        })
            .populate({
                path: "membershipId",
                populate: {
                    path: "userId",
                    select: "name email avatar",
                },
            });

        return teamMembers.map(member => ({
            teamMembershipId: member._id,
            teamRole: member.role,
            organizationRole: member.membershipId.role,
            status: member.membershipId.status,
            user: {
                id: member.membershipId.userId._id,
                name: member.membershipId.userId.name,
                email: member.membershipId.userId.email,
                avatar: member.membershipId.userId.avatar,
            },
        }));
    }

    async removeTeamMember(
        organizationId,
        teamId,
        membershipId,
        userId
    ) {
        await this._getOrganizationById(
            organizationId
        );

        const organizationMembership =
            await this._getActiveMembership(
                userId,
                organizationId
            );

        const isOrganizationAdmin = [
            ORGANIZATION_ROLES.OWNER,
            ORGANIZATION_ROLES.ADMIN,
        ].includes(organizationMembership.role);

        if (!isOrganizationAdmin) {
            const requesterTeamMembership =
                await this._getActiveTeamMembership(
                    teamId,
                    organizationMembership._id
                );

            this._validateTeamRole(
                requesterTeamMembership,
                [
                    TEAM_ROLES.TEAM_ADMIN
                ]
            );
        }

        const team = await this._getTeamById(
            teamId,
            organizationId
        );

        const membership = await this._getMembershipById(
            membershipId,
            organizationId
        );

        const teamMembership =
            await this._getTeamMembership(
                teamId,
                membershipId
            );

        if (
            !isOrganizationAdmin &&
            teamMembership.role === TEAM_ROLES.TEAM_ADMIN
        ) {
            throw new ApiError(
                403,
                "You cannot remove another Team Admin."
            );
        }

        await teamMembership.deleteOne();

        const actor =
            await auditLogService.getActor(userId);

        await auditLogService.log({
            organizationId,
            teamId,

            actor,

            action:
                AUDIT_ACTIONS.TEAM_MEMBER_REMOVED,

            entity: {
                id: team._id,
                type:
                    AUDIT_ENTITY_TYPES.TEAM,
                name: team.name
            },

            metadata: {
                memberId: membership._id,
                role: teamMembership.role
            }
        });

        return;
    }

    async updateTeamMemberRole(
        organizationId,
        teamId,
        membershipId,
        userId,
        role
    ) {
        await this._validateTeamRoleValue(role);

        await this._getOrganizationById(
            organizationId
        );

        const organizationMembership =
            await this._getActiveMembership(
                userId,
                organizationId
            );

        const isOrganizationAdmin =
            [
                ORGANIZATION_ROLES.OWNER,
                ORGANIZATION_ROLES.ADMIN,
            ].includes(organizationMembership.role);

        if (!isOrganizationAdmin) {

            const requesterTeamMembership =
                await this._getActiveTeamMembership(
                    teamId,
                    organizationMembership._id
                );

            this._validateTeamRole(
                requesterTeamMembership,
                [
                    TEAM_ROLES.TEAM_ADMIN
                ]
            );
        }

        await this._getTeamById(
            teamId,
            organizationId
        );

        await this._getMembershipById(
            membershipId,
            organizationId
        );

        const teamMembership =
            await this._getTeamMembership(
                teamId,
                membershipId
            );

        if (teamMembership.role === role) {
            throw new ApiError(
                400,
                "Team member already has this role."
            );
        }

        if (
            organizationMembership._id.equals(
                teamMembership.membershipId
            )
        ) {
            throw new ApiError(
                400,
                "You cannot change your own team role."
            );
        }

        if (teamMembership.role === role) {
            throw new ApiError(
                400,
                "Team member already has this role."
            );
        }

        if (
            !isOrganizationAdmin &&
            teamMembership.role === TEAM_ROLES.TEAM_ADMIN
        ) {
            throw new ApiError(
                403,
                "You cannot change another Team Admin's role."
            );
        }

        if (
            teamMembership.role === TEAM_ROLES.TEAM_ADMIN &&
            role === TEAM_ROLES.MEMBER
        ) {
            await this._validateLastTeamAdmin(
                teamMembership
            );
        }

        const previousRole = teamMembership.role;

        teamMembership.role = role;

        await teamMembership.save();

        if (role === TEAM_ROLES.TEAM_ADMIN) {

            const actor =
                await auditLogService.getActor(userId);

            const team =
                await this._getTeamById(
                    teamId,
                    organizationId
                );

            await auditLogService.log({
                organizationId,

                teamId,

                actor,

                action:
                    AUDIT_ACTIONS.TEAM_ADMIN_ASSIGNED,

                entity: {
                    id: team._id,
                    type:
                        AUDIT_ENTITY_TYPES.TEAM,
                    name: team.name
                },

                metadata: {
                    memberId:
                        teamMembership.membershipId,

                    previousRole,

                    newRole:
                        TEAM_ROLES.TEAM_ADMIN
                }
            });
        }
        
        return {
            teamMembershipId: teamMembership._id,
            membershipId: teamMembership.membershipId,
            role: teamMembership.role
        };
    }

    async leaveTeam(
        organizationId,
        teamId,
        userId
    ) {
        await this._getOrganizationById(
            organizationId
        );

        const organizationMembership =
            await this._getActiveMembership(
                userId,
                organizationId
            );

        await this._getTeamById(
            teamId,
            organizationId
        );

        const teamMembership =
            await this._getActiveTeamMembership(
                teamId,
                organizationMembership._id
            );

        await this._validateLastTeamAdmin(
            teamMembership
        );

        await teamMembership.deleteOne();

        return;
    }

    // ======================
    // Helper Methods
    // ======================

    async _getOrganizationById(organizationId) {
        const organization = await Organization.findById(organizationId);

        if (!organization) {
            throw new ApiError(404, "Organization not found.");
        }

        return organization;
    }

    async _getTeamById(teamId, organizationId) {
        const team = await Team.findOne({
            _id: teamId,
            organizationId,
        });

        if (!team) {
            throw new ApiError(404, "Team not found.");
        }

        return team;
    }

    async _getTeamBySlug(slug, organizationId) {

        return await Team.findOne({
            organizationId,
            slug,
        });
    }

    async _getTeamMembership(teamId, membershipId) {
        const teamMembership = await TeamMembership.findOne({
            teamId,
            membershipId,
        });

        if (!teamMembership) {
            throw new ApiError(404, "Team membership not found.");
        }

        return teamMembership;
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

    async _getActiveMembership(userId, organizationId) {

        await this._getOrganizationById(
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

    async _validateOrganizationRole(
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

    _validateTeamRole(teamMembership, allowedRoles) {
        if (!allowedRoles.includes(teamMembership.role)) {
            throw new ApiError(
                403,
                "You are not authorized to perform this action."
            );
        }
    }

    async _getActiveTeamMembership(
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

    async _validateLastTeamAdmin(
        teamMembership
    ) {
        if (
            teamMembership.role !== TEAM_ROLES.TEAM_ADMIN
        ) {
            return;
        }

        const adminCount =
            await TeamMembership.countDocuments({
                teamId: teamMembership.teamId,
                role: TEAM_ROLES.TEAM_ADMIN,
            });

        if (adminCount <= 1) {
            throw new ApiError(
                409,
                "Cannot remove the last Team Admin."
            );
        }
    }

    _validateTeamRoleValue(role) {
        if (
            !Object.values(TEAM_ROLES).includes(role)
        ) {
            throw new ApiError(
                400,
                "Invalid team role."
            );
        }
    }
}

const teamService = new TeamService();

export default teamService;