/**
 * permissions.js
 *
 * Centralized authorization & permission helpers for APIShield frontend.
 * Strictly reflects backend authorization logic defined in:
 * - organization.service.js
 * - membership.service.js / membership.helper.js
 * - project.service.js / project.helper.js
 * - apiKey.service.js / apiKey.helper.js
 * - integration.service.js
 * - upstreamApi.service.js
 * - invitation.service.js / invitation.helper.js
 */

export const ORGANIZATION_ROLES = Object.freeze({
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  DEVELOPER: "DEVELOPER",
});

export const PROJECT_ROLES = Object.freeze({
  PROJECT_ADMIN: "PROJECT_ADMIN",
  MEMBER: "MEMBER",
});

/**
 * Organization Settings & Details Update
 * Backend: Only the organization OWNER can update organization settings.
 */
export function canManageOrg(org) {
  return org?.role === ORGANIZATION_ROLES.OWNER;
}

/**
 * Organization Deletion
 * Backend: Only the organization OWNER can delete an organization.
 */
export function canDeleteOrg(org) {
  return org?.role === ORGANIZATION_ROLES.OWNER;
}

/**
 * Member Invitations
 * Backend: Only organization OWNER and ADMIN can invite members or cancel invitations.
 */
export function canInviteMembers(org) {
  return (
    org?.role === ORGANIZATION_ROLES.OWNER ||
    org?.role === ORGANIZATION_ROLES.ADMIN
  );
}

export function canCancelInvitation(org) {
  return (
    org?.role === ORGANIZATION_ROLES.OWNER ||
    org?.role === ORGANIZATION_ROLES.ADMIN
  );
}

/**
 * Organization Member Management (Role Update / Removal)
 * Backend rules:
 * - Cannot change own role / remove oneself via member management.
 * - OWNER can update/remove any other active member (except last owner).
 * - ADMIN can only update/remove members with DEVELOPER role.
 * - DEVELOPER cannot update/remove any member.
 */
export function canManageOrgMember(org, targetMemberRole, targetMemberUserId = null, currentUserId = null) {
  if (
    currentUserId &&
    targetMemberUserId &&
    String(currentUserId) === String(targetMemberUserId)
  ) {
    return false;
  }

  if (org?.role === ORGANIZATION_ROLES.OWNER) {
    return true;
  }

  if (org?.role === ORGANIZATION_ROLES.ADMIN) {
    return targetMemberRole === ORGANIZATION_ROLES.DEVELOPER;
  }

  return false;
}

/**
 * Project Creation
 * Backend: Any active member of an organization can create projects.
 */
export function canCreateProject(org) {
  return Boolean(org?._id);
}

/**
 * Project Details Update (name, description)
 * Backend: Requires projectMembership.role === PROJECT_ADMIN.
 */
export function canUpdateProject(project) {
  return project?.projectRole === PROJECT_ROLES.PROJECT_ADMIN;
}

/**
 * Project Deletion
 * Backend: Organization OWNER/ADMIN or user with PROJECT_ADMIN role on the project.
 */
export function canDeleteProject(org, project) {
  const isOrgAdmin =
    org?.role === ORGANIZATION_ROLES.OWNER ||
    org?.role === ORGANIZATION_ROLES.ADMIN;
  const isProjectAdmin =
    project?.projectRole === PROJECT_ROLES.PROJECT_ADMIN;
  return Boolean(isOrgAdmin || isProjectAdmin);
}

/**
 * Add Member to Project
 * Backend: Only PROJECT_ADMIN on the project can add members to the project.
 */
export function canAddProjectMember(project) {
  return project?.projectRole === PROJECT_ROLES.PROJECT_ADMIN;
}

/**
 * Remove Member from Project
 * Backend:
 * - Org OWNER/ADMIN can remove project members.
 * - Project Admin can remove project members (except cannot remove another PROJECT_ADMIN).
 */
export function canRemoveProjectMember(org, project, targetMemberProjectRole = null) {
  if (
    org?.role === ORGANIZATION_ROLES.OWNER ||
    org?.role === ORGANIZATION_ROLES.ADMIN
  ) {
    return true;
  }

  if (project?.projectRole === PROJECT_ROLES.PROJECT_ADMIN) {
    return targetMemberProjectRole !== PROJECT_ROLES.PROJECT_ADMIN;
  }

  return false;
}

/**
 * Update Project Member Role
 * Backend: Org OWNER/ADMIN or PROJECT_ADMIN on the project.
 */
export function canUpdateProjectMemberRole(org, project) {
  return (
    org?.role === ORGANIZATION_ROLES.OWNER ||
    org?.role === ORGANIZATION_ROLES.ADMIN ||
    project?.projectRole === PROJECT_ROLES.PROJECT_ADMIN
  );
}

/**
 * API Key Management (Create, Rotate, Revoke, Archive, Delete)
 * Backend: Only PROJECT_ADMIN on the project can perform API key management operations.
 * Regular active project members may view API keys, but cannot modify/create them.
 */
export function canManageApiKeys(project) {
  return project?.projectRole === PROJECT_ROLES.PROJECT_ADMIN;
}

/**
 * API Key Viewing
 * Backend: Active project members or org OWNER/ADMIN can view project API keys.
 */
export function canViewApiKeys(org, project) {
  return Boolean(
    project?.projectRole ||
    org?.role === ORGANIZATION_ROLES.OWNER ||
    org?.role === ORGANIZATION_ROLES.ADMIN
  );
}

/**
 * Integrations Management (Create, Update, Disable)
 * Backend: Org OWNER/ADMIN or PROJECT_ADMIN on the project.
 */
export function canManageIntegrations(org, project) {
  const isOrgAdmin =
    org?.role === ORGANIZATION_ROLES.OWNER ||
    org?.role === ORGANIZATION_ROLES.ADMIN;
  const isProjectAdmin =
    project?.projectRole === PROJECT_ROLES.PROJECT_ADMIN;
  return Boolean(isOrgAdmin || isProjectAdmin);
}

/**
 * Upstream API Management (Create, Update, Delete)
 * Backend: Org OWNER/ADMIN or PROJECT_ADMIN on the project.
 */
export function canManageUpstreamApis(org, project) {
  const isOrgAdmin =
    org?.role === ORGANIZATION_ROLES.OWNER ||
    org?.role === ORGANIZATION_ROLES.ADMIN;
  const isProjectAdmin =
    project?.projectRole === PROJECT_ROLES.PROJECT_ADMIN;
  return Boolean(isOrgAdmin || isProjectAdmin);
}

/**
 * Organization Creation
 * Backend: Any authenticated user can create an organization.
 */
export function canCreateOrg(user) {
  return Boolean(user?._id || user);
}
