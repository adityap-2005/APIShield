import projectService from "../services/project.service.js"

class ProjectController {

    async createProject(req, res, next) {
        try {
            const project = await projectService.createProject(
                req.params.organizationId,
                req.user._id,
                req.body
            );

            return res.status(201).json({
                success: true,
                message: "Project created successfully",
                data: project,
            });
        } catch (error) {
            next(error);
        }
    }

    async getOrganizationProjects(req, res, next) {
        try {
            const projects = await projectService.getOrganizationProjects(
                req.params.organizationId,
                req.user._id
            );

            return res.status(200).json({
                success: true,
                message: "Projects fetched successfully",
                data: projects,
            });
        } catch (error) {
            next(error);
        }
    }

    async getProjectById(req, res, next) {
        try {
            const project = await projectService.getProjectById(
                req.params.organizationId,
                req.params.projectId,
                req.user._id
            );

            return res.status(200).json({
                success: true,
                message: "Project fetched successfully",
                data: project,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateProject(req, res, next) {
        try {
            const project = await projectService.updateProject(
                req.params.organizationId,
                req.params.projectId,
                req.user._id,
                req.body
            );

            return res.status(200).json({
                success: true,
                message: "Project updated successfully",
                data: project,
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteProject(req, res, next) {
        try {
            await projectService.deleteProject(
                req.params.organizationId,
                req.params.projectId,
                req.user._id
            );

            return res.status(200).json({
                success: true,
                message: "Project deleted successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    async addProjectMember(req, res, next) {
        try {
            const projectMembership = await projectService.addProjectMember(
                req.params.organizationId,
                req.params.projectId,
                req.body.membershipId,
                req.user._id
            );

            return res.status(201).json({
                success: true,
                message: "Member added to project successfully",
                data: projectMembership,
            });
        } catch (error) {
            next(error);
        }
    }

    async getProjectMembers(req, res, next) {
        try {
            const members = await projectService.getProjectMembers(
                req.params.organizationId,
                req.params.projectId,
                req.user._id
            );

            return res.status(200).json({
                success: true,
                message: "Project members fetched successfully",
                data: members,
            });
        } catch (error) {
            next(error);
        }
    }

    async removeProjectMember(req, res, next) {
        try {
            await projectService.removeProjectMember(
                req.params.organizationId,
                req.params.projectId,
                req.params.membershipId,
                req.user._id
            );

            return res.status(200).json({
                success: true,
                message: "Member removed from project successfully",
            });
        } catch (error) {
            next(error);
        }
    }

    async updateProjectMemberRole(req, res, next) {
        try {
            await projectService.updateProjectMemberRole(
                req.params.organizationId,
                req.params.projectId,
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

    async leaveProject(req, res, next) {
        try {
            await projectService.leaveProject(
                req.params.organizationId,
                req.params.projectId,
                req.user._id
            );

            return res.status(200).json({
                success: true,
                message: "Left project successfully",
            });
        } catch (error) {
            next(error);
        }
    }
}

const projectController = new ProjectController();

export default projectController;