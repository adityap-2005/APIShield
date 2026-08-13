import analyticsService from "../services/analytics.service.js";

class AnalyticsController {

    async getAnalytics(req, res) {

        const { organizationId } =
            req.params;

        const userId =
            req.user._id;

        const analytics =
            await analyticsService.getAnalytics(
                organizationId,
                userId
            );

        return res.status(200).json({
            success: true,
            data: analytics
        });
    }
}

export default new AnalyticsController();