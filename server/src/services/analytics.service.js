import mongoose from "mongoose";

import Organization from "../models/organization.model.js";
import Membership from "../models/membership.model.js";
import ApiUsage from "../models/apiUsage.model.js";

import { ORGANIZATION_ROLES } from "../constants/organizationRoles.js";
import { MEMBERSHIP_STATUS } from "../constants/membershipStatus.js";

import ApiError from "../utils/ApiError.js";

class AnalyticsService {

    async getAnalytics(
        organizationId,
        userId
    ) {
        await this._validateOrganization(
            organizationId
        );

        const organizationMembership =
            await this._getActiveMembership(
                userId,
                organizationId
            );

        await this._validateOrganizationRole(
            organizationMembership,
            [
                ORGANIZATION_ROLES.OWNER,
                ORGANIZATION_ROLES.ADMIN
            ]
        );

        const overview =
            await this._getOverview(organizationId);

        const requestsOverTime =
            await this._getRequestsOverTime(organizationId);

        const requestsByApiKey =
            await this._getRequestsByApiKey(organizationId);

        const requestsByTeam =
            await this._getRequestsByTeam(organizationId);

        const requestsByMethod =
            await this._getRequestsByMethod(organizationId);

        const requestsByEnvironment =
            await this._getRequestsByEnvironment(organizationId);

        const requestsByStatusCode =
            await this._getRequestsByStatusCode(organizationId);

        const topEndpoints =
            await this._getTopEndpoints(organizationId);

        return {
            overview,
            requestsOverTime,
            requestsByApiKey,
            requestsByTeam,
            requestsByMethod,
            requestsByEnvironment,
            requestsByStatusCode,
            topEndpoints
        };
    }

