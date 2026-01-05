import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // load .env variables

const MONGODB_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/event-hub";

export async function connectDatabase() {
    try {
        console.log(`🔗 Attempting to connect to: ${MONGODB_URI}`);
        
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // 5 second timeout
            socketTimeoutMS: 45000,
        });
        
        console.log("✅ Connected to MongoDB for Event Hub");
    } catch (error) {
        console.error("❌ Database Connection Error:", error);
        throw error; // Re-throw to be handled by caller
    }
}