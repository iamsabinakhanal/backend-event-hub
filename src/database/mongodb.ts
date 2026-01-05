import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // load .env variables

const MONGODB_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/event-hub";

export async function connectDatabase() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB for Event Hub");
    } catch (error) {
        console.error("❌ Database Connection Error:", error);
        process.exit(1); // stop app if DB fails
    }
}