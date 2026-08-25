import crypto from "crypto";

export const generateEmailVerificationToken = () => {
    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

    const tokenExpiry = new Date(
        Date.now() + 30 * 60 * 1000
    );

    return {
        rawToken,
        tokenHash,
        tokenExpiry
    };
};