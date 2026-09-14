import environmentService from "../services/environment.service.js";

class EnvironmentController {

    async createEnvironment(req, res) {
        const {
            organizationId,
            teamId,
            integrationId
        } = req.params;

        const environment =
            await environmentService.createEnvironment(
                req.user._id,
                organizationId,
                teamId,
                integrationId,
                req.body
            );

        return res.status(201).json({
            success: true,
            data: environment
        });
    }


    async getEnvironments(req, res) {
        const {
            organizationId,
            teamId,
            integrationId
        } = req.params;

        const environments =
            await environmentService.getEnvironments(
                req.user._id,
                organizationId,
                teamId,
                integrationId
            );

        return res.status(200).json({
            success: true,
            data: environments
        });
    }


    async getEnvironment(req, res) {
        const {
            organizationId,
            teamId,
            integrationId,
            environmentId
        } = req.params;

        const environment =
            await environmentService.getEnvironment(
                req.user._id,
                organizationId,
                teamId,
                integrationId,
                environmentId
            );

        return res.status(200).json({
            success: true,
            data: environment
        });
    }


    async updateEnvironment(req, res) {
        const {
            organizationId,
            teamId,
            integrationId,
            environmentId
        } = req.params;

        const environment =
            await environmentService.updateEnvironment(
                req.user._id,
                organizationId,
                teamId,
                integrationId,
                environmentId,
                req.body
            );

        return res.status(200).json({
            success: true,
            data: environment
        });
    }


    async disableEnvironment(req, res) {
        const {
            organizationId,
            teamId,
            integrationId,
            environmentId
        } = req.params;

        const environment =
            await environmentService.disableEnvironment(
                req.user._id,
                organizationId,
                teamId,
                integrationId,
                environmentId
            );

        return res.status(200).json({
            success: true,
            data: environment
        });
    }
}


const environmentController =
    new EnvironmentController();

export default environmentController;