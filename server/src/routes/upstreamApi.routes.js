
import express from "express";

import upstreamApiController from "../controllers/upstreamApi.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

// Direct Integration Upstream API routes
router.post(
    "/organizations/:organizationId/projects/:projectId/integrations/:integrationId/upstream-apis",
    protect,
    upstreamApiController.createUpstreamApi
);

router.get(
    "/organizations/:organizationId/projects/:projectId/integrations/:integrationId/upstream-apis",
    protect,
    upstreamApiController.getUpstreamApis
);

router.get(
    "/organizations/:organizationId/projects/:projectId/integrations/:integrationId/upstream-apis/:upstreamApiId",
    protect,
    upstreamApiController.getUpstreamApi
);

router.patch(
    "/organizations/:organizationId/projects/:projectId/integrations/:integrationId/upstream-apis/:upstreamApiId",
    protect,
    upstreamApiController.updateUpstreamApi
);

router.delete(
    "/organizations/:organizationId/projects/:projectId/integrations/:integrationId/upstream-apis/:upstreamApiId",
    protect,
    upstreamApiController.deleteUpstreamApi
);

// Legacy routes with environmentId
router.post(
    "/organizations/:organizationId/projects/:projectId/integrations/:integrationId/environments/:environmentId/upstream-apis",
    protect,
    upstreamApiController.createUpstreamApi
);

router.get(
    "/organizations/:organizationId/projects/:projectId/integrations/:integrationId/environments/:environmentId/upstream-apis",
    protect,
    upstreamApiController.getUpstreamApis
);

router.get(
    "/organizations/:organizationId/projects/:projectId/integrations/:integrationId/environments/:environmentId/upstream-apis/:upstreamApiId",
    protect,
    upstreamApiController.getUpstreamApi
);

router.patch(
    "/organizations/:organizationId/projects/:projectId/integrations/:integrationId/environments/:environmentId/upstream-apis/:upstreamApiId",
    protect,
    upstreamApiController.updateUpstreamApi
);

router.delete(
    "/organizations/:organizationId/projects/:projectId/integrations/:integrationId/environments/:environmentId/upstream-apis/:upstreamApiId",
    protect,
    upstreamApiController.deleteUpstreamApi
);

export default router;
