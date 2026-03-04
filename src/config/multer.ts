import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import fs from 'fs';

// Define storage configuration for users
const userStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/users';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${randomUUID()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// Define storage configuration for services
const serviceStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/services';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${randomUUID()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// Define storage configuration for gallery
const galleryStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/gallery';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${randomUUID()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// File filter to accept only images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'));
    }
};

// Configure multer for users
export const upload = multer({
    storage: userStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// Configure multer for services
export const serviceUpload = multer({
    storage: serviceStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// Configure multer for gallery
export const galleryUpload = multer({
    storage: galleryStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});
