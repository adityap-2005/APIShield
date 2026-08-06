import express from "express";

import demoController from "../controllers/demo.controller.js";

import {authenticateApiKey} from "../middleware/apiKeyAuth.middleware.js";

import {requireScopes} from "../middleware/scope.middleware.js";

import {API_SCOPES} from "../constants/apiScope.js";

const router = express.Router();

router.get(
    "/users",
    authenticateApiKey,
    requireScopes({
        scopes: [
            API_SCOPES.USERS_READ
        ]
    }),
    demoController.getUsers
);

router.post(
    "/users",
    authenticateApiKey,
    requireScopes({
        scopes: [
            API_SCOPES.USERS_WRITE
        ]
    }),
    demoController.createUser
);

export default router;