    async _getOverview(
        organizationId) {
        const [overview] =
            await ApiUsage.aggregate([
                {
                    $match: {
                        organizationId:
                            new mongoose.Types.ObjectId(
                                organizationId
                            )
                    }
                },
                {
                    $group: {
                        _id: null,

                        totalRequests: {
                            $sum: 1
                        },

                        successfulRequests: {
                            $sum: {
                                $cond: [
                                    {
                                        $and: [
                                            {
                                                $gte: [
                                                    "$statusCode",
                                                    200
                                                ]
                                            },
                                            {
                                                $lt: [
                                                    "$statusCode",
                                                    300
                                                ]
                                            }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },

                        failedRequests: {
                            $sum: {
                                $cond: [
                                    {
                                        $or: [
                                            {
                                                $lt: [
                                                    "$statusCode",
                                                    200
                                                ]
                                            },
                                            {
                                                $gte: [
                                                    "$statusCode",
                                                    300
                                                ]
                                            }
                                        ]
                                    },
                                    1,
                                    0
                                ]
                            }
                        },

                        averageResponseTime: {
                            $avg: "$responseTime"
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalRequests: 1,
                        successfulRequests: 1,
                        failedRequests: 1,
                        averageResponseTime: {
                            $round: [
                                "$averageResponseTime",
                                2
                            ]
                        }
                    }
                }
            ]);

        return {
            totalRequests:
                overview?.totalRequests || 0,

            successfulRequests:
                overview?.successfulRequests || 0,

            failedRequests:
                overview?.failedRequests || 0,

            averageResponseTime:
                overview?.averageResponseTime || 0
        };
    }

    async _getRequestsOverTime(
        organizationId
    ) {
        const requestsOverTime =
            await ApiUsage.aggregate([
                {
                    $match: {
                        organizationId:
                            new mongoose.Types.ObjectId(
                                organizationId
                            )
                    }
                },

                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$createdAt"
                            }
                        },

                        requests: {
                            $sum: 1
                        }
                    }
                },

                {
                    $project: {
                        _id: 0,

                        date: "$_id",

                        requests: 1
                    }
                },

                {
                    $sort: {
                        date: 1
                    }
                }
            ]);

        return requestsOverTime;
    }

    async _getRequestsByApiKey(
        organizationId
    ) {
        const requestsByApiKey =
            await ApiUsage.aggregate([
                {
                    $match: {
                        organizationId:
                            new mongoose.Types.ObjectId(
                                organizationId
                            )
                    }
                },

                {
                    $group: {
                        _id: "$apiKeyId",

                        requests: {
                            $sum: 1
                        }
                    }
                },

                {
                    $sort: {
                        requests: -1
                    }
                },

                {
                    $lookup: {
                        from: "apikeys",

                        localField: "_id",

                        foreignField: "_id",

                        as: "apiKey"
                    }
                },

                {
                    $unwind: "$apiKey"
                },

                {
                    $project: {
                        _id: 0,

                        apiKeyId: "$_id",

                        requests: 1,

                        name: "$apiKey.name",

                        environment:
                            "$apiKey.environment"
                    }
                }
            ]);

        return requestsByApiKey;
    }

    async _getRequestsByTeam(
        organizationId
    ) {
        const requestsByTeam =
            await ApiUsage.aggregate([
                {
                    $match: {
                        organizationId:
                            new mongoose.Types.ObjectId(
                                organizationId
                            )
                    }
                },

                {
                    $group: {
                        _id: "$teamId",

                        requests: {
                            $sum: 1
                        }
                    }
                },

                {
                    $sort: {
                        requests: -1
                    }
                },

                {
                    $lookup: {
                        from: "teams",

                        localField: "_id",

                        foreignField: "_id",

                        as: "team"
                    }
                },

                {
                    $unwind: "$team"
                },

                {
                    $project: {
                        _id: 0,

                        teamId: "$_id",

                        requests: 1,

                        name: "$team.name"
                    }
                }
            ]);

        return requestsByTeam;
    }

    async _getRequestsByMethod(
        organizationId
    ) {
        const requestsByMethod =
            await ApiUsage.aggregate([
                {
                    $match: {
                        organizationId:
                            new mongoose.Types.ObjectId(
                                organizationId
                            )
                    }
                },

                {
                    $group: {
                        _id: "$method",

                        requests: {
                            $sum: 1
                        }
                    }
                },

                {
                    $sort: {
                        requests: -1
                    }
                },

                {
                    $project: {
                        _id: 0,

                        method: "$_id",

                        requests: 1
                    }
                }
            ]);

        return requestsByMethod;
    }

    async _getRequestsByEnvironment(
        organizationId
    ) {
        const requestsByEnvironment =
            await ApiUsage.aggregate([
                {
                    $match: {
                        organizationId:
                            new mongoose.Types.ObjectId(
                                organizationId
                            )
                    }
                },

                {
                    $group: {
                        _id: "$environment",

                        requests: {
                            $sum: 1
                        }
                    }
                },

                {
                    $sort: {
                        requests: -1
                    }
                },

                {
                    $project: {
                        _id: 0,

                        environment: "$_id",

                        requests: 1
                    }
                }
            ]);

        return requestsByEnvironment;
    }

    async _getRequestsByStatusCode(
        organizationId
    ) {
        const requestsByStatusCode =
            await ApiUsage.aggregate([
                {
                    $match: {
                        organizationId:
                            new mongoose.Types.ObjectId(
                                organizationId
                            )
                    }
                },

                {
                    $group: {
                        _id: "$statusCode",

                        requests: {
                            $sum: 1
                        }
                    }
                },

                {
                    $sort: {
                        requests: -1
                    }
                },

                {
                    $project: {
                        _id: 0,

                        statusCode: "$_id",

                        requests: 1
                    }
                }
            ]);

        return requestsByStatusCode;
    }

    async _getTopEndpoints(
        organizationId
    ) {
        const topEndpoints =
            await ApiUsage.aggregate([
                {
                    $match: {
                        organizationId:
                            new mongoose.Types.ObjectId(
                                organizationId
                            )
                    }
                },

                {
                    $group: {
                        _id: {
                            method: "$method",
                            endpoint: "$endpoint"
                        },

                        requests: {
                            $sum: 1
                        }
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
                    $project: {
                        _id: 0,

                        method: "$_id.method",

                        endpoint: "$_id.endpoint",

                        requests: 1
                    }
                }
            ]);

        return topEndpoints;
    }

    async _getOrganizationById(organizationId) {
        const organization = await Organization.findById(organizationId);

        if (!organization) {
            throw new ApiError(404, "Organization not found.");
        }

        return organization;
    }

    async _validateOrganization(organizationId) {

        const organization = await Organization.findById(
            organizationId
        );

        if (!organization) {
            throw new ApiError(
                404,
                "Organization not found.");
        }

        return organization;
    }

    async _validateOrganizationRole(
        membership,
        allowedRoles
    ) {
        if (!allowedRoles.includes(membership.role)) {
            throw new ApiError(
                403,
                "You are not authorized to perform this action."
            );
        }
    }

    async _getActiveMembership(
        userId, organizationId) {

        await this._getOrganizationById(
            organizationId
        );

        const membership = await Membership.findOne({
            userId,
            organizationId,
            status: MEMBERSHIP_STATUS.ACTIVE
        });

        if (!membership) {
            throw new ApiError(
                403,
                "You are not an active member of this organization."
            );
        }

        return membership;
    }

    async _validateManagementPermission(
        requesterMembership,
        targetMembership
    ) {
        if (
            requesterMembership.role === ORGANIZATION_ROLES.OWNER
        ) {
            return;
        }

        if (
            requesterMembership.role === ORGANIZATION_ROLES.ADMIN &&
            targetMembership.role === ORGANIZATION_ROLES.DEVELOPER
        ) {
            return;
        }

        throw new ApiError(
            403,
            "You do not have permission to perform this action."
        );
    }
}

export default new AnalyticsService();