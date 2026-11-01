import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { ACCOUNT_STATUS } from "../constants/accountStatus.js";

const protect = async (req, res, next) => {
    try {

        const authHeader = req.headers.authorization;

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.status !== ACCOUNT_STATUS.ACTIVE) {
            return res.status(403).json({
                success: false,
                message: "Your account is inactive."
            });
        }

        req.user = user;

        next();

    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token"
        });

    }
};

export default protect;