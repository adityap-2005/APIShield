import { ORGANIZATION_ROLES } from "../constants/organizationRoles.js";
import { _getOrganizationById } from "../helpers/organization.helper.js";
import {
    _getActiveMembership,
    _validateOrganizationRole
} from "../helpers/membership.helper.js";
import {
    _getOverview,
    _getRequestsOverTime,
    _getRequestsByApiKey,
    _getRequestsByTeam,
    _getRequestsByMethod,
    _getRequestsByEnvironment,
    _getRequestsByStatusCode,
    _getTopEndpoints
} from "../helpers/analytics.helper.js";

class AnalyticsService {

    async getAnalytics(
        organizationId,
        userId
    ) {
        await _getOrganizationById(
            organizationId
        );

        const organizationMembership =
            await _getActiveMembership(
                userId,
                organizationId
            );

        await _validateOrganizationRole(
            organizationMembership,
            [
                ORGANIZATION_ROLES.OWNER,
                ORGANIZATION_ROLES.ADMIN
            ]
        );

        const overview =
            await _getOverview(organizationId);

        const requestsOverTime =
            await _getRequestsOverTime(organizationId);

        const requestsByApiKey =
            await _getRequestsByApiKey(organizationId);

        const requestsByTeam =
            await _getRequestsByTeam(organizationId);

        const requestsByMethod =
            await _getRequestsByMethod(organizationId);

        const requestsByEnvironment =
            await _getRequestsByEnvironment(organizationId);

        const requestsByStatusCode =
            await _getRequestsByStatusCode(organizationId);

        const topEndpoints =
            await _getTopEndpoints(organizationId);

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

}

export default new AnalyticsService();