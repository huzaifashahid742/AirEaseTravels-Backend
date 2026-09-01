import express from "express";
import colors from 'colors'
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import passport from "passport";
import morgan from "morgan";
import path from "path";
import connectDB, { getDbStatus, requireDb, startDbReconnectLoop } from "./DataBase/DataBaseConnection.js";
import router from "./Routes/Add-UniversityRoute.js";
import Programrouter from "./Routes/Add-ProgramRoute.js";
import Whyrouter from "./Routes/WhyCountriesRoute.js";
import Userrouter from "./Routes/UserSignRoute.js";
import Applyrouter from "./Routes/ApplyViaUsRoute.js";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import passportroutes from './passport.js';

dotenv.config();
const app = express();
app.set('trust proxy', 1);

const logEnv = (name) => {
    const value = process.env[name];
    const status = value ? "set" : "MISSING";
    return Boolean(value);
};

const hasMongo = logEnv("MONGO_URI");
const hasJwt = logEnv("JWT_SECRET");
const hasCors = logEnv("CORS_ORIGIN");
logEnv("FRONTEND_URL");
logEnv("PORT");
logEnv("EMAIL_USER");
logEnv("EMAIL_PASS");

if (!hasMongo || !hasJwt) {
    console.error(
        "Error.".red.bold
    );
}
if (!hasCors) {
    console.warn("CORS ORIGIN Error.".yellow);
}

if (!process.env.JWT_SECRET) {
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
app.use(passport.initialize());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/api/health", (req, res) => {
    const db = getDbStatus();
    res.status(200).json({
        success: true,
        message: db.connected ? "Backend is healthy" : "Backend online, database disconnected",
        database: db.connected ? "connected" : "disconnected",
        ...(db.lastError && !db.connected ? { dbError: db.lastError } : {}),
        auth: ["signup", "signin"],
    });
});

app.use("/api/universities", requireDb, router);
app.use("/api/programs", requireDb, Programrouter);
app.use("/api/country-details", requireDb, Whyrouter);
app.use("/api/auth", requireDb, passportroutes);
app.use("/api/auth", requireDb, Userrouter);
app.use("/api/visa-applications", requireDb, Applyrouter);
app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
    app.listen(Port, "0.0.0.0", () => {
        console.log(`Port is started at ${Port}`.blue.bold);
    });

    await connectDB();
    startDbReconnectLoop();
};

startServer().catch((error) => {
    console.error(`Fatal startup error: ${error.message}`.red.bold);
    process.exit(1);
});
