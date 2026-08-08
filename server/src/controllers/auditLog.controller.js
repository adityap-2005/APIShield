import auditLogService from "../services/auditLog.service.js";

class AuditLogController {

    async getOrganizationAuditLogs(
        req,
        res,
        next
    ) {
        try {
            const page =
                Number(req.query.page) || 1;

            const limit =
                Number(req.query.limit) || 20;

            const result =
                await auditLogService.getOrganizationAuditLogs(
                    req.params.organizationId,
                    req.user._id,
                    page,
                    limit
                );

            return res.status(200).json({
                success: true,
                message:
                    "Audit logs fetched successfully.",
                data: result
            });

        } catch (error) {
            next(error);
        }
    }

    async getAuditLogById(
    req,
    res,
    next
) {
    try {
        const auditLog =
            await auditLogService.getAuditLogById(
                req.params.organizationId,
                req.user._id,
                req.params.auditLogId
            );

        return res.status(200).json({
            success: true,
            message:
                "Audit log fetched successfully.",
            data: auditLog
        });

    } catch (error) {
        next(error);
    }
}
}

export default new AuditLogController();