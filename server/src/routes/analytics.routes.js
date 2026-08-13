import Express from "express";

import analyticsController from "../controllers/analytics.controller.js";

import protect from "../middleware/auth.middleware.js"

const router = Express.Router();

router.get(
    "/organizations/:organizationId/analytics",
    protect,
    analyticsController.getAnalytics
);

export default router;