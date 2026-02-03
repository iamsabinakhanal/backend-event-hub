import mongoose, { Document, Schema } from "mongoose";
import { UserType } from "../types/user_type";
const UserSchema: Schema = new Schema<UserType>(
    {
        email: { type: String, required: true, unique: true, sparse: true, trim: true, lowercase: true },
        password: { type: String, required: true },
        firstName: { type: String },
        lastName: { type: String },
        image: { type: String }, // User profile image path
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        }
    },
    {
        timestamps: true, // auto createdAt and updatedAt
    }
);

export interface IUser extends UserType, Document { // combine UserType and Document
    _id: mongoose.Types.ObjectId; // mongo related attribute/ custom attributes
    createdAt: Date;
    updatedAt: Date;
}

export const UserModel = mongoose.model<IUser>('User', UserSchema);
// UserModel is the mongoose model for User collection
// db.users in MongoDB