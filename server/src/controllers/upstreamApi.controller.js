import upstreamApiService from "../services/upstreamApi.service.js";


class UpstreamApiController {

    async createUpstreamApi(req, res) {

        const {
            organizationId,
            teamId,
            integrationId,
            environmentId
        } = req.params;

        const upstreamApi =
            await upstreamApiService.createUpstreamApi(
                req.user._id,
                organizationId,
                teamId,
                integrationId,
                environmentId,
                req.body
            );

        return res.status(201).json({
            success: true,
            data: upstreamApi
        });
    }


    async getUpstreamApis(req, res) {

        const {
            organizationId,
            teamId,
            integrationId,
            environmentId
        } = req.params;

        const upstreamApis =
            await upstreamApiService.getUpstreamApis(
                req.user._id,
                organizationId,
                teamId,
                integrationId,
                environmentId
            );

        return res.status(200).json({
            success: true,
            data: upstreamApis
        });
    }


    async getUpstreamApi(req, res) {

        const {
            organizationId,
            teamId,
            integrationId,
            environmentId,
            upstreamApiId
        } = req.params;

        const upstreamApi =
            await upstreamApiService.getUpstreamApi(
                req.user._id,
                organizationId,
                teamId,
                integrationId,
                environmentId,
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
            teamId,
            integrationId,
            environmentId,
            upstreamApiId
        } = req.params;

        const upstreamApi =
            await upstreamApiService.updateUpstreamApi(
                req.user._id,
                organizationId,
                teamId,
                integrationId,
                environmentId,
                upstreamApiId,
                req.body
            );

        return res.status(200).json({
            success: true,
            data: upstreamApi
        });
    }
}


export default new UpstreamApiController();