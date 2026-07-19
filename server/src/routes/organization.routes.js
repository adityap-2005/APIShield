import express from "express";
import protect from "../middleware/auth.middleware.js";
import organizationController from "../controllers/organization.controller.js";
import invitationController from "../controllers/invitation.controller.js";
import membershipController from "../controllers/membership.controller.js"

const router = new express.Router();

router.post("/",
    protect,
    organizationController.createOrganization
);
router.get("/",
    protect,
    organizationController.getUserOrganizations
);

router.post("/:organizationId/invitations",
    protect,
    invitationController.inviteMember
);
router.get("/:organizationId/invitations",
    protect,
    invitationController.getOrganizationInvitations
);
router.delete(
    "/:organizationId/invitations/:invitationId",
    protect,
    invitationController.cancelInvitation
);


router.delete(
    "/:organizationId/members/me",
    protect,
    membershipController.leaveOrganization
);


router.get(
    "/:organizationId/members",
    protect,
    membershipController.getOrganizationMembers
);

router.patch(
    "/:organizationId/members/:memberId/role",
    protect,
    membershipController.updateMemberRole
);

router.delete(
    "/:organizationId/members/:memberId",
    protect,
    membershipController.removeMember
);

export default router;