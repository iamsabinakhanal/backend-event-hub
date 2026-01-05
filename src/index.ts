// src/index.ts
import dotenv from "dotenv";
dotenv.config(); // load environment variables

import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import { connectDatabase } from "./database/mongodb";
import authRoutes from "./routes/auth_route";

const PORT = process.env.PORT || 5000;

const app: Application = express();

// ------------------ Debug Logs ------------------
console.log("🔹 Event-Hub backend starting...");
console.log("PORT:", PORT);
console.log("Mongo URI:", process.env.MONGO_URI);

// ------------------ Middleware ------------------
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ------------------ Routes ------------------
app.use("/api/auth", authRoutes);

// Root route
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Event-Hub API",
  });
});

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ------------------ Start Server ------------------
async function startServer() {
  console.log("📌 startServer called");

  try {
    console.log("🔌 Connecting to MongoDB...");
    await connectDatabase();
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ Database Connection Error (continuing without DB):", error);
    console.warn("⚠️  Server will run but database features may not work");
  }

  try {
    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
      console.log(`📍 Test with: http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// ✅ Start the server
startServer().catch((error) => {
  console.error("💥 Unhandled error in startServer:", error);
  process.exit(1);
});
