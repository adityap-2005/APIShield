import express from "express";
import protect from "../middleware/auth.middleware.js";
import organizationController from "../controllers/organization.controller.js";
import invitationController from "../controllers/invitation.controller.js";

const router = new express.Router();

router.post("/",protect,organizationController.createOrganization);
router.post("/current",protect,organizationController.getCurrentOrganization);

router.post("/:organizationId/invitations",protect,invitationController.inviteMember);
router.get("/:organizationId/invitations", protect, invitationController.getOrganizationInvitations);
router.delete(
    "/:organizationId/invitations/:invitationId",
    protect,
    invitationController.cancelInvitation
);

export default router;