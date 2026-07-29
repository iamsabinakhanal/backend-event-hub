import dotenv from 'dotenv';
import crypto from 'node:crypto';
dotenv.config();

export const PORT: number = process.env.PORT ? parseInt(process.env.PORT) : 5050;
export const MONGODB_URI: string = process.env.MONGODB_URI || 'mongodb://localhost:27017/event_hub';
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
	throw new Error('JWT_SECRET must be configured in production');
}
export const JWT_SECRET: string = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const configuredJwtLifetime = process.env.JWT_EXPIRES_IN || '15d';
const jwtLifetimeMatch = configuredJwtLifetime.match(/^(\d+)([smhd])$/);
const jwtLifetimeSeconds = jwtLifetimeMatch
	? Number(jwtLifetimeMatch[1]) * ({ s: 1, m: 60, h: 3600, d: 86400 }[jwtLifetimeMatch[2] as 's' | 'm' | 'h' | 'd'] || 0)
	: 0;
if (!jwtLifetimeMatch || jwtLifetimeSeconds < 15 * 24 * 60 * 60) {
	throw new Error('JWT_EXPIRES_IN must be a duration of at least 15 days, for example 15d');
}
export const JWT_EXPIRES_IN: string = configuredJwtLifetime;
export const AUTH_ENCRYPTION_KEY: string = process.env.AUTH_ENCRYPTION_KEY || JWT_SECRET;
export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
export const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
export const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5050/api/auth/oauth/google/callback';
