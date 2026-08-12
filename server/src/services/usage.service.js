import ApiUsage from "../models/apiUsage.model.js";

class UsageService {

    async recordUsage(usageData) {

        return await ApiUsage.create(
            usageData
        );

    }
}

export default new UsageService();