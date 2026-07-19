import membershipService from "../services/membership.service.js";

class MembershipController {

    async leaveOrganization(req, res, next) {
        try {

            const membership = await
                membershipService.leaveOrganization(
                    req.user._id,
                    req.params.organizationId
                );

            return res.status(200).json({
                success: true,
                message: "Left organization successfully",
                data: membership
            });

        } catch (error) {
            next(error);
        }
    }

    async getOrganizationMembers(req, res, next) {
        try {
            const members = await membershipService.getOrganizationMembers(
                req.user._id,
                req.params.organizationId
            );

            return res.status(200).json({
                success: true,
                message: "Organization members fetched successfully",
                data: members
            });
        } catch (error) {
            next(error);
        }
    }

    async updateMemberRole(req, res, next) {
        try {
            const updatedMember = await membershipService.updateMemberRole(
                req.user._id,
                req.params.organizationId,
                req.params.memberId,
                req.body.role
            );

            res.status(200).json({
                success: true,
                message: "Member role updated successfully.",
                data: updatedMember
            });
        } catch (error) {
            next(error);
        }
    }

    async removeMember(req, res, next) {
        try {
            await membershipService.removeMember(
                req.user._id,
                req.params.organizationId,
                req.params.memberId
            );

            res.status(200).json({
                success: true,
                message: "Member removed successfully."
            });
        } catch (error) {
            next(error);
        }
    }

}

const membershipController = new MembershipController();

export default membershipController;