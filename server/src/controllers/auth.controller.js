import authService from "../services/auth.service.js";

class AuthController {
    async register(req, res, next) {
        try {
            const user = await authService.register(req.body);

            return res.status(201).json({
                success: true,
                message: "User registered successfully",
                data: user,
            });
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { user, token } = await authService.login(req.body);

            return res.status(200).json({
                success: true,
                message: "Login successful",
                token,
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    async getProfile(req, res) {
        return res.status(200).json({
            success: true,
            message: "Profile fetched successfully",
            data: req.user
        });
    }

    async verifyEmail(req, res, next) {
        try {
            const { token } = req.query;

            const result = await authService.verifyEmail(token);

            return res.status(200).json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    }

    async updateProfile(req, res, next) {
        try {
            const { name } = req.body;

            const user =
                await authService.updateProfile(
                    req.user._id,
                    name
                );

            return res.status(200).json({
                success: true,
                message: "Profile updated successfully",
                data: user
            });
        } catch (error) {
            next(error);
        }
    }
}

const authController = new AuthController();

export default authController;