
import ApiUsage from "../models/apiUsage.model.js";
import UpstreamApi from "../models/upstreamApi.model.js";

class UsageService {
    async recordUsage(usageData) {
        const usedAt = new Date();
        const usageRecord = await ApiUsage.create(usageData);

        if (usageData.upstreamApiId) {
            try {
                await UpstreamApi.updateOne(
                    {
                        _id: usageData.upstreamApiId,
                        organizationId: usageData.organizationId,
                        projectId: usageData.projectId,
                    },
                    {
                        $max: { lastUsed: usedAt },
                    }
                );
            } catch (error) {
                console.error(
                    "Failed to update upstream API last-used timestamp:",
                    error.message
                );
            }
        }

        return usageRecord;
    }
}

export default new UsageService();
