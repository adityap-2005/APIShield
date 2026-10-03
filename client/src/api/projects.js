/**
 * projects.js
 *
 * API functions for project management.
 * Backend routes: /organizations/:organizationId/projects/...
 */

import axiosInstance from "./axiosInstance";

const projectsApi = {
  // POST /api/v1/organizations/:organizationId/projects
  // Body: { name, description? }
  // Returns: { success, message, data: project }
  // Creator is automatically added as PROJECT_ADMIN
  create: (organizationId, name, description) =>
    axiosInstance.post(`/organizations/${organizationId}/projects`, { name, description }),

  // GET /api/v1/organizations/:organizationId/projects
  // Returns: { success, message, data: [project] }
  getAll: (organizationId) =>
    axiosInstance.get(`/organizations/${organizationId}/projects`),

  // GET /api/v1/organizations/:organizationId/projects/:projectId
  // Returns: { success, message, data: project }
  getById: (organizationId, projectId) =>
    axiosInstance.get(`/organizations/${organizationId}/projects/${projectId}`),

  // PATCH /api/v1/organizations/:organizationId/projects/:projectId
  // Body: { name?, description? }
  // Returns: { success, message, data: project }
  // Requires PROJECT_ADMIN role
  update: (organizationId, projectId, name, description) =>
    axiosInstance.patch(`/organizations/${organizationId}/projects/${projectId}`, { name, description }),

  // DELETE /api/v1/organizations/:organizationId/projects/:projectId
  // Returns: { success, message }
  // Allowed for org OWNER/ADMIN or PROJECT_ADMIN
  delete: (organizationId, projectId) =>
    axiosInstance.delete(`/organizations/${organizationId}/projects/${projectId}`),

  // ── Project Members ─────────────────────────────────────────────────────────

  // POST /api/v1/organizations/:organizationId/projects/:projectId/members
  // Body: { membershipId } — the Membership document _id (from GET /members response)
  // Returns: { success, message, data: projectMembership }
  addMember: (organizationId, projectId, membershipId) =>
    axiosInstance.post(`/organizations/${organizationId}/projects/${projectId}/members`, { membershipId }),

  // GET /api/v1/organizations/:organizationId/projects/:projectId/members
  // Returns: { success, message, data: [{ projectMembershipId, projectRole, organizationRole, status, user }] }
  getMembers: (organizationId, projectId) =>
    axiosInstance.get(`/organizations/${organizationId}/projects/${projectId}/members`),

  // DELETE /api/v1/organizations/:organizationId/projects/:projectId/members/:membershipId
  // membershipId here = the Membership _id (not ProjectMembership _id)
  // Returns: { success, message }
  removeMember: (organizationId, projectId, membershipId) =>
    axiosInstance.delete(`/organizations/${organizationId}/projects/${projectId}/members/${membershipId}`),

  // PATCH /api/v1/organizations/:organizationId/projects/:projectId/members/:membershipId
  // Body: { role: "PROJECT_ADMIN" | "MEMBER" }
  // Returns: { success, message }
  updateMemberRole: (organizationId, projectId, membershipId, role) =>
    axiosInstance.patch(`/organizations/${organizationId}/projects/${projectId}/members/${membershipId}`, { role }),

  // DELETE /api/v1/organizations/:organizationId/projects/:projectId/leave
  // Current user leaves the project
  // Returns: { success, message }
  leave: (organizationId, projectId) =>
    axiosInstance.delete(`/organizations/${organizationId}/projects/${projectId}/leave`),
};

export default projectsApi;
