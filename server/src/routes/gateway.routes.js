import express from "express";

import protect from "../middleware/auth.middleware.js";
import { authenticateApiKey } from "../middleware/apiKeyAuth.middleware.js";
import gatewayController from "../controllers/gateway.controller.js";

const router = express.Router();

router.all(
    "/organizations/:organizationId/projects/:projectId/gateway/upstream/:upstreamApiId",
    authenticateApiKey,
    gatewayController.callUpstreamApi
);

export default router;