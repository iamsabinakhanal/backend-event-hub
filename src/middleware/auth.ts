import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';
import { HttpError } from '../errors/http-errors';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        role: string;
    };
}

// Middleware to verify JWT token
export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        const decoded = jwt.verify(token, JWT_SECRET) as any;
        
        (req as AuthRequest).user = {
            id: decoded.id,
            email: decoded.email,
            firstName: decoded.firstName,
            lastName: decoded.lastName,
            role: decoded.role
        };

        next();
    } catch (error) {
        return res.status(401).json({ 
            success: false, 
            message: 'Invalid or expired token' 
        });
    }
};

// Middleware to check if user is admin
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as AuthRequest).user;

        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Authentication required' 
            });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied. Admin privileges required.' 
            });
        }

        next();
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
};
