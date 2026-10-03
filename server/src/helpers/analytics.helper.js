import mongoose from "mongoose";

import ApiUsage from "../models/apiUsage.model.js";

export async function _getOverview(organizationId) {
    const [overview] = await ApiUsage.aggregate([
        {
            $match: {
                organizationId: new mongoose.Types.ObjectId(organizationId)
            }
        },
        {
            $group: {
                _id: null,
                totalRequests: { $sum: 1 },
                successfulRequests: {
                    $sum: {
                        $cond: [
                            { $and: [{ $gte: ["$statusCode", 200] }, { $lt: ["$statusCode", 300] }] },
                            1,
                            0
                        ]
                    }
                },
                failedRequests: {
                    $sum: {
                        $cond: [
                            { $or: [{ $lt: ["$statusCode", 200] }, { $gte: ["$statusCode", 300] }] },
                            1,
                            0
                        ]
                    }
                },
                averageResponseTime: { $avg: "$responseTime" }
            }
        },
        {
            $project: {
                _id: 0,
                totalRequests: 1,
                successfulRequests: 1,
                failedRequests: 1,
                averageResponseTime: { $round: ["$averageResponseTime", 2] }
            }
        }
    ]);

    return {
        totalRequests: overview?.totalRequests || 0,
        successfulRequests: overview?.successfulRequests || 0,
        failedRequests: overview?.failedRequests || 0,
        averageResponseTime: overview?.averageResponseTime || 0
    };
}

export async function _getRequestsOverTime(organizationId) {
    return ApiUsage.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, requests: { $sum: 1 } } },
        { $project: { _id: 0, date: "$_id", requests: 1 } },
        { $sort: { date: 1 } }
    ]);
}

export async function _getRequestsByApiKey(organizationId) {
    return ApiUsage.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
        { $group: { _id: "$apiKeyId", requests: { $sum: 1 } } },
        { $sort: { requests: -1 } },
        { $lookup: { from: "apikeys", localField: "_id", foreignField: "_id", as: "apiKey" } },
        { $unwind: "$apiKey" },
        { $project: { _id: 0, apiKeyId: "$_id", requests: 1, name: "$apiKey.name", environmentId: "$apiKey.environmentId" } }
    ]);
}

export async function _getRequestsByProject(organizationId) {
    return ApiUsage.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
        { $group: { _id: "$projectId", requests: { $sum: 1 } } },
        { $sort: { requests: -1 } },
        { $lookup: { from: "projects", localField: "_id", foreignField: "_id", as: "project" } },
        { $unwind: "$project" },
        { $project: { _id: 0, projectId: "$_id", requests: 1, name: "$project.name" } }
    ]);
}

export async function _getRequestsByMethod(organizationId) {
    return ApiUsage.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
        { $group: { _id: "$method", requests: { $sum: 1 } } },
        { $sort: { requests: -1 } },
        { $project: { _id: 0, method: "$_id", requests: 1 } }
    ]);
}

export async function _getRequestsByEnvironment(organizationId) {
    return ApiUsage.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
        { $group: { _id: "$environmentId", requests: { $sum: 1 } } },
        { $sort: { requests: -1 } },
        { $lookup: { from: "environments", localField: "_id", foreignField: "_id", as: "environment" } },
        { $unwind: "$environment" },
        { $project: { _id: 0, environmentId: "$_id", name: "$environment.name", requests: 1 } }
    ]);
}

export async function _getRequestsByStatusCode(organizationId) {
    return ApiUsage.aggregate([
        { $match: { organizationId: new mongoose.Types.ObjectId(organizationId) } },
        { $group: { _id: "$statusCode", requests: { $sum: 1 } } },
        { $sort: { requests: -1 } },
        { $project: { _id: 0, statusCode: "$_id", requests: 1 } }
    ]);
}

export async function _getTopEndpoints(organizationId) {
    return ApiUsage.aggregate([
        {
            $match: {
                organizationId: new mongoose.Types.ObjectId(organizationId)
            }
        },

        {
            $group: {
                _id: {
                    method: "$method",
                    endpoint: "$endpoint",
                    upstreamApiId: "$upstreamApiId"
                },
                requests: { $sum: 1 }
            }
        },

        {
            $sort: {
                requests: -1
            }
        },

        {
            $limit: 10
        },

        {
            $lookup: {
                from: "upstreamapis",
                localField: "_id.upstreamApiId",
                foreignField: "_id",
                as: "upstreamApi"
            }
        },

        {
            $unwind: {
                path: "$upstreamApi",
                preserveNullAndEmptyArrays: true
            }
        },

        {
            $lookup: {
                from: "integrations",
                localField: "upstreamApi.integrationId",
                foreignField: "_id",
                as: "integration"
            }
        },

        {
            $unwind: {
                path: "$integration",
                preserveNullAndEmptyArrays: true
            }
        },

        {
            $project: {
                _id: 0,
                method: "$_id.method",
                endpoint: "$_id.endpoint",
                requests: 1,
                integrationId: "$integration._id",
                integrationName: "$integration.name"
            }
        }
    ]);
}
