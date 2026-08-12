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

const connectDB = async () => {
    try {
        const mongoURI = sanitizeMongoUri(
            process.env.MONGO_URI || "mongodb://127.0.0.1:27017/AirEaseTravelsDatabase"
        );

        if (!mongoURI) {
            throw new Error("MONGO_URI is empty. Set it in Railway service variables.");
        }

        const conn = await mongoose.connect(mongoURI);
        console.log(`MongoDB Connected: ${conn.connection.host}`.cyan);
    } catch (error) {
        console.error(`MongoDB connection failed: ${error.message}`.red.bold);
        console.error(
            "Check MONGO_URI on Railway: no quotes, URL-encode special characters in the password.".yellow
        );
        process.exit(1);
    }
};

export default connectDB;
