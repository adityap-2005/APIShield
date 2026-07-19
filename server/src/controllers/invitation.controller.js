import invitationService from "../services/invitation.service.js";

class InvitationController {

    async inviteMember(req, res, next) {
        try {

            const invitation = await invitationService.inviteMember(
                req.params.organizationId,
                req.user._id,
                req.body
            );

            return res.status(201).json({
                success: true,
                message: "Invitation sent successfully",
                data: invitation
            })
        } catch (error) {
            next(error);
        }
    }

    async getOrganizationInvitations(req, res, next) {
        try {

            const invitations = await invitationService.getOrganizationInvitations(
                req.params.organizationId,
                req.user._id
            );

            return res.status(200).json({
                success: true,
                data: invitations
            })
        } catch (error) {
            next(error);
        }
    }

    async cancelInvitation(req, res, next) {

        try {

            await invitationService.cancelInvitation(
                req.params.organizationId,
                req.params.invitationId,
                req.user._id
            );

            return res.status(200).json({
                success: true,
                message: "Invitation cancelled successfully."
            });

        } catch (error) {
            next(error);
        }

    }

    async getMyInvitations(req, res, next) {

        try {

            const invitations =
                await invitationService.getMyInvitations(
                    req.user.email
                );

            return res.status(200).json({
                success: true,
                data: invitations
            });

        } catch (error) {
            next(error);
        }

    }

    async acceptInvitation(req, res, next) {
        try {

            const invitation =
                await invitationService.acceptInvitation(
                    req.params.invitationId,
                    req.user
                );

            return res.status(200).json({
                success: true,
                message: "Invitation accepted successfully.",
                data: invitation
            });

        } catch (error) {
            next(error);
        }
    }

    async rejectInvitation(req, res, next) {
        try {

            const invitation = await invitationService.rejectInvitation(
                req.params.invitationId,
                req.user
            );

            return res.status(200).json({
                success: true,
                message: "Invitation rejected successfully.",
                data: invitation
            });

        } catch (error) {
            next(error);
        }
    }
}

const invitationController = new InvitationController();

export default invitationController;