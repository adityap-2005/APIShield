import usageService from "../services/usage.service.js";

export const trackApiUsage = (req,res,next) => {

    const startTime = Date.now();

    res.on("finish", async () => {

        const responseTime =
            Date.now() - startTime;

        const usageData = {

            apiKeyId:
                req.apiKeyContext.apiKeyId,

            organizationId:
                req.apiKeyContext.organizationId,

            teamId:
                req.apiKeyContext.teamId,

            environment:
                req.apiKeyContext.environment,

            method:
                req.method,

            endpoint:
                req.originalUrl,

            statusCode:
                res.statusCode,

            responseTime

        };

        try {

            await usageService.recordUsage(
                usageData
            );

        } catch (error) {

            console.error(
                "Failed to record API usage:",
                error
            );

        }
    });

    next();
};