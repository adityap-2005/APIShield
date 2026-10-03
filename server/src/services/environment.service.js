import Environment from "../models/environment.model.js";
import Integration from "../models/integration.model.js";
import ApiError from "../utils/ApiError.js";

import {
    _getOrganizationById
} from "../helpers/organization.helper.js";

import {
    _getActiveMembership,
    _getActiveProjectMembership
} from "../helpers/membership.helper.js";

import {
    _getProjectById
} from "../helpers/project.helper.js";

import {
    ORGANIZATION_ROLES
} from "../constants/organizationRoles.js";

import {
    PROJECT_ROLES
} from "../constants/projectRoles.js";


class EnvironmentService {

    async createEnvironment(
        userId,
        organizationId,
        projectId,
        integrationId,
        data
    ) {

        const { name } = data;

        await _getOrganizationById(
            organizationId
        );

        const membership =
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
                membership._id
            );

        const isOrgAdmin =
            membership.role === ORGANIZATION_ROLES.OWNER ||
            membership.role === ORGANIZATION_ROLES.ADMIN;

        const isProjectAdmin =
            projectMembership.role === PROJECT_ROLES.PROJECT_ADMIN;

        if (!isOrgAdmin && !isProjectAdmin) {
            throw new ApiError(
                403,
                "You do not have permission to create an environment."
            );
        }

        const integration =
            await Integration.findOne({
                _id: integrationId,
                organizationId,
                projectId
            });

        if (!integration) {
            throw new ApiError(
                404,
                "Integration not found."
            );
        }

        let environment;

        try {
            const createdEnvironment =
                await Environment.create({
                    organizationId,
                    projectId,
                    integrationId,
                    name,
                    createdBy: userId
                });

            environment = createdEnvironment;

        } catch (error) {

            if (error.code === 11000) {
                throw new ApiError(
                    409,
                    `${name} environment already exists for this integration.`
                );
            }

            throw error;
        }

        return environment;
    }

    async getEnvironments(
        userId,
        organizationId,
        projectId,
        integrationId
    ) {
        await _getOrganizationById(
            organizationId
        );

        const membership =
            await _getActiveMembership(
                userId,
                organizationId
            );

        await _getProjectById(
            projectId,
            organizationId
        );

        await _getActiveProjectMembership(
            projectId,
            membership._id
        );

        const integration =
            await Integration.findOne({
                _id: integrationId,
                organizationId,
                projectId
            });

        if (!integration) {
            throw new ApiError(
                404,
                "Integration not found."
            );
        }

        const environments =
            await Environment.find({
                integrationId,
                organizationId,
                projectId
            })
                .select(
                    "_id integrationId name status createdAt updatedAt"
                )
                .sort({
                    createdAt: -1
                });

        return environments;
    }

    async getEnvironment(
        userId,
        organizationId,
        projectId,
        integrationId,
        environmentId
    ) {
        await _getOrganizationById(
            organizationId
        );

        const membership =
            await _getActiveMembership(
                userId,
                organizationId
            );

        await _getProjectById(
            projectId,
            organizationId
        );

        await _getActiveProjectMembership(
            projectId,
            membership._id
        );

        const integration =
            await Integration.findOne({
                _id: integrationId,
                organizationId,
                projectId
            });

        if (!integration) {
            throw new ApiError(
                404,
                "Integration not found."
            );
        }

        const environment =
            await Environment.findOne({
                _id: environmentId,
                integrationId,
                organizationId,
                projectId
            }).select(
                "_id integrationId name status createdAt updatedAt"
            );

        if (!environment) {
            throw new ApiError(
                404,
                "Environment not found."
            );
        }

        return environment;
    }

    async updateEnvironment(
        userId,
        organizationId,
        projectId,
        integrationId,
        environmentId,
        data
    ) {
        await _getOrganizationById(
            organizationId
        );

        const membership =
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
                membership._id
            );

        const isOrgAdmin =
            membership.role === ORGANIZATION_ROLES.OWNER ||
            membership.role === ORGANIZATION_ROLES.ADMIN;

        const isProjectAdmin =
            projectMembership.role === PROJECT_ROLES.PROJECT_ADMIN;

        if (!isOrgAdmin && !isProjectAdmin) {
            throw new ApiError(
                403,
                "You do not have permission to update this environment."
            );
        }

        const environment =
            await Environment.findOne({
                _id: environmentId,
                integrationId,
                organizationId,
                projectId
            });

        if (!environment) {
            throw new ApiError(
                404,
                "Environment not found."
            );
        }

        const allowedFields = [
            "name",
            "status"
        ];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                environment[field] = data[field];
            }
        }

        try {
            await environment.save();
        } catch (error) {

            if (error.code === 11000) {
                throw new ApiError(
                    409,
                    `${environment.name} environment already exists for this integration.`
                );
            }

            throw error;
        }

        return environment;
    }

    async disableEnvironment(
        userId,
        organizationId,
        projectId,
        integrationId,
        environmentId
    ) {
        await _getOrganizationById(
            organizationId
        );

        const membership =
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
                membership._id
            );

        const isOrgAdmin =
            membership.role === ORGANIZATION_ROLES.OWNER ||
            membership.role === ORGANIZATION_ROLES.ADMIN;

        const isProjectAdmin =
            projectMembership.role === PROJECT_ROLES.PROJECT_ADMIN;

        if (!isOrgAdmin && !isProjectAdmin) {
            throw new ApiError(
                403,
                "You do not have permission to disable this environment."
            );
        }

        const environment =
            await Environment.findOne({
                _id: environmentId,
                integrationId,
                organizationId,
                projectId
            });

        if (!environment) {
            throw new ApiError(
                404,
                "Environment not found."
            );
        }

        environment.status = "DISABLED";

        await environment.save();

        return environment;
    }
}

const environmentService = new EnvironmentService();

export default environmentService;