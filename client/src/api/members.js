/**
 * members.js
 *
 * API functions for organization membership management.
 * Backend routes are all under /organizations/:organizationId/members
 */

import axiosInstance from "./axiosInstance";

const membersApi = {
  // GET /api/v1/organizations/:organizationId/members
  // Returns: { success, message, data: [{ membershipId, user, role, status, joinedAt }] }
  getAll: (organizationId) =>
    axiosInstance.get(`/organizations/${organizationId}/members`),

  // PATCH /api/v1/organizations/:organizationId/members/:memberId/role
  // memberId = the Membership document _id (called membershipId in the response)
  // Body: { role: "ADMIN" | "DEVELOPER" }
  // Returns: { success, message, data: { membershipId, user, role, status } }
  updateRole: (organizationId, memberId, role) =>
    axiosInstance.patch(`/organizations/${organizationId}/members/${memberId}/role`, { role }),

  // DELETE /api/v1/organizations/:organizationId/members/:memberId
  // memberId = the Membership document _id
  // Returns: { success, message }
  remove: (organizationId, memberId) =>
    axiosInstance.delete(`/organizations/${organizationId}/members/${memberId}`),

  // DELETE /api/v1/organizations/:organizationId/members/me
  // Current user leaves the organization
  // Returns: { success, message, data: membership }
  leave: (organizationId) =>
    axiosInstance.delete(`/organizations/${organizationId}/members/me`),
};

export default membersApi;
