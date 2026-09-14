import gatewayService from "../services/gateway.service.js";

class GatewayController {
    async testGateway(req, res) {
        const {
            organizationId,
            teamId,
            environmentId
        } = req.params;

        const result =
            await gatewayService.getEnvironmentCredential(
                environmentId,
                organizationId,
                teamId
            );

        return res.status(200).json({
            success: true,
            data: {
                integrationId:
                    result.integration._id,

                environmentId:
                    result.environment._id,

                integrationName:
                    result.integration.name,

                environmentName:
                    result.environment.name
            }
        });
    }

    async callOpenWeather(req, res) {
        const {
            organizationId,
            teamId
        } = req.params;

        const { city } = req.query;

        const weather =
            await gatewayService.callOpenWeather(
                organizationId,
                teamId,
                city,
                req.apiKeyContext
            );

        return res.status(200).json({
            success: true,
            data: weather
        });
    }
}

const gatewayController = new GatewayController();
export default gatewayController;