import Project from "../models/project.model.js";
import ProjectMembership from "../models/projectMembership.model.js";
import ApiError from "../utils/ApiError.js";
import { PROJECT_ROLES } from "../constants/projectRoles.js";

export async function _getProjectById(projectId, organizationId) {
        const project = await Project.findOne({
            _id: projectId,
            organizationId,
        });

        if (!project) {
            throw new ApiError(404, "Project not found.");
        }

        return project;
    }

export async function _getProjectBySlug(slug, organizationId) {

        return await Project.findOne({
            organizationId,
            slug,
        });
    }

export async function _validateLastProjectAdmin(
        projectMembership
    ) {
        if (
            projectMembership.role !== PROJECT_ROLES.PROJECT_ADMIN
        ) {
            return;
        }

        const adminCount =
            await ProjectMembership.countDocuments({
                projectId: projectMembership.projectId,
                role: PROJECT_ROLES.PROJECT_ADMIN,
            });

        if (adminCount <= 1) {
            throw new ApiError(
                409,
                "Cannot remove the last Project Admin."
            );
        }
    }

export function _validateProjectRole(projectMembership, allowedRoles) {
        if (!allowedRoles.includes(projectMembership.role)) {
            throw new ApiError(
                403,
                "You are not authorized to perform this action."
            );
        }
    }

export function _validateProjectRoleValue(role) {
        if (
            !Object.values(PROJECT_ROLES).includes(role)
        ) {
            throw new ApiError(
                400,
                "Invalid project role."
            );
        }
    }
