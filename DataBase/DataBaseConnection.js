import mongoose from "mongoose";

const sanitizeMongoUri = (uri) => {
    let value = String(uri || "").trim();
    if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
    ) {
        value = value.slice(1, -1).trim();
    }
    return value;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let lastDbError = null;
let reconnectTimer = null;

export const isDbConnected = () => mongoose.connection.readyState === 1;
export const getDbStatus = () => ({
    connected: isDbConnected(),
    lastError: lastDbError,
});

export const requireDb = (req, res, next) => {
    if (isDbConnected()) return next();
    return res.status(503).json({
        success: false,
        message: "Database is not connected.",
        ...(lastDbError && { detail: lastDbError }),
    });
};

const connectDB = async ({ retries = 5, delayMs = 5000, silent = false } = {}) => {
    if (isDbConnected()) return true;

    const mongoURI = sanitizeMongoUri(process.env.MONGO_URI);

    if (!mongoURI) {
        lastDbError = "MONGO_URI is missing.";
        if (!silent) console.error(lastDbError.red.bold);
        return false;
    }

    const hasPlaceholder = /<(db_)?(username|password)>/i.test(mongoURI);
    if (hasPlaceholder) {
        lastDbError = "Contains Atlas placeholders. Share real variables.";
        if (!silent) {
            console.error("Still contains Atlas placeholders.".red.bold);
        }
        return false;
    }

    for (let attempt = 1; attempt <= retries; attempt += 1) {
        try {
            await mongoose.connect(mongoURI);
            lastDbError = null;
            if (!silent) console.log(`MongoDB Connected: ${mongoose.connection.host}`.cyan);
            return true;
        } catch (error) {
            lastDbError = error.message;
            if (!silent) {
                console.error(
                    `MongoDB connection attempt ${attempt}/${retries} failed: ${error.message}`.red.bold
                );
                if (attempt < retries) {
                    console.log(`Retrying MongoDB in ${delayMs / 1000}s...`.yellow);
                    await sleep(delayMs);
                }
            }
        }
    }

    if (!silent) {
        console.error(
            "MongoDB connection failed. API return 503 until DB connects.".red.bold
        );
    }
    return false;
};

export const startDbReconnectLoop = () => {
    if (reconnectTimer) return;

    reconnectTimer = setInterval(async () => {
        if (isDbConnected()) return;
        await connectDB({ retries: 1, delayMs: 0, silent: true });
        if (isDbConnected()) {
            console.log("MongoDB reconnected successfully.".green);
        }
    }, 30000);
};

export default connectDB;
