import express from "express";

import upstreamApiController from "../controllers/upstreamApi.controller.js";
import protect from "../middleware/auth.middleware.js"

const router = express.Router();


router.post(
    "/organizations/:organizationId/teams/:teamId/integrations/:integrationId/environments/:environmentId/upstream-apis",
    protect,
    upstreamApiController.createUpstreamApi
);


router.get(
    "/organizations/:organizationId/teams/:teamId/integrations/:integrationId/environments/:environmentId/upstream-apis",
    protect,
    upstreamApiController.getUpstreamApis
);


router.get(
    "/organizations/:organizationId/teams/:teamId/integrations/:integrationId/environments/:environmentId/upstream-apis/:upstreamApiId",
    protect,
    upstreamApiController.getUpstreamApi
);


router.patch(
    "/organizations/:organizationId/teams/:teamId/integrations/:integrationId/environments/:environmentId/upstream-apis/:upstreamApiId",
    protect,
    upstreamApiController.updateUpstreamApi
);


export default router;