import mongoose, { Document, Schema } from "mongoose";
import { UserType } from "../types/user_type";

/**
 * User Schema for Event-Hub
 * Defines how user data is stored in MongoDB
 */
const UserSchema: Schema = new Schema<UserType>(
    {
        email: {
            type: String,
            required: true,
            unique: true, // ensures no duplicate emails
        },
        password: {
            type: String,
            required: true, // hashed password
        },
        username: {
            type: String,
            required: true,
            unique: true, // ensures no duplicate usernames
        },
        firstName: { type: String },
        lastName: { type: String },
        role: {
            type: String,
            enum: ['user', 'admin'], // restrict to these values
            default: 'user',
        },
    },
    {
        timestamps: true, // automatically adds createdAt and updatedAt
    }
);

/**
 * IUser interface
 * Combines UserType from DTO/types and Mongoose Document
 */
export interface IUser extends UserType, Document {
    _id: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * UserModel
 * The actual Mongoose model to interact with the 'users' collection
 */
export const UserModel = mongoose.model<IUser>('User', UserSchema);
