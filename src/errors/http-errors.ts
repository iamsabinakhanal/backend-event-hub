/**
 * Custom HttpError class for Event-Hub backend
 * Can be thrown anywhere in services or controllers
 * to standardize error responses
 */
export class HttpError extends Error {
    statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message); // Call the base Error constructor
        this.statusCode = statusCode;

        // Set the prototype explicitly (required for TypeScript)
        Object.setPrototypeOf(this, HttpError.prototype);

        // Optional: capture stack trace
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
