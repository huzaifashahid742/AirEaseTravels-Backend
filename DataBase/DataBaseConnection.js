import mongoose from "mongoose";
import colors from "colors";

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

export const isDbConnected = () => mongoose.connection.readyState === 1;

export const requireDb = (req, res, next) => {
    if (isDbConnected()) return next();
    return res.status(503).json({
        success: false,
        message: "Database is not connected yet. Check MONGO_URI on Railway.",
    });
};

const connectDB = async ({ retries = 5, delayMs = 5000 } = {}) => {
    const mongoURI = sanitizeMongoUri(process.env.MONGO_URI);

    if (!mongoURI) {
        console.error("MONGO_URI is missing. Set it in Railway service variables.".red.bold);
        return false;
    }

    const hasPlaceholder = /<(db_)?(username|password)>/i.test(mongoURI);
    if (hasPlaceholder) {
        console.error("MONGO_URI still contains Atlas placeholders (<db_password> etc.).".red.bold);
        console.error(
            "On Railway: open Project Settings -> Shared Variables -> click SHARE for each variable and select AirEaseTravels-Backend.".yellow
        );
        return false;
    }

    for (let attempt = 1; attempt <= retries; attempt += 1) {
        try {
            await mongoose.connect(mongoURI);
            console.log(`MongoDB Connected: ${mongoose.connection.host}`.cyan);
            return true;
        } catch (error) {
            console.error(
                `MongoDB connection attempt ${attempt}/${retries} failed: ${error.message}`.red.bold
            );
            if (attempt < retries) {
                console.log(`Retrying MongoDB in ${delayMs / 1000}s...`.yellow);
                await sleep(delayMs);
            }
        }
    }

    console.error(
        "MongoDB connection failed after all retries. Server stays online for health checks; API routes return 503 until DB connects.".red.bold
    );
    console.error(
        "Fix MONGO_URI on Railway: no quotes, URL-encode special characters in the password.".yellow
    );
    return false;
};

export default connectDB;
