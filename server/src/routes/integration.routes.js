import express from "express";
import integrationController from "../controllers/integration.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
    "/organizations/:organizationId/teams/:teamId/integrations",
    protect,
    integrationController.createIntegration
);

router.get(
    "/organizations/:organizationId/teams/:teamId/integrations",
    protect,
    integrationController.getIntegrations
);

router.get(
    "/organizations/:organizationId/teams/:teamId/integrations/:integrationId",
    protect,
    integrationController.getIntegration
);

router.patch(
    "/organizations/:organizationId/teams/:teamId/integrations/:integrationId",
    protect,
    integrationController.updateIntegration
);

router.patch(
    "/organizations/:organizationId/teams/:teamId/integrations/:integrationId/disable",
    protect,
    integrationController.disableIntegration
);

export default router;