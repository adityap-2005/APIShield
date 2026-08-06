class DemoController {

    async getUsers(req, res) {
        return res.status(200).json({
            success: true,
            message:
                "API Key authenticated successfully.",
            data: {
                apiKeyId:
                    req.apiKeyContext.apiKeyId,
                organizationId:
                    req.apiKeyContext.organizationId,
                teamId:
                    req.apiKeyContext.teamId,
                environment:
                    req.apiKeyContext.environment,
                scopes:
                    req.apiKeyContext.scopes
            }
        });
    }

    async createUser(req, res) {
        return res.status(201).json({
            success: true,
            message:
                "User created successfully using API Key."
        });

    }

}

export default new DemoController();