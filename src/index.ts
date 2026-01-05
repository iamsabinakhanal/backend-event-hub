import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import { connectDatabase } from "./database/mongodb";
import { PORT } from "./config";
import authRoutes from "./routes/auth_route";

const app: Application = express();

// ------------------ Middleware ------------------
// Parse JSON bodies
app.use(bodyParser.json());
// Parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// ------------------ Routes ------------------
// Authentication routes
app.use("/api/auth", authRoutes);

// Root route
app.get("/", (req: Request, res: Response) => {
    return res.status(200).json({
        success: true,
        message: "Welcome to Event-Hub API",
    });
});

// ------------------ Start Server ------------------
async function startServer() {
    try {
        await connectDatabase(); // Connect to MongoDB
        app.listen(PORT, () => {
            console.log(`✅ Event-Hub Server running at http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("❌ Failed to start server:", error);
        process.exit(1);
    }
}

// Start the server
startServer();
