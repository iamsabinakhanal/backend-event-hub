import express, { Application, Request, Response } from 'express';
import bodyParser from 'body-parser';
import { connectDatabase } from './database/mongodb';
import { PORT } from './config';
import authRoutes from "./routes/auth_route";
import adminUserRoutes from "./routes/admin_user_route";
import cors from 'cors';
import path from 'path';
import fs from 'fs';


const app: Application = express();

const corsOptions = {
    origin:[ 'http://localhost:3000', 'http://localhost:3003', 'http://localhost:3005' ],
    optionsSuccessStatus: 200,
    credentials: true,
};
app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '..', 'uploads', 'users');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminUserRoutes);
app.get('/', (req: Request, res: Response) => {
    return res.status(200).json({ success: "true", message: "Welcome to the API" });
});

async function startServer() {
    await connectDatabase();

    app.listen(
        PORT,
        () => {
            console.log(`Server: http://localhost:${PORT}`);
        }
    );
}

startServer();
