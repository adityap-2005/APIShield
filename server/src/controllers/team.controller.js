import teamService from "../services/team.service.js"

class TeamController {

    async createTeam(req, res, next) {
        try {
            const team = await teamService.createTeam(
                req.params.organizationId,
                req.user._id,
                req.body
            );

            return res.status(201).json({
                success: true,
                message: "Team created successfully",
                data: team,
            });
        } catch (error) {
            next(error);
        }
    }

    async getOrganizationTeams(req, res, next) {
        try {
            const teams = await teamService.getOrganizationTeams(
                req.params.organizationId,
                req.user._id
            );

            return res.status(200).json({
                success: true,
                message: "Teams fetched successfully",
                data: teams,
            });
        } catch (error) {
            next(error);
        }
    }

    async getTeamById(req, res, next) {
        try {
            const team = await teamService.getTeamById(
                req.params.organizationId,
                req.params.teamId,
                req.user._id
            );

            return res.status(200).json({
                success: true,
                message: "Team fetched successfully",
                data: team,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateTeam(req, res, next) {
        try {
            const team = await teamService.updateTeam(
                req.params.organizationId,
                req.params.teamId,
                req.user._id,
                req.body
            );

            return res.status(200).json({
                success: true,
                message: "Team updated successfully",
                data: team,
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteTeam(req, res, next) {
        try {
            await teamService.deleteTeam(
                req.params.organizationId,
                req.params.teamId,
                req.user._id
            );

            return res.status(200).json({
                success: true,
                message: "Team deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    async addTeamMember(req, res, next) {
        try {
            const teamMembership = await teamService.addTeamMember(
                req.params.organizationId,
                req.params.teamId,
                req.body.membershipId,
                req.user._id
            );

            return res.status(201).json({
                success: true,
                message: "Member added to team successfully",
                data: teamMembership,
            });
        } catch (error) {
            next(error);
        }
    }

    async getTeamMembers(req, res, next) {
        try {
            const members = await teamService.getTeamMembers(
                req.params.organizationId,
                req.params.teamId,
                req.user._id
            );

            return res.status(200).json({
                success: true,
                message: "Team members fetched successfully",
                data: members,
            });
        } catch (error) {
            next(error);
        }
    }

    async removeTeamMember(req, res, next) {
        try {
            await teamService.removeTeamMember(
                req.params.organizationId,
                req.params.teamId,
                req.params.membershipId,
                req.user._id
            );

            return res.status(200).json({
                success: true,
                message: "Member removed from team successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    async updateTeamMemberRole(req, res, next) {
        try {
            await teamService.updateTeamMemberRole(
                req.params.organizationId,
                req.params.teamId,
                req.params.membershipId,
                req.user._id,
                req.body.role
            );

            return res.status(200).json({
                success: true,
                message: "Member role updated successfully.",
            });
        } catch (error) {
            next(error);
        }
    }

    async leaveTeam(req, res, next) {
        try {
            await teamService.leaveTeam(
                req.params.organizationId,
                req.params.teamId,
                req.user._id
            );

            return res.status(200).json({
                success: true,
                message: "Left team successfully",
            });
        } catch (error) {
            next(error);
        }
    }
}

const teamController = new TeamController();

export default teamController;