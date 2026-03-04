import { Request, Response, NextFunction } from "express";

/**
 * Wrapper for async route handlers to catch errors automatically
 */
export const asyncHandler = (fn: (req: any, res: Response, next: NextFunction) => Promise<any>) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            // If response is already sent, don't send again
            if (res.headersSent) return;
            
            const statusCode = error.statusCode || 500;
            const message = error.message || "Internal Server Error";
            
            res.status(statusCode).json({
                success: false,
                message,
            });
        });
    };
};
