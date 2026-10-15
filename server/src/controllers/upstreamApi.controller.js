import upstreamApiService from "../services/upstreamApi.service.js";
class UpstreamApiController {
    async createUpstreamApi(req, res) {
        const {
            organizationId,
            projectId,
            integrationId,
            environmentId
        } = req.params;

        const upstreamApi =
            await upstreamApiService.createUpstreamApi(
                req.user._id,
                organizationId,
                projectId,
                integrationId,
                req.body,
                environmentId || null
            );

        return res.status(201).json({
            success: true,
            data: upstreamApi
        });
    }

    async getUpstreamApis(req, res) {
        const {
            organizationId,
            projectId,
            integrationId
        } = req.params;

        const upstreamApis =
            await upstreamApiService.getUpstreamApis(
                req.user._id,
                organizationId,
                projectId,
                integrationId
            );

        return res.status(200).json({
            success: true,
            data: upstreamApis
        });
    }

    async getUpstreamApi(req, res) {
        const {
            organizationId,
            projectId,
            integrationId,
            upstreamApiId
        } = req.params;

        const upstreamApi =
            await upstreamApiService.getUpstreamApi(
                req.user._id,
                organizationId,
                projectId,
                integrationId,
                upstreamApiId
            );

        return res.status(200).json({
            success: true,
            data: upstreamApi
        });
    }

    async updateUpstreamApi(req, res) {
        const {
            organizationId,
            projectId,
            integrationId,
            upstreamApiId
        } = req.params;

        const upstreamApi =
            await upstreamApiService.updateUpstreamApi(
                req.user._id,
                organizationId,
                projectId,
                integrationId,
                upstreamApiId,
                req.body
            );

        return res.status(200).json({
            success: true,
            data: upstreamApi
        });
    }

    async deleteUpstreamApi(req, res) {
        const {
            organizationId,
            projectId,
            integrationId,
            upstreamApiId
        } = req.params;

        const result =
            await upstreamApiService.deleteUpstreamApi(
                req.user._id,
                organizationId,
                projectId,
                integrationId,
                upstreamApiId
            );

        return res.status(200).json({
            success: true,
            message: "Upstream API deleted successfully.",
            data: result
        });
    }
}

export default new UpstreamApiController();
