import mongoose from "mongoose";
import User from "../models/user.model.js";
import Session from "../models/session.model.js";
import crypto from "crypto";
import {
    generateAccessToken,
    generateRefreshToken,
    hashRefreshToken
} from "../utils/token.js";

import ApiError from "../utils/ApiError.js";
import { generateEmailVerificationToken } from "../utils/emailVerification.js";
import emailService from "./email.service.js";

import { ACCOUNT_STATUS } from "../constants/accountStatus.js";

class AuthService {

    async register(userData) {
        if (!userData.password) {
            throw new ApiError(400, "Password is required.");
        }
        
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
        const normalizedEmail = loginData.email.trim().toLowerCase();
        const { password } = loginData;

        const user = await User.findOne({
            email: normalizedEmail
        }).select("+password");

        if (!user) {
            throw new ApiError(401, "Invalid email or password.");
        }

        if (user.status !== ACCOUNT_STATUS.ACTIVE) {
            throw new ApiError(403, "Your account is inactive.");
        }

        if (!user.password) {
            throw new ApiError(
                401,
                "This account uses social login. Please sign in with your provider."
            );
        }

        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            throw new ApiError(401, "Invalid email or password.");
        }

        const { accessToken, refreshToken } =
            await this.createSession(user._id);

        const userObject = user.toObject();

        delete userObject.password;
        delete userObject.verificationTokenHash;
        delete userObject.verificationTokenExpiry;

        return {
            user: userObject,
            accessToken,
            refreshToken
        };
    }

    async createSession(userId) {
        const accessToken = generateAccessToken(userId);

        const refreshToken = generateRefreshToken();

        const tokenHash = hashRefreshToken(refreshToken);

        const familyId = crypto.randomUUID();

        const refreshTokenExpiry = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        );

        await Session.create({
            user: userId,
            tokenHash,
            familyId,
            expiresAt: refreshTokenExpiry
        });

        return {
            accessToken,
            refreshToken
        };
    }

    async refreshAccessToken(refreshToken) {
        const tokenHash = hashRefreshToken(refreshToken);

        const session = await Session.findOne({
            tokenHash
        });

        if (!session) {
            throw new ApiError(401, "Invalid refresh token.");
        }

        if (session.revokedAt) {
            await Session.updateMany(
                {
                    familyId: session.familyId,
                    revokedAt: null
                },
                {
                    revokedAt: new Date()
                }
            );

            throw new ApiError(
                401,
                "Refresh token reuse detected. Please log in again."
            );
        }

        if (session.expiresAt <= new Date()) {
            throw new ApiError(401, "Refresh token expired.");
        }

        const user = await User.findById(session.user);

        if (!user || user.status !== ACCOUNT_STATUS.ACTIVE) {
            throw new ApiError(401, "Invalid user session.");
        }

        const newRefreshToken = generateRefreshToken();
        const newTokenHash = hashRefreshToken(newRefreshToken);

        const newAccessToken = generateAccessToken(user._id);

        const newSessionId = new mongoose.Types.ObjectId();

        const newExpiresAt = new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
        );

        const dbSession = await mongoose.startSession();

        try {
            await dbSession.withTransaction(async () => {
                const result = await Session.updateOne(
                    {
                        _id: session._id,
                        revokedAt: null,
                        expiresAt: { $gt: new Date() }
                    },
                    {
                        $set: {
                            revokedAt: new Date(),
                            replacedBy: newSessionId
                        }
                    },
                    { session: dbSession }
                );

                if (result.modifiedCount !== 1) {
                    throw new ApiError(
                        401,
                        "Refresh token has already been used."
                    );
                }

                await Session.create(
                    [{
                        _id: newSessionId,
                        user: user._id,
                        tokenHash: newTokenHash,
                        familyId: session.familyId,
                        expiresAt: newExpiresAt
                    }],
                    { session: dbSession }
                );
            });
        } finally {
            await dbSession.endSession();
        }

        return {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        };
    }

    async logout(refreshToken) {
        if (!refreshToken) {
            return;
        }

        const tokenHash = hashRefreshToken(refreshToken);

        const session = await Session.findOne({
            tokenHash,
            revokedAt: null
        });

        if (session) {
            session.revokedAt = new Date();
            await session.save();
        }
    }

    async logoutAll(userId) {
        await Session.updateMany(
            {
                user: userId,
                revokedAt: null
            },
            {
                $set: {
                    revokedAt: new Date()
                }
            }
        );
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