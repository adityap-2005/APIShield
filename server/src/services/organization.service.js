import mongoose from "mongoose";
import Organization from "../models/organization.model.js";
import Membership from "../models/membership.model.js";
import ApiError from "../utils/ApiError.js";
import auditLogService from "./auditLog.service.js";

import { MEMBERSHIP_ROLES } from "../constants/membershipRoles.js";
import { MEMBERSHIP_STATUS } from "../constants/membershipStatus.js";
import { AUDIT_ACTIONS } from "../constants/auditActions.js";
import { AUDIT_ENTITY_TYPES } from "../constants/auditEntityTypes.js";

class OrganizationService {

    async createOrganization(userId, organizationData) {

        const { name, description, website } = organizationData;

        if (!name || !name.trim()) {
            throw new ApiError(
                400,
                "Organization name is required."
            );
        }

        if (
            website &&
            !website.startsWith("http")
        ) {
            throw new ApiError(
                400,
                "Invalid website URL."
            );
        }

        const slug = name
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, "");

        const existingOrganization = await Organization.findOne({ slug });

        if (existingOrganization) {
            throw new ApiError(
                409,
                "Organization with this name already exists.");
        }

        const session = await mongoose.startSession();

        session.startTransaction();

        try {
            const organization = await Organization.create(
                [
                    {
                        name,
                        slug,
                        description,
                        website,
                        createdBy: userId
                    }
                ],
                {
                    session
                }
            );

            const createdOrganization = organization[0];

            await Membership.create(
                [
                    {
                        userId,
                        organizationId: createdOrganization._id,
                        role: MEMBERSHIP_ROLES.OWNER,
                        status: MEMBERSHIP_STATUS.ACTIVE
                    }
                ],
                {
                    session
                }
            );

            const actor =
                await auditLogService.getActor(userId);

            await auditLogService.log({
                organizationId:
                    createdOrganization._id,

                actor,

                action:
                    AUDIT_ACTIONS.ORGANIZATION_CREATED,

                entity: {
                    id: createdOrganization._id,
                    type:
                        AUDIT_ENTITY_TYPES.ORGANIZATION,
                    name: createdOrganization.name
                },

                metadata: {
                    slug: createdOrganization.slug
                },

                session
            });

            await session.commitTransaction();

            return createdOrganization;
        }
        catch (error) {
            await session.abortTransaction();
            throw error;
        }
        finally {
            await session.endSession();
        }

    }

    async getUserOrganizations(userId) {

        const memberships = await Membership.find({
            userId,
            status: MEMBERSHIP_STATUS.ACTIVE
        }).populate({
            path: "organizationId",
            select: "-__v"
        });

        return memberships.map(
            membership => membership.organizationId
        );
    }

}

const organizationService = new OrganizationService();

export default organizationService;