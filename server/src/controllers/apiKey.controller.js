import apiKeyService from "../services/apiKey.service.js";

class ApiKeyController {

    async createApiKey(req, res, next) {
        try {
            const result =
                await apiKeyService.createApiKey(
                    req.params.organizationId,
                    req.params.teamId,
                    req.user._id,
                    req.body
                );

            return res.status(201).json({
                success: true,
                message: "API key created successfully.",
                data: result
            });

        } catch (error) {
            next(error);
        }
    }

    async getTeamApiKeys(req, res, next) {
        try {
            const apiKeys =
                await apiKeyService.getTeamApiKeys(
                    req.params.organizationId,
                    req.params.teamId,
                    req.user._id
                );

            return res.status(200).json({
                success: true,
                message: "API keys fetched successfully.",
                data: apiKeys
            });

        } catch (error) {
            next(error);
        }
    }

    async getApiKeyById(req, res, next) {
        try {
            const apiKey =
                await apiKeyService.getApiKeyById(
                    req.params.organizationId,
                    req.params.teamId,
                    req.params.apiKeyId,
                    req.user._id
                );

            return res.status(200).json({
                success: true,
                message: "API key fetched successfully.",
                data: apiKey
            });

        } catch (error) {
            next(error);
        }
    }

    async updateApiKey(req, res, next) {
        try {
            const apiKey =
                await apiKeyService.updateApiKey(
                    req.params.organizationId,
                    req.params.teamId,
                    req.params.apiKeyId,
                    req.user._id,
                    req.body
                );

            return res.status(200).json({
                success: true,
                message: "API key updated successfully.",
                data: apiKey
            });

        } catch (error) {
            next(error);
        }
    }

    async rotateApiKey(req, res, next) {
        try {
            const result =
                await apiKeyService.rotateApiKey(
                    req.params.organizationId,
                    req.params.teamId,
                    req.params.apiKeyId,
                    req.user._id
                );

            return res.status(200).json({
                success: true,
                message: "API key rotated successfully.",
                data: result
            });

        } catch (error) {
            next(error);
        }
    }

    async revokeApiKey(req, res, next) {
        try {
            const result =
                await apiKeyService.revokeApiKey(
                    req.params.organizationId,
                    req.params.teamId,
                    req.params.apiKeyId,
                    req.user._id
                );

            return res.status(200).json({
                success: true,
                message: "API key revoked successfully.",
                data: result
            });

        } catch (error) {
            next(error);
        }
    }

    async archiveApiKey(req, res, next) {
        try {
            const result =
                await apiKeyService.archiveApiKey(
                    req.params.organizationId,
                    req.params.teamId,
                    req.params.apiKeyId,
                    req.user._id
                );

            return res.status(200).json({
                success: true,
                message: "API key archived successfully.",
                data: result
            });

        } catch (error) {
            next(error);
        }
    }
}

export default new ApiKeyController();