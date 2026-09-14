import express from "express";

import protect from "../middleware/auth.middleware.js";
import { authenticateApiKey } from "../middleware/apiKeyAuth.middleware.js";
import gatewayController from "../controllers/gateway.controller.js";

const router = express.Router();

router.get(
    "/organizations/:organizationId/teams/:teamId/gateway/:environmentId/test",
    protect,
    gatewayController.testGateway
);

router.get(
    "/organizations/:organizationId/teams/:teamId/gateway/weather",
    authenticateApiKey,
    gatewayController.callOpenWeather
);

export default router;