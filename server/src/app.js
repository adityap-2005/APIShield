import express from "express";
const app = express();
app.use(express.json());

import errorHandler from "./middleware/error.middleware.js";

import authRoutes from "./routes/auth.routes.js";
import organizationRoutes from "./routes/organization.routes.js"
import invitationRoutes from "../src/routes/invitation.routes.js";

app.get("/",(req,res)=>{
    res.send("Welcome to APIShield");
});

app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

app.use("/api/v1/auth",authRoutes);
app.use("/api/v1/organizations",organizationRoutes);
app.use("/api/v1/invitations",invitationRoutes);

app.use(errorHandler);

export default app;