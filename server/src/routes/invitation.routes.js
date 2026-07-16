import express from "express";

import protect from "../middleware/auth.middleware.js";
import invitationController from "../controllers/invitation.controller.js";

const router = express.Router();

router.get(
    "/",
    protect,
    invitationController.getMyInvitations
);

router.post(
    "/:invitationId/accept",
    protect,
    invitationController.acceptInvitation
);

router.post(
    "/:invitationId/reject",
    protect,
    invitationController.rejectInvitation
);

export default router;