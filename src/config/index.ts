import dotenv from 'dotenv';
import { process } from 'zod/v4/core';
dotenv.config();

export const PORT: number = 
        process.env.PORT ? parseInt(process.env.PORT) : 5050;
export const MONGODB_URI: string =
        process.env.MONGODB_URI || 'mongodb://localhost:27017/webapi_backend';
export const JWT_SECRET: string = 
        process.env.JWT_SECRET || 'default_secret';