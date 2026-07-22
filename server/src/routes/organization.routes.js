import express from "express";
import protect from "../middleware/auth.middleware.js";
import organizationController from "../controllers/organization.controller.js";
import invitationController from "../controllers/invitation.controller.js";
import membershipController from "../controllers/membership.controller.js";
import teamController from "../controllers/team.controller.js";

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

// Team Management

router.post(
    "/:organizationId/teams",
    protect,
    teamController.createTeam
);

router.get(
    "/:organizationId/teams",
    protect,
    teamController.getOrganizationTeams
);

router.get(
    "/:organizationId/teams/:teamId",
    protect,
    teamController.getTeamById
);

router.patch(
    "/:organizationId/teams/:teamId",
    protect,
    teamController.updateTeam
);

router.delete(
    "/:organizationId/teams/:teamId",
    protect,
    teamController.deleteTeam
);

// Team Members

router.post(
    "/:organizationId/teams/:teamId/members",
    protect,
    teamController.addTeamMember
);

router.get(
    "/:organizationId/teams/:teamId/members",
    protect,
    teamController.getTeamMembers
);

router.delete(
    "/:organizationId/teams/:teamId/members/:membershipId",
    protect,
    teamController.removeTeamMember
);

router.patch(
    "/:organizationId/teams/:teamId/members/:membershipId",
    protect,
    teamController.updateTeamMemberRole
);

router.delete(
    "/:organizationId/teams/:teamId/leave",
    protect,
    teamController.leaveTeam
);

export default router;