import express from "express";
import protect from "../middleware/auth.middleware.js";
import organizationController from "../controllers/organization.controller.js";
import invitationController from "../controllers/invitation.controller.js";
import membershipController from "../controllers/membership.controller.js";
import projectController from "../controllers/project.controller.js";

const router = new express.Router();

router.post("/",
    protect,
    organizationController.createOrganization
);
router.get("/",
    protect,
    organizationController.getUserOrganizations
);

router.patch(
    "/:organizationId",
    protect,
    organizationController.updateOrganization
);

router.delete(
    "/:organizationId",
    protect,
    organizationController.deleteOrganization
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

// Project Management

router.post(
    "/:organizationId/projects",
    protect,
    projectController.createProject
);

router.get(
    "/:organizationId/projects",
    protect,
    projectController.getOrganizationProjects
);

router.get(
    "/:organizationId/projects/:projectId",
    protect,
    projectController.getProjectById
);

router.patch(
    "/:organizationId/projects/:projectId",
    protect,
    projectController.updateProject
);

router.delete(
    "/:organizationId/projects/:projectId",
    protect,
    projectController.deleteProject
);

// Project Members

router.post(
    "/:organizationId/projects/:projectId/members",
    protect,
    projectController.addProjectMember
);

router.get(
    "/:organizationId/projects/:projectId/members",
    protect,
    projectController.getProjectMembers
);

router.delete(
    "/:organizationId/projects/:projectId/members/:membershipId",
    protect,
    projectController.removeProjectMember
);

router.patch(
    "/:organizationId/projects/:projectId/members/:membershipId",
    protect,
    projectController.updateProjectMemberRole
);

router.delete(
    "/:organizationId/projects/:projectId/leave",
    protect,
    projectController.leaveProject
);

export default router;