import express from "express";
import environmentController from "../controllers/environment.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.post(
    "/organizations/:organizationId/projects/:projectId/integrations/:integrationId/environments",
    protect,
    environmentController.createEnvironment
);

router.get(
    "/organizations/:organizationId/projects/:projectId/integrations/:integrationId/environments",
    protect,
    environmentController.getEnvironments
);

router.get(
    "/organizations/:organizationId/projects/:projectId/integrations/:integrationId/environments/:environmentId",
    protect,
    environmentController.getEnvironment
);

router.patch(
    "/organizations/:organizationId/projects/:projectId/integrations/:integrationId/environments/:environmentId",
    protect,
    environmentController.updateEnvironment
);

router.patch(
    "/organizations/:organizationId/projects/:projectId/integrations/:integrationId/environments/:environmentId/disable",
    protect,
    environmentController.disableEnvironment
);

export default router;