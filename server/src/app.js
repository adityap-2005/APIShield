import express from "express";
const app = express();
app.use(express.json())

import authRoutes from "./routes/auth.routes.js";

app.get("/",(req,res)=>{
    res.send("Welcome to APIShield");
})

app.use("/api/v1/auth",authRoutes)

export default app;