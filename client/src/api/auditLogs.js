/**
 * auditLogs.js
 *
 * API functions for audit log retrieval.
 * Backend routes: GET /organizations/:organizationId/audit-logs
 *                 GET /organizations/:organizationId/audit-logs/:auditLogId
 */

import axiosInstance from "./axiosInstance";

const auditLogsApi = {
  // GET /api/v1/organizations/:organizationId/audit-logs
  // Query params: page (default 1), limit (default 20)
  // Returns: {
  //   success, message,
  //   data: {
  //     logs: [{ _id, organizationId, teamId, actor, action, entity, metadata, createdAt }],
  //     pagination: { page, limit, total, totalPages }
  //   }
  // }
  getAll: (organizationId, page = 1, limit = 20) =>
    axiosInstance.get(`/organizations/${organizationId}/audit-logs`, {
      params: { page, limit },
    }),

  // GET /api/v1/organizations/:organizationId/audit-logs/:auditLogId
  // Returns: { success, message, data: auditLog }
  getById: (organizationId, auditLogId) =>
    axiosInstance.get(`/organizations/${organizationId}/audit-logs/${auditLogId}`),
};

export default auditLogsApi;
