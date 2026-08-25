import organizationService from "../services/organization.service.js";

class OrganizationController {

    async createOrganization(req, res, next) {
        try {

            const organization = await
                organizationService.createOrganization(
                    req.user._id,
                    req.body
                );

            return res.status(201).json({
                success: true,
                message: "Organization created successfully",
                data: organization
            });


        } catch (error) {
            next(error);
        }
    }

    async getUserOrganizations(req, res, next) {
        try {

            const organizations =
                await organizationService.getUserOrganizations(
                    req.user._id
                );

            return res.status(200).json({
                success: true,
                data: organizations
            });

        } catch (error) {
            next(error);
        }
    }

    async updateOrganization(req, res, next) {
        try {
            const organization =
                await organizationService.updateOrganization(
                    req.user._id,
                    req.params.organizationId,
                    req.body
                );

            return res.status(200).json({
                success: true,
                message: "Organization updated successfully",
                data: organization
            });

        } catch (error) {
            next(error);
        }
    }

    async deleteOrganization(req, res, next) {
        try {
            await organizationService.deleteOrganization(
                req.user._id,
                req.params.organizationId
            );

            return res.status(200).json({
                success: true,
                message: "Organization deleted successfully"
            });

        } catch (error) {
            next(error);
        }
    }
}

const organizationController = new OrganizationController();

export default organizationController;