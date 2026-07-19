import User from "../models/user.model.js";
import jwt from "jsonwebtoken";

import ApiError from "../utils/ApiError.js";

import { ACCOUNT_STATUS } from "../constants/accountStatus.js";

class AuthService {

    async register(userData) {

        const normalizedEmail =
            userData.email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            throw new ApiError(
                409,
                "User already exists with this email."
            );
        }

        const user = await User.create({
            ...userData,
            email: normalizedEmail
        });

        return user;
    }

    async login(loginData) {

        const normalizedEmail =
            loginData.email.trim().toLowerCase();

        const { password } = loginData;

        const user = await User.findOne({
            email: normalizedEmail
        }).select("+password");

        if (!user) {
            throw new ApiError(
                401,
                "Invalid email or password."
            );
        }

        if (user.status !== ACCOUNT_STATUS.ACTIVE) {
            throw new ApiError(
                403,
                "Your account is inactive."
            );
        }

        const isPasswordValid =
            await user.comparePassword(password);

        if (!isPasswordValid) {
            throw new ApiError(
                401,
                "Invalid email or password."
            );
        }

        const token = jwt.sign(
            {
                userId: user._id
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN
            }
        );

        const userObject = user.toObject();
        delete userObject.password;

        return {
            user: userObject,
            token
        };
    }

}

const authService = new AuthService();

export default authService;