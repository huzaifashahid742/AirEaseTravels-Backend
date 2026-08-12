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

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required in environment variables.");
}

const Port = process.env.PORT || 7000;

const normalizeOrigin = (origin) => String(origin || "").trim().replace(/\/$/, "");

const resolveCorsOrigins = () => {
    const configured = [
        process.env.CORS_ORIGIN,
        process.env.CORS,
        process.env.FRONTEND_URL,
    ]
        .filter(Boolean)
        .flatMap((value) => String(value).split(","))
        .map(normalizeOrigin)
        .filter(Boolean);

    const origins = [...new Set(configured)];

    if (process.env.NODE_ENV !== "production") {
        origins.push("http://localhost:3000");
    }

    return [...new Set(origins.filter(Boolean))];
};

const allowedOrigins = resolveCorsOrigins();

const isAllowedOrigin = (origin) => {
    if (!origin) return true;

    const normalized = normalizeOrigin(origin);
    if (allowedOrigins.includes(normalized)) return true;

    // Vercel production + preview deploy URLs for this project
    if (/^https:\/\/aireasetravelstours([-a-z0-9]+)?\.vercel\.app$/i.test(normalized)) {
        return true;
    }

    return false;
};

if (allowedOrigins.length === 0) {
    console.warn(
        "No CORS origins configured. Set CORS_ORIGIN on the Railway service (not only project shared vars).".yellow
    );
} else {
    console.log(`CORS configured origins: ${allowedOrigins.join(", ")}`.green);
}
console.log("CORS also allows aireasetravelstours*.vercel.app preview deployments.".green);

app.use(
    cors({
        origin(origin, callback) {
            if (isAllowedOrigin(origin)) {
                return callback(null, true);
            }
            console.warn(`CORS blocked origin: ${origin}`.yellow);
            return callback(null, false);
        },
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);
app.use(helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: false,
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

const startServer = async () => {
    await connectDB();
    app.listen(Port, () => {
        console.log(`Port is started at ${Port}`.blue.bold);
    });
};

startServer();
