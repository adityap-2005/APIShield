import gatewayService from "../services/gateway.service.js";

class GatewayController {

    async callUpstreamApi(req, res) {

        const {
            organizationId,
            teamId,
            upstreamApiId
        } = req.params;

        const response =
            await gatewayService.callGateway(
                organizationId,
                teamId,
                upstreamApiId,
                req.apiKeyContext,
                {
                    method: req.method,
                    endpoint: req.originalUrl,
                    queryParams: req.query,
                    body: req.body
                }
            );

        return res.status(response.statusCode).json({
            success: true,
            data: response.data
        });
    }
}

const gatewayController =
    new GatewayController();

export default gatewayController;