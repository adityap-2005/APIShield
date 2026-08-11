/**
 * invitations.js
 *
 * API functions for invitation management.
 * Covers both org-scoped (admin sends/cancels) and user-scoped (user accepts/rejects).
 */

import axiosInstance from "./axiosInstance";

const invitationsApi = {
  // ── Organization-scoped (admin operations) ──────────────────────────────

  // POST /api/v1/organizations/:organizationId/invitations
  // Body: { email, role: "ADMIN" | "DEVELOPER" }
  // Returns: { success, message, data: invitation }
  invite: (organizationId, email, role) =>
    axiosInstance.post(`/organizations/${organizationId}/invitations`, { email, role }),

  // GET /api/v1/organizations/:organizationId/invitations
  // Returns: { success, data: [invitation] }
  // invitedBy is populated with user name, email, avatar
  getOrganizationInvitations: (organizationId) =>
    axiosInstance.get(`/organizations/${organizationId}/invitations`),

  // DELETE /api/v1/organizations/:organizationId/invitations/:invitationId
  // Returns: { success, message }
  cancel: (organizationId, invitationId) =>
    axiosInstance.delete(`/organizations/${organizationId}/invitations/${invitationId}`),

  // ── User-scoped (current user's own invitations) ─────────────────────────

  // GET /api/v1/invitations
  // Returns pending invitations for the logged-in user (matched by email)
  // Returns: { success, data: [invitation with populated organizationId and invitedBy] }
  getMyInvitations: () =>
    axiosInstance.get("/invitations"),

  // POST /api/v1/invitations/:invitationId/accept
  // Body: none
  // Returns: { success, message, data: invitation }
  accept: (invitationId) =>
    axiosInstance.post(`/invitations/${invitationId}/accept`),

  // POST /api/v1/invitations/:invitationId/reject
  // Body: none
  // Returns: { success, message, data: invitation }
  reject: (invitationId) =>
    axiosInstance.post(`/invitations/${invitationId}/reject`),
};

export default invitationsApi;
