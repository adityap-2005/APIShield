import Organization from "../models/organization.model.js";
import ApiError from "../utils/ApiError.js";

export async function _getOrganizationById(organizationId) {
    const organization = await Organization.findById(organizationId);

    if (!organization) {
        throw new ApiError(404, "Organization not found.");
    }

    return organization;
}