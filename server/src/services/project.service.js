import Project from "../models/project.model.js";
import ProjectMembership from "../models/projectMembership.model.js"

import auditLogService from "./auditLog.service.js";

import ApiError from "../utils/ApiError.js";

import { ORGANIZATION_ROLES } from "../constants/organizationRoles.js";
import { PROJECT_ROLES } from "../constants/projectRoles.js";
import { AUDIT_ACTIONS } from "../constants/auditActions.js";
import { AUDIT_ENTITY_TYPES } from "../constants/auditEntityTypes.js";

import {
    _getProjectById,
    _getProjectBySlug,
    _validateProjectRole,
    _validateProjectRoleValue,
    _validateLastProjectAdmin
} from "../helpers/project.helper.js"

import {
    _getOrganizationById
} from "../helpers/organization.helper.js"

import {
    _getActiveMembership,
    _getMembershipById,
    _getProjectMembership,
    _getActiveProjectMembership
} from "../helpers/membership.helper.js"

class ProjectService {

    async createProject(
        organizationId,
        userId,
        projectData
    ) {
        const { name, description } = projectData;

        await _getOrganizationById(
            organizationId
        );

        const requesterMembership = await _getActiveMembership(
            userId,
            organizationId
        )

        const slug = name
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");

        const existingProject =
            await _getProjectBySlug(
                slug,
                organizationId
            );

        if (existingProject) {
            throw new ApiError(
                409,
                "Project with this name already exists."
            );
        }

        const project = await Project.create({
            organizationId,
            name,
            slug,
            description,
            createdBy: userId,
            updatedBy: userId,
        });

        await ProjectMembership.create({
            organizationId,
            projectId: project._id,
            membershipId: requesterMembership._id,
            role: PROJECT_ROLES.PROJECT_ADMIN,
            addedBy: userId
        });

        const actor =
            await auditLogService.getActor(userId);

        await auditLogService.log({
            organizationId,

            projectId: project._id,

            actor,

            action:
                AUDIT_ACTIONS.PROJECT_CREATED,

            entity: {
                id: project._id,
                type:
                    AUDIT_ENTITY_TYPES.PROJECT,
                name: project.name
            },

            metadata: {}
        });

        return project;
    }

    async getOrganizationProjects(
        organizationId,
        userId
    ) {
        await _getOrganizationById(
            organizationId
        );

        const membership = await _getActiveMembership(
            userId,
            organizationId
        );

        const isOrganizationAdmin = [
            ORGANIZATION_ROLES.OWNER,
            ORGANIZATION_ROLES.ADMIN,
        ].includes(membership.role);

        const projectQuery = { organizationId };
        if (!isOrganizationAdmin) {
            const projectMemberships = await ProjectMembership.find({
                organizationId,
                membershipId: membership._id,
            }).select("projectId");
            projectQuery._id = {
                $in: projectMemberships.map(({ projectId }) => projectId),
            };
        }

        const projects = await Project.find(projectQuery).sort({ createdAt: -1 });

        return projects;
    }

    async getProjectById(
        organizationId,
        projectId,
        userId
    ) {
        await _getOrganizationById(
            organizationId
        );

        const membership = await _getActiveMembership(
            userId,
            organizationId
        );

        const project = await _getProjectById(
            projectId,
            organizationId
        );

        const isOrganizationAdmin = [
            ORGANIZATION_ROLES.OWNER,
            ORGANIZATION_ROLES.ADMIN,
        ].includes(membership.role);
        if (!isOrganizationAdmin) {
            await _getActiveProjectMembership(projectId, membership._id);
        }

        return project;
    }

    async updateProject(
        organizationId,
        projectId,
        userId,
        projectData
    ) {
        const { name, description } = projectData;

        await _getOrganizationById(
            organizationId
        );

        const organizationMembership =
            await _getActiveMembership(
                userId,
                organizationId
            );

        const projectMembership =
            await _getActiveProjectMembership(
                projectId,
                organizationMembership._id
            );

        _validateProjectRole(
            projectMembership,
            [
                PROJECT_ROLES.PROJECT_ADMIN
            ]
        );

        const project = await _getProjectById(
            projectId,
            organizationId
        );

        if (name && name !== project.name) {

            const slug = name
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "-")
                .replace(/[^a-z0-9-]/g, "");

            const existingProject =
                await _getProjectBySlug(
                    slug,
                    organizationId
                );

            if (
                existingProject &&
                existingProject._id.toString() !==
                project._id.toString()
            ) {
                throw new ApiError(
                    409,
                    "Project with this name already exists."
                );
            }

            project.name = name;
            project.slug = slug;
        }

        if (description !== undefined) {
            project.description = description;
        }

