import express, { Application, Request, Response } from 'express';
import bodyParser from 'body-parser';
import { connectDatabase } from './database/mongodb';
import { PORT } from './config';
import authRoutes from "./routes/auth_route";
import adminUserRoutes from "./routes/admin/user_route";
import contactRoutes from "./routes/contact_routes";
import bookingRoutes from "./routes/booking_routes";
import galleryRoutes from "./routes/gallery_routes";
import servicesRoutes from "./routes/services_routes";
import favoriteRoutes from "./routes/favorite_routes";
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

const servicesUploadsDir = path.join(__dirname, '..', 'uploads', 'services');
if (!fs.existsSync(servicesUploadsDir)) {
    fs.mkdirSync(servicesUploadsDir, { recursive: true });
}

const galleryUploadsDir = path.join(__dirname, '..', 'uploads', 'gallery');
if (!fs.existsSync(galleryUploadsDir)) {
    fs.mkdirSync(galleryUploadsDir, { recursive: true });
}

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminUserRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/favorites', favoriteRoutes);
app.get('/', (req: Request, res: Response) => {
    return res.status(200).json({
        success: true,
        message: "Event Hub API",
        version: "1.0.0",
        endpoints: {
            auth: {
                register: "POST /api/auth/register",
                login: "POST /api/auth/login",
                profile: "GET /api/auth/profile",
                updateProfile: "PUT /api/auth/profile",
                updatePhoto: "PATCH /api/auth/profile/photo"
            },
            bookings: {
                list: "GET /api/bookings",
                create: "POST /api/bookings",
                details: "GET /api/bookings/:id",
                update: "PUT /api/bookings/:id",
                delete: "DELETE /api/bookings/:id"
            },
            services: {
                list: "GET /api/services",
                create: "POST /api/services",
                details: "GET /api/services/:id",
                update: "PUT /api/services/:id",
                delete: "DELETE /api/services/:id"
            },
            gallery: {
                list: "GET /api/gallery",
                upload: "POST /api/gallery",
                delete: "DELETE /api/gallery/:id"
            },
            favorites: {
                list: "GET /api/favorites",
                add: "POST /api/favorites",
                remove: "DELETE /api/favorites/:id"
            },
            contact: {
                list: "GET /api/contact",
                send: "POST /api/contact",
                delete: "DELETE /api/contact/:id"
            }
        }
    });
});

// Development endpoint to reset admin password (remove in production)
app.post('/dev/reset-admin-password', async (req: Request, res: Response) => {
    try {
        const { newPassword } = req.body;
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters"
            });
        }

        const bcryptjs = require('bcryptjs');
        const hashedPassword = await bcryptjs.hash(newPassword, 10);
        
        const UserModel = require('./models/user_model').UserModel;
        const result = await UserModel.findOneAndUpdate(
            { email: 'admin@gmail.com' },
            { password: hashedPassword },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "Admin user not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: `Admin password reset successfully. Email: admin@gmail.com, Password: ${newPassword}`
        });
    } catch (error: any) {
        console.error('[dev/reset-admin-password] error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to reset password"
        });
    }
});

export default app;
