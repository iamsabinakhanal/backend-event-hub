import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        role: string;
    };
}

// Helper function to extract token from cookies
const getTokenFromCookies = (cookieHeader: string | undefined): string | null => {
    if (!cookieHeader) return null;
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
    }, {} as Record<string, string>);
    return cookies['auth_token'] || null;
};

// Middleware to verify JWT token
export const authorizedMiddleware = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        let token: string | null = null;

        // Try to get token from Authorization header first
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7); // Remove 'Bearer ' prefix
        }
        
        // If no Authorization header, try to get token from cookies
        if (!token) {
            token = getTokenFromCookies(req.headers.cookie);
        }

        if (!token) {
            console.log('[authorizedMiddleware] No token provided. Headers:', {
                authorization: req.headers.authorization,
                cookie: req.headers.cookie,
                path: req.path,
                method: req.method
            });
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided. Please include Authorization header or auth_token cookie.' 
            });
        }

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
export const adminOnlyMiddleware = (req: Request, res: Response, next: NextFunction) => {
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
