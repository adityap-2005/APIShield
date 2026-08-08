import express from "express";
import auditLogController from "../controllers/auditLog.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
    "/organizations/:organizationId/audit-logs",
    protect,
    auditLogController.getOrganizationAuditLogs
);

router.get(
    "/organizations/:organizationId/audit-logs/:auditLogId",
    protect,
    auditLogController.getAuditLogById
);

export default router;