import express from "express";
import protect from "../middleware/auth.middleware.js";

import apiKeyController from "../controllers/apiKey.controller.js";

const router = new express.Router({
    mergeParams : true
});

router.post(
    "/",
    protect,
    apiKeyController.createApiKey
);

router.get(
    "/",
    protect,
    apiKeyController.getTeamApiKeys
);

router.get(
    "/:apiKeyId",
    protect,
    apiKeyController.getApiKeyById
);

router.patch(
    "/:apiKeyId",
    protect,
    apiKeyController.updateApiKey
);

router.post(
    "/:apiKeyId/rotate",
    protect,
    apiKeyController.rotateApiKey
);

router.post(
    "/:apiKeyId/revoke",
    protect,
    apiKeyController.revokeApiKey
);

router.post(
    "/:apiKeyId/archive",
    protect,
    apiKeyController.archiveApiKey
);

export default router;