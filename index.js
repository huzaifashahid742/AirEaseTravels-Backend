import express from "express";
import colors from "colors";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import connectDB from "./DataBase/DataBaseConnection.js";
import router from "./Routes/Add-UniversityRoute.js";
import Programrouter from "./Routes/Add-ProgramRoute.js";
import Whyrouter from "./Routes/WhyCountriesRoute.js";
import Userrouter from "./Routes/UserSignRoute.js";
import Applyrouter from "./Routes/ApplyViaUsRoute.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

dotenv.config();
const app = express();
connectDB();
const Port = process.env.PORT || 7000;

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required in environment variables.");
}

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:3000";
app.use(
    cors({
        origin: corsOrigin.includes(",")
            ? corsOrigin.split(",").map((o) => o.trim())
            : corsOrigin,
    })
);
app.use(helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: false, // Disables strict CSP restrictions for local/multipart streams
    }));
app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/api/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Backend is healthy",
        auth: ["signup", "signin"],
    });
});

app.use("/api/universities", router);
app.use("/api/programs", Programrouter);
app.use("/api/country-details", Whyrouter);
app.use("/api/auth", Userrouter);
app.use("/api/visa-applications", Applyrouter);
app.use(notFound);
app.use(errorHandler);

app.listen(Port, () => {
    console.log(`Port is started at ${Port}`.blue.bold);
});
