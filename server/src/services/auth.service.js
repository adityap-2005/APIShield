import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import ApiError from "../utils/ApiError.js";
import { generateEmailVerificationToken } from "../utils/emailVerification.js";
import emailService from "./email.service.js";

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

        const {
            rawToken,
            tokenHash,
            tokenExpiry
        } = generateEmailVerificationToken();

        const user = await User.create({
            ...userData,
            email: normalizedEmail,
            isVerified: false,
            verificationTokenHash: tokenHash,
            verificationTokenExpiry: tokenExpiry
        });

        await emailService.sendVerificationEmail(
            normalizedEmail,
            rawToken
        );

        const userObject = user.toObject();

        delete userObject.password;
        delete userObject.verificationTokenHash;
        delete userObject.verificationTokenExpiry;

        return userObject;
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

        // if (!user.isVerified) {
        //     throw new ApiError(
        //         403,
        //         "Please verify your email before logging in."
        //     );
        // }

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

    async verifyEmail(rawToken) {

        const tokenHash = crypto
            .createHash("sha256")
            .update(rawToken)
            .digest("hex");

        const user = await User.findOne({
            verificationTokenHash: tokenHash
        });

        if (!user) {
            throw new ApiError(
                400,
                "Invalid verification token."
            );
        }

        if (
            !user.verificationTokenExpiry ||
            user.verificationTokenExpiry < new Date()
        ) {
            throw new ApiError(
                400,
                "Verification token has expired."
            );
        }

        user.isVerified = true;

        user.verificationTokenHash = null;
        user.verificationTokenExpiry = null;

        await user.save();

        return {
            message: "Email verified successfully."
        };
    }

    async updateProfile(userId, name) {

        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(
                404,
                "User not found."
            );
        }

        user.name = name;

        await user.save();

        const userObject = user.toObject();

        delete userObject.password;
        delete userObject.verificationTokenHash;
        delete userObject.verificationTokenExpiry;

        return userObject;
    }
}

const authService = new AuthService();

export default authService;