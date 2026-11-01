import express from "express";
import authController from "../controllers/auth.controller.js";
import protect from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", authController.register);

router.post("/login", authController.login);

router.post(
    "/refresh",
    authController.refresh.bind(authController)
);

router.post(
    "/logout",
    authController.logout.bind(authController)
);

router.post(
    "/logout-all",
    protect,
    authController.logoutAll.bind(authController)
);

router.get("/me", protect, authController.getProfile);

router.get(
    "/verify-email",
    authController.verifyEmail.bind(authController)
);

router.patch(
    "/profile",
    protect,
    authController.updateProfile
);

export default router;

