import gatewayService from "../services/gateway.service.js";
class GatewayController {

    async callOpenWeather(req, res) {

        const {
            organizationId,
            teamId,
            upstreamApiId
        } = req.params;

        const { city } = req.query;

        const weather =
            await gatewayService.callOpenWeather(
                organizationId,
                teamId,
                upstreamApiId,
                city,
                req.apiKeyContext,
                {
                    method: req.method,
                    endpoint: req.originalUrl
                }
            );

        return res.status(weather.statusCode).json({
            success: true,
            data: weather.data
        });
    }
}


const gatewayController = new GatewayController();

export default gatewayController;