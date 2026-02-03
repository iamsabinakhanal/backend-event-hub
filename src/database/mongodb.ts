import mongoose from "mongoose";
import { MONGODB_URI } from "../config";
import { UserModel } from "../models/user_model";

export async function connectDatabase(){
    try{
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");
        // Ensure indexes match schema (fixes stale unique index settings)
        await UserModel.syncIndexes();
        console.log("User indexes synced");
    }catch(error){
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
}