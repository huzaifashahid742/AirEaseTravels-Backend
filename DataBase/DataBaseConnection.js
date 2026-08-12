import mongoose from "mongoose";
import colors from "colors";

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/AirEaseTravelsDatabase";
        const conn = await mongoose.connect(mongoURI);
        console.log(`MongoDB Connected: ${conn.connection.host}`.cyan);
    } catch (error) {
        console.error(`Error: ${error.message}`.red.bold);
        process.exit(1);
    }
};

export default connectDB;