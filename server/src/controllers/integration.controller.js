import integrationService from "../services/integration.service.js";

class IntegrationController {

    async createIntegration(req, res) {

        const {
            organizationId,
            teamId
        } = req.params;

        const integration =
            await integrationService.createIntegration(
                req.user._id,
                organizationId,
                teamId,
                req.body
            );

        return res.status(201).json({
            success: true,
            message: "Integration created successfully.",
            data: integration
        });
    }

    async getIntegrations(req, res) {

        const {
            organizationId,
            teamId
        } = req.params;

        const integrations =
            await integrationService.getIntegrations(
                req.user._id,
                organizationId,
                teamId
            );

        return res.status(200).json({
            success: true,
            data: integrations
        });
    }

    async getIntegration(req, res) {

        const {
            organizationId,
            teamId,
            integrationId
        } = req.params;

        const integration =
            await integrationService.getIntegration(
                req.user._id,
                organizationId,
                teamId,
                integrationId
            );

        return res.status(200).json({
            success: true,
            data: integration
        });
    }

    async updateIntegration(req, res) {

        const {
            organizationId,
            teamId,
            integrationId
        } = req.params;

        const integration =
            await integrationService.updateIntegration(
                req.user._id,
                organizationId,
                teamId,
                integrationId,
                req.body
            );

        return res.status(200).json({
            success: true,
            message: "Integration updated successfully.",
            data: integration
        });
    }

    async disableIntegration(req, res) {

        const {
            organizationId,
            teamId,
            integrationId
        } = req.params;

        const integration =
            await integrationService.disableIntegration(
                req.user._id,
                organizationId,
                teamId,
                integrationId
            );

        return res.status(200).json({
            success: true,
            message: "Integration disabled successfully.",
            data: integration
        });
    }
}


const integrationController =
    new IntegrationController();

export default integrationController;