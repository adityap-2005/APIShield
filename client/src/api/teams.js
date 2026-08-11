/**
 * teams.js
 *
 * API functions for team management.
 * Backend routes: /organizations/:organizationId/teams/...
 */

import axiosInstance from "./axiosInstance";

const teamsApi = {
  // POST /api/v1/organizations/:organizationId/teams
  // Body: { name, description? }
  // Returns: { success, message, data: team }
  // Creator is automatically added as TEAM_ADMIN
  create: (organizationId, name, description) =>
    axiosInstance.post(`/organizations/${organizationId}/teams`, { name, description }),

  // GET /api/v1/organizations/:organizationId/teams
  // Returns: { success, message, data: [team] }
  getAll: (organizationId) =>
    axiosInstance.get(`/organizations/${organizationId}/teams`),

  // GET /api/v1/organizations/:organizationId/teams/:teamId
  // Returns: { success, message, data: team }
  getById: (organizationId, teamId) =>
    axiosInstance.get(`/organizations/${organizationId}/teams/${teamId}`),

  // PATCH /api/v1/organizations/:organizationId/teams/:teamId
  // Body: { name?, description? }
  // Returns: { success, message, data: team }
  // Requires TEAM_ADMIN role
  update: (organizationId, teamId, name, description) =>
    axiosInstance.patch(`/organizations/${organizationId}/teams/${teamId}`, { name, description }),

  // DELETE /api/v1/organizations/:organizationId/teams/:teamId
  // Returns: { success, message }
  // Allowed for org OWNER/ADMIN or TEAM_ADMIN
  delete: (organizationId, teamId) =>
    axiosInstance.delete(`/organizations/${organizationId}/teams/${teamId}`),

  // ── Team Members ─────────────────────────────────────────────────────────

  // POST /api/v1/organizations/:organizationId/teams/:teamId/members
  // Body: { membershipId } — the Membership document _id (from GET /members response)
  // Returns: { success, message, data: teamMembership }
  addMember: (organizationId, teamId, membershipId) =>
    axiosInstance.post(`/organizations/${organizationId}/teams/${teamId}/members`, { membershipId }),

  // GET /api/v1/organizations/:organizationId/teams/:teamId/members
  // Returns: { success, message, data: [{ teamMembershipId, teamRole, organizationRole, status, user }] }
  getMembers: (organizationId, teamId) =>
    axiosInstance.get(`/organizations/${organizationId}/teams/${teamId}/members`),

  // DELETE /api/v1/organizations/:organizationId/teams/:teamId/members/:membershipId
  // membershipId here = the Membership _id (not TeamMembership _id)
  // Returns: { success, message }
  removeMember: (organizationId, teamId, membershipId) =>
    axiosInstance.delete(`/organizations/${organizationId}/teams/${teamId}/members/${membershipId}`),

  // PATCH /api/v1/organizations/:organizationId/teams/:teamId/members/:membershipId
  // Body: { role: "TEAM_ADMIN" | "MEMBER" }
  // Returns: { success, message }
  updateMemberRole: (organizationId, teamId, membershipId, role) =>
    axiosInstance.patch(`/organizations/${organizationId}/teams/${teamId}/members/${membershipId}`, { role }),

  // DELETE /api/v1/organizations/:organizationId/teams/:teamId/leave
  // Current user leaves the team
  // Returns: { success, message }
  leave: (organizationId, teamId) =>
    axiosInstance.delete(`/organizations/${organizationId}/teams/${teamId}/leave`),
};

export default teamsApi;
