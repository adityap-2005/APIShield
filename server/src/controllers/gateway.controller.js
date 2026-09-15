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