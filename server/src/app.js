import express from "express";
import cors from "cors";

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://apishield-app.vercel.app"
  ],
  credentials: true
}));

app.use(express.json());

import errorHandler from "./middleware/error.middleware.js";

import authRoutes from "./routes/auth.routes.js";
import organizationRoutes from "./routes/organization.routes.js"
import invitationRoutes from "../src/routes/invitation.routes.js";
import apiKeyRoutes from "./routes/apiKey.routes.js";
import demoRoutes from "../src/routes/demo.routes.js";
import auditLogRoutes from "../src/routes/auditLog.routes.js";
import analyticsRouter from "../src/routes/analytics.routes.js";

app.get("/", (req, res) => {
    res.send("Welcome to APIShield");
});

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/organizations", organizationRoutes);
app.use("/api/v1/invitations", invitationRoutes);
app.use(
    "/api/v1/organizations/:organizationId/teams/:teamId/api-keys",
    apiKeyRoutes
);
app.use("/api/v1/demo", demoRoutes);
app.use(
    "/api/v1",
    auditLogRoutes
);
app.use(
    "/api/v1",
    analyticsRouter
);

app.use(errorHandler);

export default app;
