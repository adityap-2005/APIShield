import mongoose from "mongoose";
import Organization from "../models/organization.model.js";
import Membership from "../models/membership.model.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";

import { MEMBERSHIP_ROLES } from "../constants/membershipRoles.js";
import { MEMBERSHIP_STATUS } from "../constants/membershipStatus.js";

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
                        ownerId: userId
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

            await User.findByIdAndUpdate(
                userId,
                {
                    organization: createdOrganization._id
                },
                {
                    session
                }
            );

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

    async getCurrentOrganization(organizationId) {
        const organization =
            await
                Organization.findById(organizationId)
                    .populate("ownerId", "name email avatar");

        if (!organization) {
            throw new ApiError(
                404,
                "Organization not found");
        }

        return organization;
    }

}

const organizationService = new OrganizationService();

export default organizationService;