        project.updatedBy = userId;

        await project.save();

        return project;
    }

    async deleteProject(
        organizationId,
        projectId,
        userId
    ) {
        await _getOrganizationById(
            organizationId
        );

        const organizationMembership =
            await _getActiveMembership(
                userId,
                organizationId
            );

        const isOrganizationAdmin =
            [
                ORGANIZATION_ROLES.OWNER,
                ORGANIZATION_ROLES.ADMIN,
            ].includes(organizationMembership.role);

        if (!isOrganizationAdmin) {

            const projectMembership =
                await _getActiveProjectMembership(
                    projectId,
                    organizationMembership._id
                );

            _validateProjectRole(
                projectMembership,
                [
                    PROJECT_ROLES.PROJECT_ADMIN
                ]
            );
        }

        const project = await _getProjectById(
            projectId,
            organizationId
        );

        await ProjectMembership.deleteMany({
            projectId: project._id
        });

        await project.deleteOne();

        const actor =
            await auditLogService.getActor(userId);

        await auditLogService.log({
            organizationId,

            projectId: project._id,

            actor,

            action:
                AUDIT_ACTIONS.PROJECT_DELETED,

            entity: {
                id: project._id,
                type:
                    AUDIT_ENTITY_TYPES.PROJECT,
                name: project.name
            },

            metadata: {}
        });

        return;
    }

    async addProjectMember(
        organizationId,
        projectId,
        membershipId,
        userId
    ) {
        await _getOrganizationById(
            organizationId
        );

        const organizationMembership =
            await _getActiveMembership(
                userId,
                organizationId
            );

        const requesterProjectMembership =
            await _getActiveProjectMembership(
                projectId,
                organizationMembership._id
            );

        _validateProjectRole(
            requesterProjectMembership,
            [
                PROJECT_ROLES.PROJECT_ADMIN
            ]
        );

        const project = await _getProjectById(
            projectId,
            organizationId
        );

        const membership = await _getMembershipById(
            membershipId,
            organizationId
        );

        const existingProjectMember =
            await ProjectMembership.findOne({
                projectId,
                membershipId,
            });

        if (existingProjectMember) {
            throw new ApiError(
                409,
                "Member is already part of this project."
            );
        }

        const projectMembership =
            await ProjectMembership.create({
                organizationId,
                projectId,
                membershipId,
                role: PROJECT_ROLES.MEMBER,
                addedBy: userId,
            });

        const actor =
            await auditLogService.getActor(userId);

        await auditLogService.log({
            organizationId,

            projectId,

            actor,

            action:
                AUDIT_ACTIONS.PROJECT_MEMBER_ADDED,

            entity: {
                id: project._id,
                type:
                    AUDIT_ENTITY_TYPES.PROJECT,
                name: project.name
            },

            metadata: {
                memberId: membership._id,
                role: projectMembership.role
            }
        });

        return projectMembership;
    }

    async getProjectMembers(
        organizationId,
        projectId,
        userId
    ) {
        await _getOrganizationById(
            organizationId
        );

        const organizationMembership =
            await _getActiveMembership(
                userId,
                organizationId
            );

        const isOrganizationAdmin =
            [
                ORGANIZATION_ROLES.OWNER,
                ORGANIZATION_ROLES.ADMIN,
            ].includes(organizationMembership.role);

        if (!isOrganizationAdmin) {
            await _getActiveProjectMembership(
                projectId,
                organizationMembership._id
            );
        }

        await _getProjectById(
            projectId,
            organizationId
        );

        const projectMembers = await ProjectMembership.find({
            organizationId,
            projectId,
        })
            .populate({
                path: "membershipId",
                populate: {
                    path: "userId",
                    select: "name email avatar",
                },
            });

        return projectMembers.map(member => ({
            projectMembershipId: member._id,
            projectRole: member.role,
            organizationRole: member.membershipId.role,
            status: member.membershipId.status,
            createdAt: member.createdAt,
            user: {
                id: member.membershipId.userId._id,
                name: member.membershipId.userId.name,
                email: member.membershipId.userId.email,
                avatar: member.membershipId.userId.avatar,
            },
        }));
    }

    async removeProjectMember(
        organizationId,
        projectId,
        membershipId,
        userId
    ) {
        await _getOrganizationById(
            organizationId
        );

        const organizationMembership =
            await _getActiveMembership(
                userId,
                organizationId
            );

        const isOrganizationAdmin = [
            ORGANIZATION_ROLES.OWNER,
            ORGANIZATION_ROLES.ADMIN,
        ].includes(organizationMembership.role);

        if (!isOrganizationAdmin) {
            const requesterProjectMembership =
                await _getActiveProjectMembership(
                    projectId,
                    organizationMembership._id
                );

            _validateProjectRole(
                requesterProjectMembership,
                [
                    PROJECT_ROLES.PROJECT_ADMIN
                ]
            );
        }

        const project = await _getProjectById(
            projectId,
            organizationId
        );

        const membership = await _getMembershipById(
            membershipId,
            organizationId
        );

        const projectMembership =
            await _getProjectMembership(
                projectId,
                membershipId
            );

        if (
            !isOrganizationAdmin &&
            projectMembership.role === PROJECT_ROLES.PROJECT_ADMIN
        ) {
            throw new ApiError(
                403,
                "You cannot remove another Project Admin."
            );
        }

        await projectMembership.deleteOne();

        const actor =
            await auditLogService.getActor(userId);

        await auditLogService.log({
            organizationId,
            projectId,

            actor,

            action:
                AUDIT_ACTIONS.PROJECT_MEMBER_REMOVED,

            entity: {
                id: project._id,
                type:
                    AUDIT_ENTITY_TYPES.PROJECT,
                name: project.name
            },

            metadata: {
                memberId: membership._id,
                role: projectMembership.role
            }
        });

        return;
    }

    async updateProjectMemberRole(
        organizationId,
        projectId,
        membershipId,
        userId,
        role
    ) {
        await _validateProjectRoleValue(role);

        await _getOrganizationById(
            organizationId
        );

        const organizationMembership =
            await _getActiveMembership(
                userId,
                organizationId
            );

        const isOrganizationAdmin =
            [
                ORGANIZATION_ROLES.OWNER,
                ORGANIZATION_ROLES.ADMIN,
            ].includes(organizationMembership.role);

        if (!isOrganizationAdmin) {

            const requesterProjectMembership =
                await _getActiveProjectMembership(
                    projectId,
                    organizationMembership._id
                );

            _validateProjectRole(
                requesterProjectMembership,
                [
                    PROJECT_ROLES.PROJECT_ADMIN
                ]
            );
        }

        await _getProjectById(
            projectId,
            organizationId
        );

        await _getMembershipById(
            membershipId,
            organizationId
        );

        const projectMembership =
            await _getProjectMembership(
                projectId,
                membershipId
            );

        if (projectMembership.role === role) {
            throw new ApiError(
                400,
                "Project member already has this role."
            );
        }

        if (
            organizationMembership._id.equals(
                projectMembership.membershipId
            )
        ) {
            throw new ApiError(
                400,
                "You cannot change your own project role."
            );
        }

        if (projectMembership.role === role) {
            throw new ApiError(
                400,
                "Project member already has this role."
            );
        }

        if (
            !isOrganizationAdmin &&
            projectMembership.role === PROJECT_ROLES.PROJECT_ADMIN
        ) {
            throw new ApiError(
                403,
                "You cannot change another Project Admin's role."
            );
        }

        if (
            projectMembership.role === PROJECT_ROLES.PROJECT_ADMIN &&
            role === PROJECT_ROLES.MEMBER
        ) {
            await _validateLastProjectAdmin(
                projectMembership
            );
        }

        const previousRole = projectMembership.role;

        projectMembership.role = role;

        await projectMembership.save();

        if (role === PROJECT_ROLES.PROJECT_ADMIN) {

            const actor =
                await auditLogService.getActor(userId);

            const project =
                await _getProjectById(
                    projectId,
                    organizationId
                );

            await auditLogService.log({
                organizationId,

                projectId,

                actor,

                action:
                    AUDIT_ACTIONS.PROJECT_ADMIN_ASSIGNED,

                entity: {
                    id: project._id,
                    type:
                        AUDIT_ENTITY_TYPES.PROJECT,
                    name: project.name
                },

                metadata: {
                    memberId:
                        projectMembership.membershipId,

                    previousRole,

                    newRole:
                        PROJECT_ROLES.PROJECT_ADMIN
                }
            });
        }

        return {
            projectMembershipId: projectMembership._id,
            membershipId: projectMembership.membershipId,
            role: projectMembership.role
        };
    }

    async leaveProject(
        organizationId,
        projectId,
        userId
    ) {
        await _getOrganizationById(
            organizationId
        );

        const organizationMembership =
            await _getActiveMembership(
                userId,
                organizationId
            );

        await _getProjectById(
            projectId,
            organizationId
        );

        const projectMembership =
            await _getActiveProjectMembership(
                projectId,
                organizationMembership._id
            );

        await _validateLastProjectAdmin(
            projectMembership
        );

        await projectMembership.deleteOne();

        return;
    }
}

const projectService = new ProjectService();

export default projectService;