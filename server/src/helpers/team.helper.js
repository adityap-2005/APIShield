import Team from "../models/team.model.js";
import TeamMembership from "../models/teamMembership.model.js";
import ApiError from "../utils/ApiError.js";
import { TEAM_ROLES } from "../constants/teamRoles.js";

export async function _getTeamById(teamId, organizationId) {
        const team = await Team.findOne({
            _id: teamId,
            organizationId,
        });

        if (!team) {
            throw new ApiError(404, "Team not found.");
        }

        return team;
    }

export async function _getTeamBySlug(slug, organizationId) {

        return await Team.findOne({
            organizationId,
            slug,
        });
    }

export async function _validateLastTeamAdmin(
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

export function _validateTeamRole(teamMembership, allowedRoles) {
        if (!allowedRoles.includes(teamMembership.role)) {
            throw new ApiError(
                403,
                "You are not authorized to perform this action."
            );
        }
    }

export function _validateTeamRoleValue(role) {
        if (
            !Object.values(TEAM_ROLES).includes(role)
        ) {
            throw new ApiError(
                400,
                "Invalid team role."
            );
        }
    }
