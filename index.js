import express from "express";
import colors from "colors";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import connectDB, { isDbConnected, requireDb } from "./DataBase/DataBaseConnection.js";
import router from "./Routes/Add-UniversityRoute.js";
import Programrouter from "./Routes/Add-ProgramRoute.js";
import Whyrouter from "./Routes/WhyCountriesRoute.js";
import Userrouter from "./Routes/UserSignRoute.js";
import Applyrouter from "./Routes/ApplyViaUsRoute.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";

dotenv.config();
const app = express();

const logEnv = (name) => {
    const value = process.env[name];
    const status = value ? "set" : "MISSING";
    console.log(`${name}: ${status}`.yellow);
    return Boolean(value);
};

console.log("Environment check:".yellow);
const hasMongo = logEnv("MONGO_URI");
const hasJwt = logEnv("JWT_SECRET");
const hasCors = logEnv("CORS_ORIGIN");
logEnv("FRONTEND_URL");
logEnv("PORT");

if (!hasMongo || !hasJwt) {
    console.error(
        "Required Railway variables missing on THIS service. Shared Variables with a yellow ! are not linked yet — click SHARE and select AirEaseTravels-Backend.".red.bold
    );
}
if (!hasCors) {
    console.warn("CORS_ORIGIN not set; allowing aireasetravelstours*.vercel.app via code fallback.".yellow);
}

if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is required in Railway service variables.".red.bold);
    process.exit(1);
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

    if (/^https:\/\/aireasetravelstours([-a-z0-9]+)?\.vercel\.app$/i.test(normalized)) {
        return true;
    }

    return false;
};

if (allowedOrigins.length === 0) {
    console.warn(
        "No CORS origins configured. Set CORS_ORIGIN on the Railway service.".yellow
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
        message: isDbConnected() ? "Backend is healthy" : "Backend online, database connecting",
        database: isDbConnected() ? "connected" : "disconnected",
        auth: ["signup", "signin"],
    });
});

app.use("/api/universities", requireDb, router);
app.use("/api/programs", requireDb, Programrouter);
app.use("/api/country-details", requireDb, Whyrouter);
app.use("/api/auth", requireDb, Userrouter);
app.use("/api/visa-applications", requireDb, Applyrouter);
app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
    app.listen(Port, "0.0.0.0", () => {
        console.log(`Port is started at ${Port}`.blue.bold);
    });

    await connectDB();
};

startServer().catch((error) => {
    console.error(`Fatal startup error: ${error.message}`.red.bold);
    process.exit(1);
});
