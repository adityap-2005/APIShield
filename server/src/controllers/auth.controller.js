import authService from "../services/auth.service.js";
import ApiError from "../utils/ApiError.js";

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
            const { user, accessToken, refreshToken } =
                await authService.login(req.body);

            const refreshCookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "none",
                path: "/api/v1/auth",
                maxAge: 7 * 24 * 60 * 60 * 1000
            };

            res.cookie("refreshToken", refreshToken, refreshCookieOptions);

            return res.status(200).json({
                success: true,
                message: "Login successful",
                accessToken,
                data: user
            });
        } catch (error) {
            next(error);
        }
    }

    async refresh(req, res, next) {
        try {
            const refreshToken = req.cookies.refreshToken;

            if (!refreshToken) {
                throw new ApiError(401, "Refresh token missing.");
            }

            const { accessToken, refreshToken: newRefreshToken } =
                await authService.refreshAccessToken(refreshToken);

            const refreshCookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "none",
                path: "/api/v1/auth",
                maxAge: 7 * 24 * 60 * 60 * 1000
            };

            res.cookie("refreshToken", newRefreshToken, refreshCookieOptions);

            return res.status(200).json({
                success: true,
                message: "Token refreshed successfully.",
                accessToken
            });
        } catch (error) {
            next(error);
        }
    }

    async logout(req, res, next) {
        try {
            await authService.logout(req.cookies.refreshToken);

            const refreshCookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "none",
                path: "/api/v1/auth",
                maxAge: 7 * 24 * 60 * 60 * 1000
            };

            const { maxAge, ...clearOptions } = refreshCookieOptions;
            res.clearCookie("refreshToken", clearOptions);

            return res.status(200).json({
                success: true,
                message: "Logout successful."
            });
        } catch (error) {
            next(error);
        }
    }

    async logoutAll(req, res, next) {
        try {
            await authService.logoutAll(req.user._id);

            const refreshCookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "none",
                path: "/api/v1/auth",
                maxAge: 7 * 24 * 60 * 60 * 1000
            };

            const { maxAge, ...clearOptions } = refreshCookieOptions;
            res.clearCookie("refreshToken", clearOptions);

            return res.status(200).json({
                success: true,
                message: "Logged out from all devices."
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